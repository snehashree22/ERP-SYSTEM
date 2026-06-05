from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.sale import Sale

from app.schemas.sale import SaleCreate
from sqlalchemy import func

router = APIRouter()
@router.post("/sales")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db)
):

    new_sale = Sale(
        customer_id=sale.customer_id,
        total_amount=sale.total_amount
    )

    db.add(new_sale)

    db.commit()

    db.refresh(new_sale)

    return {
        "message": "Sale Created Successfully",
        "sale": new_sale
    }
    
@router.get("/sales/dashboard")
def sales_dashboard(
    db: Session = Depends(get_db)
):

    total_sales = db.query(Sale).count()

    total_revenue = db.query(
        func.sum(Sale.total_amount)
    ).scalar()

    return {
        "total_sales": total_sales,
        "total_revenue": total_revenue or 0
    }