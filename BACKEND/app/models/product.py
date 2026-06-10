from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Product(Base):

    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(
        String
    )

    category = Column(
        String,
        default="General"
    )

    sku = Column(
        String,
        unique=True
    )

    price = Column(
        Float,
        nullable=False
    )

    stock = Column(
        Integer,
        default=0
    )

    reorder_level = Column(
        Integer,
        default=10
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.id")
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # relationship() lets us do product.supplier.name directly
    supplier = relationship("Supplier", backref="products")