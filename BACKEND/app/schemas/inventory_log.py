from pydantic import BaseModel


class InventoryLogCreate(BaseModel):

    product_id: int

    action: str

    quantity: int