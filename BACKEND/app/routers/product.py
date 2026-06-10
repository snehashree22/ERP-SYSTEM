from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate
from app.auth.role_checker import admin_only, manager_or_above, any_logged_in_user

router = APIRouter()


# INVENTORY BY CATEGORY — for donut/bar chart in Inventory Dashboard
@router.get("/inventory/by-category")
def inventory_by_category(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    results = db.query(
        Product.category,
        func.count(Product.id).label("count"),
        func.sum(Product.stock).label("total_stock"),
        func.sum(Product.price * Product.stock).label("total_value"),
    ).group_by(Product.category).all()

    return [
        {
            "category":    r.category or "General",
            "count":       r.count,
            "total_stock": r.total_stock or 0,
            "total_value": round(r.total_value or 0, 2),
        }
        for r in results
    ]


# CREATE PRODUCT — manager or admin
@router.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    new_product = Product(
        name=product.name,
        description=product.description,
        category=product.category,
        sku=product.sku,
        price=product.price,
        stock=product.stock,
        reorder_level=product.reorder_level,
        supplier_id=product.supplier_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product Created Successfully",
        "product": new_product
    }


# GET ALL PRODUCTS — any logged-in user
@router.get("/products")
def get_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Product).all()


# LOW STOCK PRODUCTS — any logged-in user
@router.get("/products/low-stock")
def low_stock_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Product).filter(
        Product.stock <= Product.reorder_level
    ).all()


# OUT OF STOCK PRODUCTS — any logged-in user
@router.get("/products/out-of-stock")
def out_of_stock_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Product).filter(Product.stock == 0).all()


# INVENTORY DASHBOARD — any logged-in user
@router.get("/inventory/dashboard")
def inventory_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    total_products = db.query(Product).count()

    low_stock = db.query(Product).filter(
        Product.stock <= Product.reorder_level
    ).count()

    out_of_stock = db.query(Product).filter(
        Product.stock == 0
    ).count()

    inventory_value = db.query(
        func.sum(Product.price * Product.stock)
    ).scalar()

    inventory_health = 100
    if total_products > 0:
        inventory_health = round(
            ((total_products - low_stock - out_of_stock) / total_products) * 100, 2
        )

    if inventory_health >= 80:
        stock_status = "Good"
    elif inventory_health >= 50:
        stock_status = "Warning"
    else:
        stock_status = "Critical"

    low_stock_percentage = (
        (low_stock / total_products) * 100 if total_products > 0 else 0
    )
    out_of_stock_percentage = (
        (out_of_stock / total_products) * 100 if total_products > 0 else 0
    )

    return {
        "total_products": total_products,
        "inventory_value": inventory_value or 0,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "inventory_health": inventory_health,
        "stock_status": stock_status,
        "low_stock_percentage": round(low_stock_percentage, 2),
        "out_of_stock_percentage": round(out_of_stock_percentage, 2)
    }


# INVENTORY LOW STOCK — any logged-in user
@router.get("/inventory/low-stock")
def inventory_low_stock(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Product).filter(
        Product.stock <= Product.reorder_level
    ).all()


# INVENTORY OUT OF STOCK — any logged-in user
@router.get("/inventory/out-of-stock")
def inventory_out_of_stock(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Product).filter(Product.stock == 0).all()


# INVENTORY ALERTS — any logged-in user
@router.get("/inventory/alerts")
def inventory_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Product).filter(
        Product.stock <= Product.reorder_level
    ).all()


# GET SINGLE PRODUCT — any logged-in user
@router.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


# UPDATE PRODUCT — manager or admin
@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    updated_product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = updated_product.name
    product.description = updated_product.description
    product.category = updated_product.category
    product.sku = updated_product.sku
    product.price = updated_product.price
    product.stock = updated_product.stock
    product.reorder_level = updated_product.reorder_level
    product.supplier_id = updated_product.supplier_id

    db.commit()

    return {"message": "Product Updated Successfully"}


# DELETE PRODUCT — admin only
@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)           # 🔒 admin only
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    return {"message": "Product Deleted Successfully"}


# GLOBAL SEARCH — any logged-in user
@router.get("/search")
def global_search(
    query: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    products = db.query(Product).filter(
        Product.name.ilike(f"%{query}%")
    ).all()

    return {"products": products}