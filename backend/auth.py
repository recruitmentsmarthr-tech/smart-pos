import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# 1. SECURITY CONFIGURATION
# In a real production server, we would load this from a hidden .env file.
# For now, we use a default key so you can develop easily.
SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_master_key_change_me_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # Token lasts 12 hours (good for a full shift)

# 2. PASSWORD HASHER
# We use Bcrypt, the industry standard for password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Checks if the typed password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Turns a plain password into a secure hash."""
    return pwd_context.hash(password)

# 3. TOKEN GENERATOR
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates the JWT string (Digital ID Card)."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # We add the expiration time to the token data
    to_encode.update({"exp": expire})
    
    # We sign the token with our SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt