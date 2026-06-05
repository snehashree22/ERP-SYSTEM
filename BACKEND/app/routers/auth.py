from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.auth.auth_bearer import get_current_user
from app.auth.hashing import hash_password

from app.auth.jwt_handler import create_access_token
from app.auth.hashing import verify_password

from app.auth.auth_bearer import get_current_user



router = APIRouter()


@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):

    # CHECK EXISTING EMAIL
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # HASH PASSWORD
    hashed_pwd = hash_password(user.password)

    # CREATE USER
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "User Registered Successfully"
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
        "token_type": "bearer"
    }

@router.get("/me")
def get_current_logged_in_user(

    current_user: dict = Depends(get_current_user)

):

    return {
        "message": "Current Logged-in User",
        "user": current_user
    }