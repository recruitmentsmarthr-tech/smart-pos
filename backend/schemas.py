from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "staff"

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- CATEGORY SCHEMAS ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

# Pagination Wrapper for Customers
class CustomerPaginationResponse(BaseModel):
    items: List[CustomerOut]
    total: int
    page: int
    size: int

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None


# --- STOCK SCHEMAS ---
class StockBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    quantity: int = 0
    arrival_date: Optional[datetime] = None
    discount_percent: Optional[float] = 0.0
    discount_start_date: Optional[datetime] = None
    discount_end_date: Optional[datetime] = None

class StockCreate(StockBase):
    # When creating, we only send the ID of the category
    category_id: Optional[int] = None

class StockUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    quantity: Optional[int] = None
    category_id: Optional[int] = None
    arrival_date: Optional[datetime] = None
    discount_percent: Optional[float] = None
    discount_start_date: Optional[datetime] = None
    discount_end_date: Optional[datetime] = None

class StockOut(StockBase):
    id: int
    category: Optional[CategoryOut] = None 
    images: List[str] = [] 
    last_sold_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    total_sold: int = 0
    is_on_sale: bool = False
    sale_price: Optional[float] = None

    class Config:
        from_attributes = True

# Pagination Wrapper
class StockPaginationResponse(BaseModel):
    items: List[StockOut]
    total: int
    page: int
    size: int

# --- VOUCHER / SALES SCHEMAS ---
class VoucherItemCreate(BaseModel):
    product_id: int
    quantity: int

# NEW: Schema for a single voucher's data
class SingleVoucherRequest(BaseModel):
    items: List[VoucherItemCreate]
    customer_id: Optional[int] = None
    discount_percentage: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    delivery_address: Optional[str] = None # Delivery address for *this specific* voucher

# MODIFIED: VoucherCreate now expects a list of SingleVoucherRequest
class VoucherCreate(BaseModel):
    vouchers: List[SingleVoucherRequest]

class VoucherItemOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price_at_sale: float
    subtotal: float
    total_quantity_sold: int

class VoucherOut(BaseModel):
    id: int
    voucher_number: str
    total_amount: float
    total_discount: float
    discount_percentage: float
    discount_amount: float
    created_at: datetime
    staff_id: int
    delivery_address: Optional[str] = None
    items: List[VoucherItemOut]
    customer: Optional[CustomerOut] = None

    class Config:
        from_attributes = True

# Pagination Wrapper for Vouchers
class VoucherPaginationResponse(BaseModel):
    items: List[VoucherOut]
    total: int
    page: int
    size: int