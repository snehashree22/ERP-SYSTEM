from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.customer import Customer

from app.schemas.customer import CustomerCreate

router = APIRouter()
@router.post("/customers")
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
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
#get all customers
@router.get("/customers")
def get_customers(db: Session = Depends(get_db)):

    customers = db.query(Customer).all()

    return customers
#get customer by id
@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):

    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer
@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    updated_customer: CustomerCreate,
    db: Session = Depends(get_db)
):

    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    customer.name = updated_customer.name
    customer.email = updated_customer.email
    customer.phone = updated_customer.phone
    customer.address = updated_customer.address

    db.commit()

    return {
        "message": "Customer Updated Successfully"
    }
@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):

    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    db.delete(customer)

    db.commit()

    return {
        "message": "Customer Deleted Successfully"
    }
