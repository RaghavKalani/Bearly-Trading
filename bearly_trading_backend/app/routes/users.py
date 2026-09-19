from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from sqlalchemy.orm import Session
from app import database, schemas, crud, auth, models
from typing import Optional

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    return crud.create_user(db, user)

@router.post("/login", response_model=schemas.TokenResponse)
def login(
    user: schemas.UserLogin, 
    response: Response,
    db: Session = Depends(database.get_db)
):
    u = crud.verify_user(db, user.email, user.password)
    
    # Handle case where user is locked (verify_user returns the user but it might be locked)
    if u and u.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is locked. Try again after {u.lockout_until.isoformat()} UTC."
        )

    if not u:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = auth.create_access_token(data={"sub": u.email})
    
    # Create refresh token and set in cookie
    refresh_token = auth.create_refresh_token(db, u.id)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Set to true for production HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": u.id,
        "username": u.username,
        "email": u.email
    }

@router.post("/google-login", response_model=schemas.TokenResponse)
def google_login(
    google_data: schemas.GoogleLogin, 
    response: Response,
    db: Session = Depends(database.get_db)
):
    """Handle Google OAuth login"""
    user_info = auth.verify_google_token(google_data.credential)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    user = crud.get_user_by_google_id(db, user_info["google_id"])
    if not user:
        user = crud.get_user_by_email(db, user_info["email"])
    
    if not user:
        # Generate unique username
        username = user_info["name"].replace(" ", "_") if user_info["name"] else user_info["email"].split("@")[0]
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
        if not user.google_id:
            user.google_id = user_info["google_id"]
            db.commit()
            
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked."
        )

    # Reset login attempts & log success
    crud.reset_login_attempts(db, user)
    crud.log_action(db, user.id, "login_google_success", "User successfully logged in via Google")

    # Create access token
    access_token = auth.create_access_token(data={"sub": user.email})
    
    # Create refresh token and set in cookie
    refresh_token = auth.create_refresh_token(db, user.id)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }

@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(database.get_db)
):
    """Rotate refresh tokens and retrieve a new access token"""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing from cookies.")
        
    access_token, new_refresh_token, user = auth.rotate_refresh_token(db, refresh_token)
    
    # Set new refresh token in cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    }

@router.post("/logout")
def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(database.get_db)
):
    """Revoke refresh token and clear cookie"""
    if refresh_token:
        db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == refresh_token).first()
        if db_token:
            db_token.revoked = True
            db.commit()
            
    response.delete_cookie(key="refresh_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    return current_user


# Simulated email verification & Password resets

@router.post("/verify-email")
def verify_email(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    current_user.email_verified = True
    db.commit()
    crud.log_action(db, current_user.id, "email_verified", "User verified their email address")
    return {"message": "Email successfully verified"}

@router.post("/reset-password/request")
def request_password_reset(
    body: schemas.PasswordResetRequest,
    db: Session = Depends(database.get_db)
):
    user = crud.get_user_by_email(db, body.email)
    if user:
        # Simulate sending verification email
        crud.log_action(db, user.id, "password_reset_request", "User requested a password reset")
    return {"message": "If this email is registered, a password reset link has been generated (simulated)."}

@router.post("/reset-password/confirm")
def confirm_password_reset(
    body: schemas.PasswordResetConfirm,
    db: Session = Depends(database.get_db)
):
    user = crud.get_user_by_email(db, body.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = auth.get_password_hash(body.new_password)
    user.is_locked = False
    user.login_attempts = 0
    user.lockout_until = None
    db.commit()
    
    crud.log_action(db, user.id, "password_reset_success", "User successfully reset their password")
    return {"message": "Password successfully reset. You can now log in."}


# Compliance & GDPR Data portability

@router.get("/export-data")
def export_data(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """GDPR Compliance: Export all trade, watchlist, and profile data"""
    crud.log_action(db, current_user.id, "gdpr_data_export", "User exported their personal data")
    return crud.export_user_data(db, current_user.id)

@router.delete("/delete-account")
def delete_account(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """GDPR Compliance: Delete user and purge all records"""
    crud.log_action(db, current_user.id, "gdpr_account_deletion", "User initiated account deletion")
    crud.delete_user_account(db, current_user.id)
    return {"message": "Account successfully deleted. All your records have been purged."}
