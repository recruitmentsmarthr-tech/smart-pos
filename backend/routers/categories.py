from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database, auth

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.post("/", response_model=schemas.CategoryOut)
def create_category(
    category: schemas.CategoryCreate, 
    db: Session = Depends(database.get_db)
    # REMOVED current_user dependency for testing
):
    """Adds a new category. Converts name to UPPERCASE for consistency."""
    existing = db.query(models.Category).filter(models.Category.name == category.name.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already registered")
        
    db_cat = models.Category(name=category.name.upper())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.get("/", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(database.get_db)):
    """Fetch all categories for the dropdowns and management list."""
    return db.query(models.Category).all()

@router.post("/ss", response_model=schemas.CategoryOut)
def create_category(
    category: schemas.CategoryCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Adds a new category. Converts name to UPPERCASE for consistency."""
    existing = db.query(models.Category).filter(models.Category.name == category.name.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already registered")
        
    db_cat = models.Category(name=category.name.upper())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/{cat_id}")
def delete_category(
    cat_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Deletes a category if no stock items are currently linked to it."""
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Safety Check: Prevent orphaned stock items
    has_products = db.query(models.Stock).filter(models.Stock.category_id == cat_id).first()
    if has_products:
        raise HTTPException(status_code=400, detail="Cannot delete: Category is still assigned to active stock.")

    db.delete(db_cat)
    db.commit()
    return {"detail": "Category purged successfully"}

@router.put("/{cat_id}", response_model=schemas.CategoryOut)
def update_category(
    cat_id: int,
    category: schemas.CategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Updates a category's name."""
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")

    processed_name = category.name.strip().upper()
    if not processed_name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty.")

    existing = db.query(models.Category).filter(models.Category.name == processed_name, models.Category.id != cat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Another category with this name already exists.")

    db_cat.name = processed_name
    db.commit()
    db.refresh(db_cat)
    return db_cat