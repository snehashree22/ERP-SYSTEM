from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.inventory_log import InventoryLog
from app.schemas.inventory_log import InventoryLogCreate
from app.models.product import Product
from app.schemas.stock import StockUpdate
from app.auth.role_checker import admin_only, manager_or_above, any_logged_in_user

router = APIRouter()


# CREATE INVENTORY LOG — manager or admin
@router.post("/inventory/log")
def create_log(
    log: InventoryLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    new_log = InventoryLog(
        product_id=log.product_id,
        action=log.action,
        quantity=log.quantity
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {"message": "Inventory Log Created"}


# ADD STOCK — manager or admin
@router.post("/stock/add")
def add_stock(
    stock: StockUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    product = db.query(Product).filter(
        Product.id == stock.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.stock += stock.quantity

    log = InventoryLog(
        product_id=stock.product_id,
        action="ADD",
        quantity=stock.quantity
    )

    db.add(log)
    db.commit()

    return {"message": "Stock Added Successfully"}


# REMOVE STOCK — manager or admin
@router.post("/stock/remove")
def remove_stock(
    stock: StockUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    product = db.query(Product).filter(
        Product.id == stock.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock < stock.quantity:
        raise HTTPException(status_code=400, detail="Insufficient Stock")

    product.stock -= stock.quantity

    log = InventoryLog(
        product_id=stock.product_id,
        action="REMOVE",
        quantity=stock.quantity
    )

    db.add(log)
    db.commit()

    return {"message": "Stock Removed Successfully"}


# GET INVENTORY LOGS — any logged-in user
@router.get("/inventory/logs")
def get_inventory_logs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    logs = db.query(InventoryLog).order_by(
        InventoryLog.id.desc()
    ).all()

    return logs