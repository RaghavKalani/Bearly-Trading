from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import secrets
from dotenv import load_dotenv
from app.schemas import TokenData
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "replace_with_a_long_random_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise JWTError
        return TokenData(email=email)
    except JWTError:
        return None

def verify_google_token(credential: str):
    """Verify Google OAuth token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(
            credential, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Return user information from Google
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "google_id": idinfo.get("sub"),
            "picture": idinfo.get("picture")
        }
    except ValueError:
        # Invalid token
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    # Lockout check
    if user.is_locked:
        if user.lockout_until and user.lockout_until > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is locked. Try again after {user.lockout_until.isoformat()} UTC."
            )
        else:
            # Lockout expired, unlock user
            user.is_locked = False
            user.login_attempts = 0
            user.lockout_until = None
            db.commit()
            db.refresh(user)

    return user

def create_refresh_token(db: Session, user_id: int) -> str:
    """Generate a secure refresh token and save it to the database"""
    token_str = secrets.token_urlsafe(64)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_token = models.RefreshToken(
        token=token_str,
        user_id=user_id,
        expires_at=expires_at,
        revoked=False
    )
    db.add(db_token)
    db.commit()
    return token_str

def rotate_refresh_token(db: Session, token_str: str) -> tuple[str, str, models.User]:
    """Verify refresh token, revoke it, and issue a new access token and a new refresh token"""
    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == token_str).first()
    if not db_token or db_token.revoked or db_token.expires_at < datetime.utcnow():
        # Token reuse or invalid token: revoke all tokens for this user as a security measure
        if db_token:
            db.query(models.RefreshToken).filter(models.RefreshToken.user_id == db_token.user_id).update({"revoked": True})
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    # Revoke current token
    db_token.revoked = True
    db.commit()

    # Get user
    user = db.query(models.User).filter(models.User.id == db_token.user_id).first()
    if not user or user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is locked or not found."
        )

    # Create new access and refresh tokens
    new_access_token = create_access_token(data={"sub": user.email})
    new_refresh_token = create_refresh_token(db, user.id)

    return new_access_token, new_refresh_token, user

