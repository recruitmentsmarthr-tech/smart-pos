from database import engine, Base, SessionLocal
from sqlalchemy.orm import Session # Added this import
import models
import auth
import random
from datetime import datetime, timedelta

# Function to seed dummy stock data
def seed_stock_data(db: Session):
    print("🌱 Seeding dummy stock data...")
    categories = db.query(models.Category).all()
    if not categories:
        # Create a default category if none exist
        default_category = models.Category(name="GENERAL")
        db.add(default_category)
        db.commit()
        db.refresh(default_category)
        categories = [default_category]

    for i in range(1, 101):
        name = f"Dummy Item {i}"
        price = round(random.uniform(10.0, 100.0), 2)
        cost_price = round(price * random.uniform(0.5, 0.8), 2)
        quantity = random.randint(10, 200)
        description = f"Description for Dummy Item {i}"
        arrival_date = datetime.utcnow() - timedelta(days=random.randint(1, 365))
        
        # Assign a random category
        category = random.choice(categories)

        stock_item = models.Stock(
            name=name,
            price=price,
            cost_price=cost_price,
            quantity=quantity,
            description=description,
            category_id=category.id,
            arrival_date=arrival_date
        )
        db.add(stock_item)
    db.commit()
    print("✅ 100 dummy stock items seeded.")

def reset_system():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Tables dropped.")
    print("🛠️  Creating Database Tables...")
    # 1. Force-create all tables (Stock, Users, etc.)
    Base.metadata.create_all(bind=engine)
    print("✅ Tables Created Successfully!")

    # 2. Create the Admin User
    db = SessionLocal()
    try:
        existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not existing_admin:
            print("👤 Creating Admin Account...")
            admin_user = models.User(
                username="admin",
                full_name="System Manager",
                role="manager",
                hashed_password=auth.get_password_hash("admin123") # Default Password
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin Created: Login with 'admin' / 'admin123'")
        else:
            print("ℹ️  Admin account already exists.")
        
        # 3. Seed dummy stock data
        seed_stock_data(db)

    except Exception as e:
        print(f"❌ Error during reinitialization: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_system()