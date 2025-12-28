import time
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
import models
import auth

def init_db():
    # RETRY LOGIC: Try to connect 5 times before giving up
    retries = 5
    while retries > 0:
        try:
            print("🔄 Attempting to connect to Database...")
            
            # 1. Create all tables in the database
            Base.metadata.create_all(bind=engine)
            
            # 2. Check if we need to create the First Manager
            db = SessionLocal()
            try:
                first_user = db.query(models.User).first()
                
                if not first_user:
                    print("⚠️ No users found. Creating the First Manager...")
                    admin_user = models.User(
                        username="admin",
                        full_name="System Manager",
                        role="manager",
                        hashed_password=auth.get_password_hash("admin123")
                    )
                    db.add(admin_user)
                    db.commit()
                    print("✅ First Manager Created! Login: admin / admin123")
                else:
                    print("✅ Database already initialized.")
            finally:
                db.close()
                
            # If we get here, everything worked!
            break 
            
        except OperationalError:
            retries -= 1
            print(f"⏳ Database starting up... Waiting 5 seconds ({retries} left)")
            time.sleep(5)