from fastapi import Depends, HTTPException
from app.auth.auth_bearer import get_current_user

# ─────────────────────────────────────────────
# ROLE HIERARCHY:
#   admin    → can do everything
#   manager  → can read, create, update — NO delete
#   employee → can only read (GET) + create sales
# ─────────────────────────────────────────────


def admin_only(
    current_user: dict = Depends(get_current_user)
):
    """Only admin can access this route."""
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail=f"❌ Access Denied — Admin role required. Your role: '{current_user['role']}'"
        )
    return current_user


def manager_or_above(
    current_user: dict = Depends(get_current_user)
):
    """Admin and Manager can access this route."""
    allowed_roles = ["admin", "manager"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=f"❌ Access Denied — Manager or Admin role required. Your role: '{current_user['role']}'"
        )
    return current_user


def any_logged_in_user(
    current_user: dict = Depends(get_current_user)
):
    """Any authenticated user (admin, manager, employee) can access this route."""
    return current_user