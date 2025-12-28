from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware  # <--- IMPORT ADDED
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

# Import our own files
import models, schemas, auth, database, init_db

app = FastAPI()

# ==========================================
#              CORS SETTINGS
# ==========================================
# This allows your React Frontend (port 5173) to talk to this API (port 8000)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"  # Allows all for development convenience
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ==========================================


# 1. RUN STARTUP SCRIPT
@app.on_event("startup")
def on_startup():
    init_db.init_db()

# 2. SECURITY SETUP
# This tells FastAPI: "If a user wants to access a locked route, 
# look for the token in the 'Authorization' header."
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    """Validates the token and retrieves the user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode the token
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
        
    # Find user in DB
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# 3. THE LOGIN ROUTE
@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # 1. Find user
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # 2. Check password
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create Token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# 4. MANAGER ROUTE: CREATE STAFF
@app.post("/users/", response_model=schemas.UserOut)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user) # Must be logged in
):
    # Security Check: Only Managers can create users
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Not authorized. Managers only.")

    # Check if username already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password and save
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# 5. TEST ROUTE (Who am I?)
@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user