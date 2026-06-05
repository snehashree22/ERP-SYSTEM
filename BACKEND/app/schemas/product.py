from pydantic import BaseModel


class ProductCreate(BaseModel):

    name: str

    description: str

    price: float

    stock: int
    supplier_id: int