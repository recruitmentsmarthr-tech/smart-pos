from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import datetime
import models, schemas, database, auth

router = APIRouter(
    prefix="/vouchers",
    tags=["Vouchers"]
)

@router.get("/", response_model=schemas.VoucherPaginationResponse)
def get_vouchers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    customer_name: str = None,
    staff_id: int = None,
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(database.get_db)
):
    """
    Retrieves a paginated list of vouchers with sorting and filtering.
    """
    query = db.query(models.Voucher).options(
        joinedload(models.Voucher.customer),
        joinedload(models.Voucher.items).joinedload(models.VoucherItem.product)
    )

    # Filtering
    if customer_name:
        query = query.join(models.Customer).filter(models.Customer.name.ilike(f"%{customer_name}%"))
    if staff_id:
        query = query.filter(models.Voucher.staff_id == staff_id)
    if start_date:
        query = query.filter(models.Voucher.created_at >= start_date)
    if end_date:
        query = query.filter(models.Voucher.created_at <= end_date)

    # Sorting
    if hasattr(models.Voucher, sort_by):
        sort_column = getattr(models.Voucher, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    # Pagination
    total = query.count()
    vouchers = query.offset((page - 1) * limit).limit(limit).all()

    # Manually construct the response to avoid Pydantic serialization errors
    response_items = []
    for voucher in vouchers:
        items_out = []
        for item in voucher.items:
            items_out.append(schemas.VoucherItemOut(
                product_id=item.product_id,
                product_name=item.product.name if item.product else "N/A",
                quantity=item.quantity,
                price_at_sale=item.price_at_sale,
                subtotal=item.subtotal,
                total_quantity_sold=0  # Set to 0 for performance on list view
            ))
        
        # Safely create CustomerOut from voucher.customer
        customer_out = schemas.CustomerOut.from_orm(voucher.customer) if voucher.customer else None

        response_items.append(schemas.VoucherOut(
            id=voucher.id,
            voucher_number=voucher.voucher_number,
            total_amount=voucher.total_amount,
            total_discount=voucher.total_discount or 0.0,
            discount_percentage=voucher.discount_percentage or 0.0,
            discount_amount=voucher.discount_amount or 0.0,
            created_at=voucher.created_at,
            staff_id=voucher.staff_id,
            delivery_address=voucher.delivery_address,
            items=items_out,
            customer=customer_out
        ))

    return {
        "items": response_items,
        "total": total,
        "page": page,
        "size": limit
    }

@router.get("/{voucher_id}", response_model=schemas.VoucherOut)
def get_voucher(voucher_id: int, db: Session = Depends(database.get_db)):
    """
    Retrieves a single voucher by its ID with all its items and customer info.
    """
    voucher = db.query(models.Voucher).options(
        joinedload(models.Voucher.customer),
        joinedload(models.Voucher.items).joinedload(models.VoucherItem.product)
    ).filter(models.Voucher.id == voucher_id).first()

    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    # The total_quantity_sold needs to be calculated for each item
    # This is not stored in the DB, so we calculate it on the fly
    product_ids = [item.product_id for item in voucher.items]
    
    total_sales = db.query(
        models.VoucherItem.product_id,
        func.sum(models.VoucherItem.quantity).label("total_sold")
    ).filter(models.VoucherItem.product_id.in_(product_ids)).group_by(
        models.VoucherItem.product_id
    ).all()
        
    sales_map = {sale.product_id: sale.total_sold for sale in total_sales}

    voucher_items_out = []
    for item in voucher.items:
        total_quantity_sold = sales_map.get(item.product_id, 0)
        voucher_items_out.append(schemas.VoucherItemOut(
            product_id=item.product_id,
            product_name=item.product.name,
            quantity=item.quantity,
            price_at_sale=item.price_at_sale,
            subtotal=item.subtotal,
            total_quantity_sold=total_quantity_sold
        ))

    return schemas.VoucherOut(
        id=voucher.id,
        voucher_number=voucher.voucher_number,
        total_amount=voucher.total_amount,
        total_discount=voucher.total_discount or 0.0,
        discount_percentage=voucher.discount_percentage or 0.0,
        discount_amount=voucher.discount_amount or 0.0,
        created_at=voucher.created_at,
        staff_id=voucher.staff_id,
        delivery_address=voucher.delivery_address,
        items=voucher_items_out,
        customer=voucher.customer
    )

@router.post("/", response_model=List[schemas.VoucherOut], status_code=status.HTTP_201_CREATED)
def create_voucher(
    batch_data: schemas.VoucherCreate, # Now expects a list of SingleVoucherRequest
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Creates one or more sales vouchers in a batch. Each voucher can have its own customer, discounts, and delivery address.
    """
    
    try:
        all_voucher_items_to_create_across_batch = []
        all_product_ids_across_batch = set()

        # Aggregate all items from all single voucher requests for a single stock validation pass
        for single_voucher_request in batch_data.vouchers:
            for item_in in single_voucher_request.items:
                all_product_ids_across_batch.add(item_in.product_id)
                # Store original SingleVoucherRequest item for later use
                all_voucher_items_to_create_across_batch.append(item_in)
        
        if not all_voucher_items_to_create_across_batch:
            raise HTTPException(status_code=400, detail="Batch voucher creation cannot be with no items.")

        # 1. Pre-computation and Stock Validation (happens once for the whole batch)
        # Consolidate quantities for each product across all vouchers in the batch
        consolidated_quantities = {}
        for item_in in all_voucher_items_to_create_across_batch:
            consolidated_quantities[item_in.product_id] = consolidated_quantities.get(item_in.product_id, 0) + item_in.quantity

        products = db.query(models.Stock).filter(models.Stock.id.in_(list(all_product_ids_across_batch))).with_for_update().all()
        product_map = {p.id: p for p in products}

        if len(products) != len(all_product_ids_across_batch):
            found_ids = {p.id for p in products}
            missing_ids = all_product_ids_across_batch - found_ids
            raise HTTPException(status_code=404, detail=f"One or more products not found: {list(missing_ids)}")

        now = datetime.utcnow()
        for product_id, requested_quantity in consolidated_quantities.items():
            product = product_map.get(product_id)
            if product.quantity < requested_quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested across batch: {requested_quantity}")
            # Temporarily decrement quantity for validation of subsequent vouchers in the same batch
            product.quantity -= requested_quantity # Decrement here for the whole batch

        created_vouchers = []
        for single_voucher_request in batch_data.vouchers:
            voucher_items_for_this_voucher = []
            subtotal_for_this_voucher = 0

            # Re-evaluate items for this single voucher based on already validated stock
            for item_in in single_voucher_request.items:
                product = product_map.get(item_in.product_id) # Get from the already fetched and updated map
                
                price_for_this_sale = product.price
                if product.discount_percent and product.discount_percent > 0:
                    is_after_start = product.discount_start_date is None or now >= product.discount_start_date
                    is_before_end = product.discount_end_date is None or now <= product.discount_end_date
                    if is_after_start and is_before_end:
                        price_for_this_sale = product.price * (1 - product.discount_percent / 100)
                
                item_subtotal = price_for_this_sale * item_in.quantity
                subtotal_for_this_voucher += item_subtotal
                
                voucher_items_for_this_voucher.append({
                    "product_id": product.id,
                    "quantity": item_in.quantity,
                    "price_at_sale": price_for_this_sale,
                    "subtotal": item_subtotal
                })
            
            # Apply individual voucher's discounts
            percentage_discount_value = subtotal_for_this_voucher * (single_voucher_request.discount_percentage / 100) if single_voucher_request.discount_percentage else 0
            total_calculated_discount = percentage_discount_value + (single_voucher_request.discount_amount or 0)
            final_amount = subtotal_for_this_voucher - total_calculated_discount
            if final_amount < 0:
                final_amount = 0

            new_voucher = models.Voucher(
                voucher_number=f"INV-{datetime.utcnow().strftime('%Y%m%d-%H%M%S%f')}",
                total_amount=final_amount,
                total_discount=total_calculated_discount,
                discount_percentage=single_voucher_request.discount_percentage,
                discount_amount=single_voucher_request.discount_amount,
                staff_id=current_user.id,
                customer_id=single_voucher_request.customer_id,
                delivery_address=single_voucher_request.delivery_address
            )
            db.add(new_voucher)
            db.flush() 

            for item_data in voucher_items_for_this_voucher:
                new_item = models.VoucherItem(
                    voucher_id=new_voucher.id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    price_at_sale=item_data["price_at_sale"],
                    subtotal=item_data["subtotal"]
                )
                db.add(new_item)
            
            created_vouchers.append(new_voucher)

        # 4. Update real stock quantities once (already done in step 1, now just mark last_sold_at for all affected products)
        for product_id in all_product_ids_across_batch:
            product_map.get(product_id).last_sold_at = datetime.utcnow()

        db.commit()

        # 5. Refresh and construct response
        response_vouchers = []
        for v in created_vouchers:
            db.refresh(v)
            # Eagerly load relationships needed for the response
            db.query(models.Voucher).filter_by(id=v.id).options(joinedload(models.Voucher.items).joinedload(models.VoucherItem.product), joinedload(models.Voucher.customer)).one()

            items_out = []
            for item in v.items:
                items_out.append(schemas.VoucherItemOut(
                    product_id=item.product.id, # Use item.product.id
                    product_name=item.product.name if item.product else "N/A",
                    quantity=item.quantity,
                    price_at_sale=item.price_at_sale,
                    subtotal=item.subtotal,
                    total_quantity_sold=0 # Set to 0 for a new voucher creation
                ))
            
            customer_out = schemas.CustomerOut.from_orm(v.customer) if v.customer else None

            response_vouchers.append(schemas.VoucherOut(
                id=v.id,
                voucher_number=v.voucher_number,
                total_amount=v.total_amount,
                total_discount=v.total_discount or 0.0,
                discount_percentage=v.discount_percentage or 0.0,
                discount_amount=v.discount_amount or 0.0,
                created_at=v.created_at,
                staff_id=v.staff_id,
                delivery_address=v.delivery_address,
                items=items_out,
                customer=customer_out
            ))
        return response_vouchers

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        # It's better to log the error `e` here
        raise HTTPException(status_code=500, detail="An unexpected error occurred during voucher creation.")
