import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    print("Copy it from Render database and add to .env file")
    exit(1)

try:
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Add google_id column if it doesn't exist
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;
        """))
        
        # Make hashed_password nullable
        conn.execute(text("""
            ALTER TABLE users 
            ALTER COLUMN hashed_password DROP NOT NULL;
        """))
        
        conn.commit()
    
    print("✅ Database schema updated successfully!")
    print("✅ Added google_id column")
    print("✅ Made hashed_password optional")
    
except Exception as e:
    print(f"❌ Error updating database: {e}")
