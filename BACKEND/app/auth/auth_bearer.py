from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt_handler import verify_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    user_data = verify_access_token(token)

    if not user_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid or Expired Token"
        )

    return user_data