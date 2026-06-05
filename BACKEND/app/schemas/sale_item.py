from pydantic import BaseModel


class SaleItemCreate(BaseModel):

    sale_id: int

    product_id: int

    quantity: int