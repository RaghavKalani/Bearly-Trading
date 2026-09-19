import os
from app.database import engine
from app.models import Base

db_path = "bearly_trading.db"

if os.path.exists(db_path):
    print(f"Removing old database at {db_path}...")
    try:
        os.remove(db_path)
        print("Database file removed successfully.")
    except Exception as e:
        print(f"Error removing database file: {e}")

print("Creating all tables based on the updated models...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")
