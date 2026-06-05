from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.product import Product

from app.schemas.product import ProductCreate

router = APIRouter()

@router.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    new_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        supplier_id=product.supplier_id
    )

    db.add(new_product)

    db.commit()

    db.refresh(new_product)

    return {
        "message": "Product Created Successfully",
        "product": new_product
    }
    
@router.get("/products")
def get_products(db: Session = Depends(get_db)):

    products = db.query(Product).all()

    return products

@router.get("/products/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product
@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    updated_product: ProductCreate,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.name = updated_product.name
    product.description = updated_product.description
    product.price = updated_product.price
    product.stock = updated_product.stock
    product.supplier_id = updated_product.supplier_id
    

    db.commit()

    return {
        "message": "Product Updated Successfully"
    }
@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)

    db.commit()

    return {
        "message": "Product Deleted Successfully"
    }
    
@router.get("/products/low-stock")
def low_stock_products(
    db: Session = Depends(get_db)
):

    products = db.query(Product).filter(
        Product.stock < 10
    ).all()

    return products