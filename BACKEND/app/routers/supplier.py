from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate

router = APIRouter()


@router.post("/suppliers")
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):

    new_supplier = Supplier(
        name=supplier.name,
        email=supplier.email,
        phone=supplier.phone,
        address=supplier.address
    )

    db.add(new_supplier)

    db.commit()

    db.refresh(new_supplier)

    return {
        "message": "Supplier Created Successfully",
        "supplier": new_supplier
    }
    
@router.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db)):

    suppliers = db.query(Supplier).all()

    return suppliers

@router.get("/suppliers/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    return supplier

@router.put("/suppliers/{supplier_id}")
def update_supplier(
    supplier_id: int,
    updated_supplier: SupplierCreate,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    supplier.name = updated_supplier.name
    supplier.email = updated_supplier.email
    supplier.phone = updated_supplier.phone
    supplier.address = updated_supplier.address

    db.commit()

    return {
        "message": "Supplier Updated Successfully"
    }
    
@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    db.delete(supplier)

    db.commit()

    return {
        "message": "Supplier Deleted Successfully"
    }