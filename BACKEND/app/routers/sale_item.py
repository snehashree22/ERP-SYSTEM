from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.inventory_log import InventoryLog

from app.schemas.sale_item import SaleItemCreate
from sqlalchemy import func

router = APIRouter()


@router.post("/sale-items")
def create_sale_item(
    item: SaleItemCreate,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.id == item.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.stock < item.quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    # Reduce stock automatically
    product.stock -= item.quantity

    # Create sale item
    new_item = SaleItem(
        sale_id=item.sale_id,
        product_id=item.product_id,
        quantity=item.quantity
    )

    # Create inventory log
    log = InventoryLog(
        product_id=item.product_id,
        action="SALE",
        quantity=item.quantity
    )

    db.add(new_item)
    db.add(log)

    db.commit()

    db.refresh(new_item)

    return {
        "message": "Sale Item Added Successfully",
        "sale_item": new_item
    }
    
@router.get("/sales/top-products")
def top_products(
    db: Session = Depends(get_db)
):

    results = db.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label("sold")
    ).group_by(
        SaleItem.product_id
    ).all()

    response = []

    for product_id, sold in results:
        response.append({
            "product_id": product_id,
            "sold": sold
        })

    return response