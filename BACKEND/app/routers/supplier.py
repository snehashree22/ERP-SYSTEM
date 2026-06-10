from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate
from app.auth.role_checker import admin_only, manager_or_above, any_logged_in_user

router = APIRouter()


# CREATE SUPPLIER — manager or admin
@router.post("/suppliers")
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    existing_supplier = db.query(Supplier).filter(
        Supplier.email == supplier.email
    ).first()

    if existing_supplier:
        raise HTTPException(
            status_code=400,
            detail="Supplier email already exists"
        )

    new_supplier = Supplier(
        name=supplier.name,
        email=supplier.email,
        phone=supplier.phone,
        address=supplier.address
    )

    try:
        db.add(new_supplier)
        db.commit()
        db.refresh(new_supplier)

        return {
            "message": "Supplier Created Successfully",
            "supplier": new_supplier
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create supplier")


# GET ALL SUPPLIERS — any logged-in user
@router.get("/suppliers")
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Supplier).all()


# GET SINGLE SUPPLIER — any logged-in user
@router.get("/suppliers/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier


# UPDATE SUPPLIER — manager or admin
@router.put("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: int,
    updated_supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    existing_email = db.query(Supplier).filter(
        Supplier.email == updated_supplier.email,
        Supplier.id != supplier_id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Supplier email already exists"
        )

    supplier.name = updated_supplier.name
    supplier.email = updated_supplier.email
    supplier.phone = updated_supplier.phone
    supplier.address = updated_supplier.address

    db.commit()

    return {"message": "Supplier Updated Successfully"}


# DELETE SUPPLIER — admin only
@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)           # 🔒 admin only
):
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()

    return {"message": "Supplier Deleted Successfully"}