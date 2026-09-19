from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import database
import time
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def health_check(db: Session = Depends(database.get_db)):
    start_time = time.time()
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        print(f"Health check database error: {e}")

    latency = time.time() - start_time
    return {
        "status": "healthy" if db_ok else "unhealthy",
        "database": "connected" if db_ok else "disconnected",
        "latency_sec": round(latency, 4),
        "timestamp": datetime.utcnow().isoformat() if 'datetime' in globals() else str(time.time())
    }
