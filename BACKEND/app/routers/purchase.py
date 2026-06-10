from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.purchase import Purchase
from app.models.product import Product
from app.models.inventory_log import InventoryLog
from app.schemas.purchase import PurchaseCreate
from app.auth.role_checker import admin_only, manager_or_above, any_logged_in_user


router = APIRouter()


# ─────────────────────────────────────────────
# CREATE PURCHASE — manager or admin
# ─────────────────────────────────────────────
@router.post("/purchases")
def create_purchase(
    purchase: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)
):
    product = db.query(Product).filter(
        Product.id == purchase.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    stock_before = product.stock
    product.stock += purchase.quantity
    stock_after = product.stock

    total_amount = purchase.quantity * purchase.unit_price

    new_purchase = Purchase(
        product_id=purchase.product_id,
        supplier_id=purchase.supplier_id,
        quantity=purchase.quantity,
        unit_price=purchase.unit_price,
        total_amount=total_amount,
        status="Received"         # ← default status
    )

    db.add(new_purchase)

    log = InventoryLog(
        product_id=product.id,
        action="PURCHASE",
        quantity=purchase.quantity,
        stock_before=stock_before,
        stock_after=stock_after,
        remarks=f"Purchase by {current_user['email']}"
    )

    db.add(log)
    db.commit()

    return {"message": "Purchase Created Successfully"}


# ─────────────────────────────────────────────
# GET PURCHASES WITH PRODUCT & SUPPLIER NAMES
# Uses SQLAlchemy relationships (no extra queries)
# ─────────────────────────────────────────────
@router.get("/purchases/with-details")
def get_purchases_with_details(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    purchases = db.query(Purchase).order_by(Purchase.id.desc()).all()

    result = []
    for p in purchases:
        # p.product and p.supplier work because of relationship() in the model
        result.append({
            "id": p.id,
            "po_number": f"PO-2025-{str(p.id).zfill(3)}",
            "product_id": p.product_id,
            "product_name": p.product.name  if p.product  else "Unknown Product",
            "supplier_id": p.supplier_id,
            "vendor_name": p.supplier.name if p.supplier else "Unknown Supplier",
            "quantity": p.quantity,
            "unit_price": p.unit_price,
            "total_amount": p.total_amount,
            "status": p.status or "Received",
            "created_at": p.created_at.strftime("%Y-%m-%d") if p.created_at else "-",
        })

    return result



# ─────────────────────────────────────────────
# GET ALL PURCHASES (simple)
# ─────────────────────────────────────────────
@router.get("/purchases")
def get_purchases(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)
):
    return db.query(Purchase).order_by(Purchase.id.desc()).all()


# ─────────────────────────────────────────────
# UPDATE PURCHASE STATUS — manager or admin
# ─────────────────────────────────────────────
@router.patch("/purchases/{purchase_id}/status")
def update_purchase_status(
    purchase_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)
):
    valid_statuses = ["Pending", "Received", "Cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    purchase.status = status
    db.commit()

    return {"message": f"Purchase status updated to '{status}'"}


# ─────────────────────────────────────────────
# DELETE PURCHASE — admin only
# ─────────────────────────────────────────────
@router.delete("/purchases/{purchase_id}")
def delete_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    db.delete(purchase)
    db.commit()

    return {"message": "Purchase Deleted Successfully"}