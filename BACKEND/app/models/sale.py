from sqlalchemy import Column, Integer, Float

from app.database.database import Base


class Sale(Base):

    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer)

    total_amount = Column(Float)