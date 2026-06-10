from pydantic import BaseModel, EmailStr
from typing import Literal


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    # role can be: "admin", "manager", "employee"
    role: Literal["admin", "manager", "employee"] = "employee"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True