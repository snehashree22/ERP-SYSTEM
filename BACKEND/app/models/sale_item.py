from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class SaleItem(Base):

    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)

    # ForeignKey links: this sale_id must exist in sales.id
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)

    # ForeignKey links: this product_id must exist in products.id
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity = Column(Integer)

    # relationship() lets us do item.product.name and item.product.price directly
    product = relationship("Product", backref="sale_items")