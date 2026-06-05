from pydantic import BaseModel, EmailStr, Field


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    department: str
    salary: int = Field(..., gt=0)


class EmployeeResponse(EmployeeCreate):
    id: int

    class Config:
        from_attributes = True