from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Purchase(Base):

    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)

    # ForeignKey: product_id must exist in products table
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    # ForeignKey: supplier_id must exist in suppliers table
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)

    quantity = Column(Integer)

    unit_price = Column(Float)

    total_amount = Column(Float)

    # Status: "Pending", "Received", "Cancelled"
    status = Column(String, default="Received")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # relationship() lets us do purchase.product.name and purchase.supplier.name directly
    product  = relationship("Product",  backref="purchases")
    supplier = relationship("Supplier", backref="purchases")