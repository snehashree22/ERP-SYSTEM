from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.auth.auth_bearer import get_current_user
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.role_checker import admin_only

router = APIRouter()


# ─────────────────────────────────────────────────────────
# PUBLIC REGISTER — always creates EMPLOYEE accounts only
# Role field is IGNORED. Prevents privilege escalation.
# ─────────────────────────────────────────────────────────
@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # CHECK EXISTING EMAIL
        existing_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # CHECK EXISTING USERNAME
        existing_username = db.query(User).filter(
            User.username == user.username
        ).first()

        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Username already registered"
            )

        # HASH PASSWORD
        hashed_pwd = hash_password(user.password)

        # FORCE ROLE TO ADMIN TEMPORARILY
        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_pwd,
            role="admin"          # ← Changed back to admin so they can register
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "Employee account registered successfully."
        }
    except Exception as e:
        import traceback
        raise HTTPException(status_code=400, detail=f"DEBUG ERROR: {str(e)} --- {traceback.format_exc()}")


# ─────────────────────────────────────────────────────────
# ADMIN-ONLY: Create a user with any role (admin / manager)
# Only existing admins can call this endpoint.
# ─────────────────────────────────────────────────────────
@router.post("/admin/create-user")
def admin_create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(admin_only)
):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    valid_roles = ["admin", "manager", "employee"]
    if user.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {valid_roles}")

    hashed_pwd = hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role   # ← Admin can assign any role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": f"{user.role.capitalize()} account created successfully by admin.",
        "username": new_user.username,
        "role": new_user.role
    }
    
@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):

    # FIND USER
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    # VERIFY PASSWORD
    valid_password = verify_password(
        user.password,
        existing_user.hashed_password
    )

    if not valid_password:
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    # CREATE JWT TOKEN
    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "role": existing_user.role
        }
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        # Return user info so frontend can store it
        "user": {
            "id": existing_user.id,
            "username": existing_user.username,
            "email": existing_user.email,
            "role": existing_user.role,
        }
    }

@router.get("/me")
def get_current_logged_in_user(
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "Current Logged-in User",
        "user": current_user
    }


# ─────────────────────────────────────────────────────────
# CHANGE PASSWORD — logged-in user changes their own password
# ─────────────────────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    user.hashed_password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}