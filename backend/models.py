from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# 1. USERS TABLE (Manager & Staff)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # "manager" or "staff"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# 2. CATEGORIES TABLE (Groups products like "Drinks", "Snacks")
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Relationship: A category has many products
    products = relationship("Stock", back_populates="category")

# 3. STOCK TABLE (Your Inventory)
class Stock(Base):
    __tablename__ = "stock"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    quantity = Column(Integer, default=0)
    price = Column(Float)  # Selling Price
    cost_price = Column(Float, nullable=True) # Buying Price (for profit calc)
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    arrival_date = Column(DateTime, default=datetime.utcnow) # For tracking age
    last_sold_at = Column(DateTime, nullable=True) # Updates when sold
    
    # Relationships
    category = relationship("Category", back_populates="products")

# 4. CUSTOMERS TABLE
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String, unique=True, nullable=True)
    email = Column(String, nullable=True)
    points = Column(Integer, default=0) # For loyalty program later
    created_at = Column(DateTime, default=datetime.utcnow)

# 5. VOUCHERS TABLE (The Receipt Header)
class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_number = Column(String, unique=True, index=True) # E.g., "INV-2025-001"
    total_amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    staff_id = Column(Integer, ForeignKey("users.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    # Relationship: One voucher has many items
    items = relationship("VoucherItem", back_populates="voucher")

# 6. VOUCHER ITEMS TABLE (The items inside the receipt)
class VoucherItem(Base):
    __tablename__ = "voucher_items"

    id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.id"))
    product_id = Column(Integer, ForeignKey("stock.id"))
    
    quantity = Column(Integer)
    price_at_sale = Column(Float) # Important: Price might change later, this locks it.
    subtotal = Column(Float)      # quantity * price_at_sale

    # Relationship
    voucher = relationship("Voucher", back_populates="items")
    product = relationship("Stock")

# 7. AUDIT LOGS (Security Camera)
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String) # e.g., "DELETE_STOCK", "CREATE_USER"
    table_name = Column(String) # e.g., "stock"
    record_id = Column(Integer) # ID of the item changed
    
    old_value = Column(JSON, nullable=True) # Snapshot before change
    new_value = Column(JSON, nullable=True) # Snapshot after change
    
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)