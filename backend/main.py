from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import init_db
from routers import stock, categories, auth_routes, vouchers, customers, dashboard

app = FastAPI(title="Smart POS API")

# 1. CORS SETTINGS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. STATIC FILES SETUP
if not os.path.exists("static_images"):
    os.makedirs("static_images")
app.mount("/static_images", StaticFiles(directory="static_images"), name="static_images")

# 3. DATABASE INITIALIZATION
@app.on_event("startup")
def on_startup():
    init_db.init_db()

# 4. REGISTER THE ROUTERS
app.include_router(auth_routes.router)
app.include_router(stock.router)
app.include_router(categories.router)
app.include_router(vouchers.router)
app.include_router(customers.router)
app.include_router(dashboard.router)
