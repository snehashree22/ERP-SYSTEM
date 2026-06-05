from sqlalchemy import Column, Integer, String

from app.database.database import Base


class InventoryLog(Base):

    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(Integer)

    action = Column(String)

    quantity = Column(Integer)