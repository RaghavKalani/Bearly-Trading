from fastapi import APIRouter

router = APIRouter(prefix="/learning", tags=["Learning"])

@router.get("/modules")
def get_learning_modules():
    return [
        {"title": "Intro to Stock Market", "content": "Basics of stocks and exchanges."},
        {"title": "Technical Analysis", "content": "Reading charts and price movements."},
        {"title": "Risk Management", "content": "How to manage risk when investing."}
    ]
