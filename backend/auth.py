import jwt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "super-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Single-user auth bypass profile used across the app.
SINGLE_USER = {
    "username": "single-user",
    "password": "bypass",
    "company_id": 1,
    "role": "manager",
}

# Kept for backward compatibility with existing imports/usages.
FAKE_USERS_DB = {
    SINGLE_USER["username"]: SINGLE_USER
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
    # Auth bypass enabled: always return the same user.
    return SINGLE_USER
