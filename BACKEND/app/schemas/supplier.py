from pydantic import BaseModel, EmailStr


class SupplierCreate(BaseModel):

    name: str

    email: EmailStr

    phone: str

    address: str