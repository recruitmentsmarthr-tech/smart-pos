from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import database
import models
from typing import Optional

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

class DashboardStats(BaseModel):
    total_revenue: float
    vouchers_issued: int
    new_customers: int
    products_in_stock: int

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(database.get_db)):
    total_revenue = db.query(func.sum(models.Voucher.total_amount)).scalar() or 0
    vouchers_issued = db.query(func.count(models.Voucher.id)).scalar() or 0
    new_customers = db.query(func.count(models.Customer.id)).scalar() or 0
    
    # Ensure that we handle None from sum() if stock is empty
    products_in_stock_query = db.query(func.sum(models.Stock.quantity)).scalar()
    products_in_stock = products_in_stock_query if products_in_stock_query is not None else 0

    return {
        "total_revenue": total_revenue,
        "vouchers_issued": vouchers_issued,
        "new_customers": new_customers,
        "products_in_stock": products_in_stock
    }
