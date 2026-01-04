from database import engine
from sqlalchemy import text

def fix():
    print("🔧 Fixing Database...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE stock ADD COLUMN IF NOT EXISTS images JSON DEFAULT '[]'::json;"))
            conn.commit()
            print("✅ SUCCESS! 'images' column added.")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix()