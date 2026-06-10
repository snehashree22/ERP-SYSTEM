from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate
from app.auth.role_checker import admin_only, manager_or_above, any_logged_in_user

router = APIRouter()


# CREATE CUSTOMER — manager or admin
@router.post("/customers")
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    new_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return {
        "message": "Customer Created Successfully",
        "customer": new_customer
    }


# GET ALL CUSTOMERS — any logged-in user
@router.get("/customers")
def get_customers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Customer).all()


# GET SINGLE CUSTOMER — any logged-in user
@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


# UPDATE CUSTOMER — manager or admin
@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    updated_customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.name = updated_customer.name
    customer.email = updated_customer.email
    customer.phone = updated_customer.phone
    customer.address = updated_customer.address

    db.commit()

    return {"message": "Customer Updated Successfully"}


# DELETE CUSTOMER — admin only
@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)           # 🔒 admin only
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()

    return {"message": "Customer Deleted Successfully"}
