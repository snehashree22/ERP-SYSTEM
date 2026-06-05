from pydantic import BaseModel


class SaleCreate(BaseModel):

    customer_id: int

    total_amount: float