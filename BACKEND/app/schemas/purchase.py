from pydantic import BaseModel


class PurchaseCreate(BaseModel):

    product_id: int

    supplier_id: int

    quantity: int

    unit_price: float