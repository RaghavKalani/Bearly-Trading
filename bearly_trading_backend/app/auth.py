from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from app.schemas import TokenData
from google.oauth2 import id_token
from google.auth.transport import requests

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
