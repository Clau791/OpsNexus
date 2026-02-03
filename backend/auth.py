import jwt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "super-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Mock user database
# In a real app, this would query a database
FAKE_USERS_DB = {
    "admin": {
        "username": "admin",
        "password": "password123", # Plaintext for skeleton simplicity
        "company_id": 1,
        "role": "manager"
    },
    "manager1": {
        "username": "manager1",
        "password": "securepass",
        "company_id": 101,
        "role": "manager"
    }
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(username, password):
    user = FAKE_USERS_DB.get(username)
    if not user:
        return False
    if user["password"] != password:
        return False
    return user
