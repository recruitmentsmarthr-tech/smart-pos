from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional
import os, shutil, json
import models, schemas, auth, database

# Determine the base directory of the backend application (D:/smart-pos/backend)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_UPLOAD_DIR = os.path.join(BASE_DIR, "static_images")

# Ensure the directory exists when the app starts
if not os.path.exists(IMAGE_UPLOAD_DIR):
    os.makedirs(IMAGE_UPLOAD_DIR)

router = APIRouter(
    prefix="/stock",
    tags=["Stock"]
)

@router.post("/")
async def create_stock_item(
    name: str = Form(...),
    price: float = Form(...),
    cost_price: float = Form(None),
    quantity: int = Form(...),
    category_id: int = Form(None),
    description: str = Form(None),
    arrival_date: Optional[datetime] = Form(None),
    discount_percent: Optional[float] = Form(0.0),
    discount_start_date: Optional[datetime] = Form(None),
    discount_end_date: Optional[datetime] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Handles multi-image upload and stock creation with Audit Logging."""
    if current_user.role not in ["manager", "staff"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Strip whitespace from the name and convert to lowercase
    processed_name = name.strip().lower()
    if not processed_name:
        raise HTTPException(status_code=400, detail="Stock item name cannot be empty.")

    # Check for existing stock item with the same name (case-insensitive)
    existing_stock = db.query(models.Stock).filter(models.Stock.name == processed_name).first()
    if existing_stock:
        raise HTTPException(status_code=400, detail=f"Stock item with name '{name}' already exists.")

    saved_paths = []
    if files:
        for file in files:
            file_path = os.path.join(IMAGE_UPLOAD_DIR, file.filename) # Full path for saving
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            relative_file_path = os.path.relpath(file_path, BASE_DIR) # Store relative path from BASE_DIR in DB
            saved_paths.append(relative_file_path)

    stock_data = {
        "name": processed_name,
        "price": price,
        "cost_price": cost_price,
        "quantity": quantity,
        "category_id": category_id,
        "description": description,
        "images": saved_paths,
        "discount_percent": discount_percent,
        "discount_start_date": discount_start_date,
        "discount_end_date": discount_end_date,
    }
    if arrival_date:
        stock_data['arrival_date'] = arrival_date
        
    new_stock = models.Stock(**stock_data)
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)

    # Log the creation event
    new_value_json = json.dumps({c.name: getattr(new_stock, c.name) for c in new_stock.__table__.columns}, default=str)
    audit = models.AuditLog(
        action="CREATE_STOCK", table_name="stock", record_id=new_stock.id,
        new_value=new_value_json,
        user_id=current_user.id
    )
    db.add(audit)
    db.commit()
    return new_stock

@router.get("/", response_model=schemas.StockPaginationResponse)
def get_stock_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    sort_by: str = Query("id"),
    sort_order: str = Query("desc"),
    name: Optional[str] = None,
    category_id: Optional[str] = None,
    sell_price_gt: Optional[str] = None,
    sell_price_lt: Optional[str] = None,
    buy_price_gt: Optional[str] = None,
    buy_price_lt: Optional[str] = None,
    quantity_gt: Optional[str] = None,
    quantity_lt: Optional[str] = None,
    total_sold_gt: Optional[str] = None,
    total_sold_lt: Optional[str] = None,
    arrival_date_eq: Optional[str] = None,
    arrival_date_start: Optional[str] = None,
    arrival_date_end: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Advanced retrieval with dynamic sorting and 'Total Sold' calculation."""
    # 1. Calculate sales per product
    sales_sub = db.query(
        models.VoucherItem.product_id,
        func.sum(models.VoucherItem.quantity).label("total_sold")
    ).group_by(models.VoucherItem.product_id).subquery()

    # 2. Main Query joining Sales and Categories
    query = db.query(
        models.Stock,
        func.coalesce(sales_sub.c.total_sold, 0).label("total_sold")
    ).outerjoin(sales_sub, models.Stock.id == sales_sub.c.product_id)\
     .outerjoin(models.Category, models.Stock.category_id == models.Category.id)

    # 3. Apply Filters
    if name:
        query = query.filter(models.Stock.name.ilike(f"%{name}%"))
    if category_id:
        try:
            cat_id = int(category_id)
            query = query.filter(models.Stock.category_id == cat_id)
        except (ValueError, TypeError):
            pass
    if sell_price_gt:
        try:
            price = float(sell_price_gt)
            query = query.filter(models.Stock.price > price)
        except (ValueError, TypeError):
            pass
    if sell_price_lt:
        try:
            price = float(sell_price_lt)
            query = query.filter(models.Stock.price < price)
        except (ValueError, TypeError):
            pass
    if buy_price_gt:
        try:
            price = float(buy_price_gt)
            query = query.filter(models.Stock.cost_price > price)
        except (ValueError, TypeError):
            pass
    if buy_price_lt:
        try:
            price = float(buy_price_lt)
            query = query.filter(models.Stock.cost_price < price)
        except (ValueError, TypeError):
            pass
    if quantity_gt:
        try:
            qty = int(quantity_gt)
            query = query.filter(models.Stock.quantity > qty)
        except (ValueError, TypeError):
            pass
    if quantity_lt:
        try:
            qty = int(quantity_lt)
            query = query.filter(models.Stock.quantity < qty)
        except (ValueError, TypeError):
            pass
    if total_sold_gt:
        try:
            qty = int(total_sold_gt)
            query = query.filter(func.coalesce(sales_sub.c.total_sold, 0) > qty)
        except (ValueError, TypeError):
            pass
    if total_sold_lt:
        try:
            qty = int(total_sold_lt)
            query = query.filter(func.coalesce(sales_sub.c.total_sold, 0) < qty)
        except (ValueError, TypeError):
            pass
    if arrival_date_eq:
        try:
            date = datetime.fromisoformat(arrival_date_eq)
            query = query.filter(models.Stock.arrival_date == date)
        except (ValueError, TypeError):
            pass
    if arrival_date_start and arrival_date_end:
        try:
            start = datetime.fromisoformat(arrival_date_start)
            end = datetime.fromisoformat(arrival_date_end)
            query = query.filter(models.Stock.arrival_date.between(start, end))
        except (ValueError, TypeError):
            pass

    # 4. Sorting Logic
    if sort_by == "total_sold":
        sort_attr = func.coalesce(sales_sub.c.total_sold, 0)
    elif hasattr(models.Stock, sort_by):
        sort_attr = getattr(models.Stock, sort_by)
    else:
        sort_attr = models.Stock.id

    query = query.order_by(sort_attr.desc() if sort_order == "desc" else sort_attr.asc())

    # 5. Execute with Pagination
    total_count = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    now = datetime.utcnow()
    for stock_obj, total_sold in results:
        is_on_sale = False
        sale_price = None

        if stock_obj.discount_percent and stock_obj.discount_percent > 0:
            # A discount is active if the current time is within the date range.
            # If a start date is not set, the sale is active from the beginning of time.
            # If an end date is not set, the sale is active indefinitely.
            is_after_start = stock_obj.discount_start_date is None or now >= stock_obj.discount_start_date
            is_before_end = stock_obj.discount_end_date is None or now <= stock_obj.discount_end_date

            if is_after_start and is_before_end:
                is_on_sale = True
                sale_price = stock_obj.price * (1 - stock_obj.discount_percent / 100)

        item_out = schemas.StockOut.model_validate({
            **stock_obj.__dict__,
            "total_sold": int(total_sold),
            "is_on_sale": is_on_sale,
            "sale_price": sale_price
        })
        items.append(item_out)

    return {"items": items, "total": total_count, "page": page, "size": limit}

@router.get("/{stock_id}", response_model=schemas.StockOut)
def get_stock_item(
    stock_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retrieves a single stock item by its ID, including total sold quantity and sale price."""
    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock item not found")

    # Calculate total sold quantity for this specific item
    total_sold_result = db.query(func.sum(models.VoucherItem.quantity)).filter(models.VoucherItem.product_id == stock_id).scalar()
    
    # The result can be None if there are no sales, so default to 0
    db_stock.total_sold = total_sold_result or 0

    # Calculate sale price
    is_on_sale = False
    sale_price = None
    now = datetime.utcnow()
    if db_stock.discount_percent and db_stock.discount_percent > 0:
        is_after_start = db_stock.discount_start_date is None or now >= db_stock.discount_start_date
        is_before_end = db_stock.discount_end_date is None or now <= db_stock.discount_end_date
        if is_after_start and is_before_end:
            is_on_sale = True
            sale_price = db_stock.price * (1 - db_stock.discount_percent / 100)

    return schemas.StockOut.model_validate({
        **db_stock.__dict__,
        "is_on_sale": is_on_sale,
        "sale_price": sale_price
    })


@router.delete("/{stock_id}")
def delete_stock_item(
    stock_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Deletes a stock item if it has not been sold."""
    if current_user.role not in ["manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock item not found")

    has_been_sold = db.query(models.VoucherItem).filter(models.VoucherItem.product_id == stock_id).first()
    if has_been_sold:
        raise HTTPException(status_code=400, detail="Cannot delete item that has been sold. Consider setting quantity to 0.")

    # Also delete images from the filesystem
    if db_stock.images:
        for image_path in db_stock.images:
            if os.path.exists(image_path):
                os.remove(image_path)

    db.delete(db_stock)
    db.commit()
    return {"detail": "Stock item deleted successfully"}

@router.put("/{stock_id}", response_model=schemas.StockOut)
def update_stock_item(
    stock_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
    name: str = Form(...),
    price: float = Form(...),
    cost_price: float = Form(None),
    quantity: int = Form(...),
    category_id: int = Form(...),
    description: str = Form(None),
    arrival_date: Optional[datetime] = Form(None),
    discount_percent: Optional[float] = Form(None),
    discount_start_date: Optional[datetime] = Form(None),
    discount_end_date: Optional[datetime] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    images_to_delete: Optional[str] = Form(None) # JSON string of URLs
):
    """Updates a stock item, including images."""
    if current_user.role not in ["manager"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    db_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="Stock item not found")

    # For audit log
    old_value_json = json.dumps({c.name: getattr(db_stock, c.name) for c in db_stock.__table__.columns}, default=str)

    print(f"\n--- DEBUG LOG for Stock ID {stock_id} (START) ---")
    print(f"Images in DB before update: {db_stock.images}")
    print(f"Received images_to_delete: {images_to_delete}")

    # Handle name update
    processed_name = name.strip().lower()
    if not processed_name:
        raise HTTPException(status_code=400, detail="Stock item name cannot be empty.")
    
    existing_stock = db.query(models.Stock).filter(models.Stock.name == processed_name, models.Stock.id != stock_id).first()
    if existing_stock:
        raise HTTPException(status_code=400, detail=f"Another stock item with name '{name}' already exists.")
    
    db_stock.name = processed_name
    
    # Update other text fields
    db_stock.price = price
    db_stock.cost_price = cost_price
    db_stock.quantity = quantity
    db_stock.category_id = category_id
    db_stock.description = description
    db_stock.discount_percent = discount_percent
    db_stock.discount_start_date = discount_start_date
    db_stock.discount_end_date = discount_end_date
    if arrival_date:
        db_stock.arrival_date = arrival_date

    # Ensure db_stock.images is always a list
    if db_stock.images is None:
        db_stock.images = []

    # Handle image deletion
    if images_to_delete:
        to_delete_relative_paths = json.loads(images_to_delete)
        print(f"Parsed to_delete_relative_paths: {to_delete_relative_paths}")

        for relative_path in to_delete_relative_paths:
            print(f"Attempting to delete: {relative_path}")
            full_path_to_delete = os.path.join(BASE_DIR, relative_path)
            if os.path.exists(full_path_to_delete):
                os.remove(full_path_to_delete)
                print(f"Physically deleted file: {full_path_to_delete}")
            else:
                print(f"File not found on disk: {full_path_to_delete}")
            
            # Filter out the relative_path from db_stock.images directly
            original_images_len = len(db_stock.images)
            db_stock.images = [img for img in db_stock.images if img != relative_path]
            if len(db_stock.images) < original_images_len:
                print(f"Successfully removed '{relative_path}' from db_stock.images list in memory.")
            else:
                print(f"'{relative_path}' not found in db_stock.images list for filtering in memory.")

    print(f"Images in DB in memory after deletion processing: {db_stock.images}")

    # Handle new image uploads
    saved_paths = []
    if files:
        for file in files:
            file_path = os.path.join(IMAGE_UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            relative_file_path = os.path.relpath(file_path, BASE_DIR)
            saved_paths.append(relative_file_path)

    # Append new paths to db_stock.images
    db_stock.images.extend(saved_paths)
    
    db.add(db_stock) # Explicitly add to session just in case
    db.commit()
    db.refresh(db_stock)
    print(f"Images in DB after commit and refresh: {db_stock.images}")

    # --- VERIFICATION STEP: Re-fetch from DB and print ---
    re_fetched_stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if re_fetched_stock:
        print(f"VERIFICATION: Re-fetched images from DB for Stock ID {stock_id}: {re_fetched_stock.images}")
    else:
        print(f"VERIFICATION: Failed to re-fetch Stock ID {stock_id}.")
    # ----------------------------------------------------

    print(f"--- END DEBUG LOG for Stock ID {stock_id} (END) ---\n")

    # Log the update event
    new_value_json = json.dumps({c.name: getattr(db_stock, c.name) for c in db_stock.__table__.columns}, default=str)
    audit = models.AuditLog(
        action="UPDATE_STOCK", table_name="stock", record_id=db_stock.id,
        old_value=old_value_json,
        new_value=new_value_json,
        user_id=current_user.id
    )
    db.add(audit)
    db.commit() # This commit is for the audit log, not the stock update itself.

    return db_stock