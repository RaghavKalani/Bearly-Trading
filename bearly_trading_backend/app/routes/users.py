from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import database, schemas, crud, auth

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(database.SessionLocal)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    created_user = crud.create_user(db, user)
    token = auth.create_access_token(data={"sub": created_user.email})

    return {
        "id": created_user.id,
        "user_id": created_user.id,
        "username": created_user.username,
        "email": created_user.email,
        "token": token,
    }

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.SessionLocal)):
    u = crud.verify_user(db, user.email, user.password)
    if not u:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    token = auth.create_access_token(data={"sub": u.email})
    
    return {
        "id": u.id,
        "user_id": u.id,
        "username": u.username,
        "email": u.email,
        "token": token
    }

@router.post("/google-login")
def google_login(
    google_data: schemas.GoogleLogin, 
    db: Session = Depends(database.SessionLocal)
):
    """Handle Google OAuth login"""
    # Verify Google token
    user_info = auth.verify_google_token(google_data.credential)
    
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    # Check if user exists by Google ID
    user = crud.get_user_by_google_id(db, user_info["google_id"])
    
    # If not, check by email
    if not user:
        user = crud.get_user_by_email(db, user_info["email"])
    
    # If user still doesn't exist, create a new one (auto-registration)
    if not user:
        # Generate username from email or name
        username = user_info["name"].replace(" ", "_") if user_info["name"] else user_info["email"].split("@")[0]
        
        # Ensure username is unique
        base_username = username
        counter = 1
        while crud.get_user_by_username(db, username):
            username = f"{base_username}_{counter}"
            counter += 1
        
        user = crud.create_google_user(
            db,
            email=user_info["email"],
            username=username,
            google_id=user_info["google_id"]
        )
    else:
        # Update Google ID if user exists but doesn't have it
        if not user.google_id:
            user.google_id = user_info["google_id"]
            db.commit()
    
    # Create access token
    token = auth.create_access_token(data={"sub": user.email})
    
    return {
        "id": user.id,
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "token": token
    }
