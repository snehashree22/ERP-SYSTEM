from fastapi import Depends, HTTPException

from app.auth.auth_bearer import get_current_user


def admin_only(
    current_user: dict = Depends(get_current_user)
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin Access Required"
        )

    return current_user