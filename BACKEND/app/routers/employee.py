from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from openpyxl import Workbook

from app.schemas.employee import EmployeeCreate
from app.models.employee import Employee
from app.database.database import get_db
from app.auth.role_checker import admin_only, manager_or_above, any_logged_in_user

router = APIRouter()


# CREATE EMPLOYEE — manager or admin only
@router.post("/employees")
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)   # 🔒 manager+
):
    existing_employee = db.query(Employee).filter(
        Employee.email == employee.email
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_employee = Employee(
        name=employee.name,
        email=employee.email,
        department=employee.department,
        salary=employee.salary
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return {
        "message": "Employee Created Successfully",
        "employee": new_employee
    }


# GET ALL EMPLOYEES — any logged-in user
@router.get("/employees")
def get_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    return db.query(Employee).all()


# EXPORT EMPLOYEES TO EXCEL — admin only
@router.get("/employees/export")
def export_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)           # 🔒 admin only
):
    employees = db.query(Employee).all()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Employees"

    sheet.append(["ID", "Name", "Email", "Department", "Salary"])

    for employee in employees:
        sheet.append([
            employee.id,
            employee.name,
            employee.email,
            employee.department,
            employee.salary
        ])

    file_name = "employees.xlsx"
    workbook.save(file_name)

    return FileResponse(
        path=file_name,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# GET EMPLOYEE BY ID — any logged-in user
@router.get("/employees/{employee_id}")
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(any_logged_in_user)  # 🔒 must be logged in
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return employee


# UPDATE EMPLOYEE — manager or admin
@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    updated_employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(manager_or_above)    # 🔒 manager+
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.name = updated_employee.name
    employee.email = updated_employee.email
    employee.department = updated_employee.department
    employee.salary = updated_employee.salary

    db.commit()

    return {"message": "Employee Updated Successfully"}


# DELETE EMPLOYEE — admin only
@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)           # 🔒 admin only
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()

    return {"message": "Employee Deleted Successfully"}