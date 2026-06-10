from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()   # loads GEMINI_API_KEY from .env

from app.database.database import engine, Base
from app.models.employee import Employee
from app.routers import employee
from app.models.user import User
from app.routers import auth
from app.models import product
from app.routers import product
from app.models import supplier
from app.routers import supplier
from app.models import inventory_log
from app.routers import inventory
from app.models import customer
from app.routers import customer
from app.models import sale
from app.routers import sale
from app.models import sale_item
from app.routers import sale_item
from app.routers import invoice
from app.models import purchase
from app.routers import purchase
from app.routers import ai   # ← AI router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(purchase.router)
app.include_router(employee.router)
app.include_router(auth.router)
app.include_router(product.router)
app.include_router(supplier.router)
app.include_router(inventory.router)
app.include_router(customer.router)
app.include_router(sale.router)
app.include_router(sale_item.router)
app.include_router(invoice.router)
app.include_router(ai.router)       # ← AI endpoints

@app.get("/")
def home():
    return {"message": "ERP Backend Running — RetailFlow AI Edition"}
