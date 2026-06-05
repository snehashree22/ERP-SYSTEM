from sqlalchemy import Column, Integer

from app.database.database import Base


class SaleItem(Base):

    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)

    sale_id = Column(Integer)

    product_id = Column(Integer)

    quantity = Column(Integer)