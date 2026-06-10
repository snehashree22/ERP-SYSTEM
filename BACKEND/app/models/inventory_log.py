from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class InventoryLog(Base):

    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)

    # ForeignKey: product_id must exist in products table
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    action = Column(String)        # "PURCHASE", "SALE", "ADD", "REMOVE"

    quantity = Column(Integer)

    stock_before = Column(Integer)

    stock_after = Column(Integer)

    remarks = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # relationship() lets us do log.product.name directly
    product = relationship("Product", backref="inventory_logs")