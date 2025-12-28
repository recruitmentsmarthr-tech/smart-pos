from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- TOKEN SCHEMAS (For Login) ---
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
    role: str = "staff" # Default to staff

class UserCreate(UserBase):
    password: str  # We only need the password when CREATING the user

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # This tells Pydantic to read data from SQLAlchemy models

# --- CATEGORY SCHEMAS ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# --- STOCK SCHEMAS ---
class StockBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    quantity: int = 0
    category_id: Optional[int] = None
    arrival_date: Optional[datetime] = None

class StockCreate(StockBase):
    pass

class StockOut(StockBase):
    id: int
    last_sold_at: Optional[datetime] = None
    
    # We can include the category name here for the frontend to display easily
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True

# --- VOUCHER / SALES SCHEMAS ---
# This is for the "Item" inside the shopping cart
class VoucherItemCreate(BaseModel):
    product_id: int
    quantity: int

# This is what the Frontend sends to "Complete Sale"
class VoucherCreate(BaseModel):
    items: List[VoucherItemCreate]
    customer_id: Optional[int] = None

# This is for viewing a receipt later
class VoucherItemOut(BaseModel):
    product_id: int
    product_name: str # We will manually fill this in the API
    quantity: int
    price_at_sale: float
    subtotal: float

class VoucherOut(BaseModel):
    id: int
    voucher_number: str
    total_amount: float
    created_at: datetime
    staff_id: int
    items: List[VoucherItemOut] # Nested list of items!

    class Config:
        from_attributes = True