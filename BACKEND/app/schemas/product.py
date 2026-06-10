from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):

    name: str

    description: Optional[str] = None

    category: str

    sku: str

    price: float

    stock: int

    reorder_level: int = 10

    supplier_id: int


class ProductResponse(BaseModel):

    id: int

    name: str

    description: Optional[str] = None

    category: str

    sku: str

    price: float

    stock: int

    reorder_level: int

    supplier_id: int

    class Config:
        from_attributes = True