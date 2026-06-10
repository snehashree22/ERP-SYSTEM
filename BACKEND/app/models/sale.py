from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Sale(Base):

    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    # ForeignKey tells DB: this number must exist in customers.id
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    total_amount = Column(Float)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # Status: "Pending", "Completed", "Cancelled"
    status = Column(String, default="Completed")

    # relationship() lets us do sale.customer.name directly in Python
    customer = relationship("Customer", backref="sales")

    # relationship to sale items (one sale → many items)
    items = relationship("SaleItem", backref="sale")