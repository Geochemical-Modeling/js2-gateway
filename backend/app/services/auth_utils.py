from fastapi import HTTPException, Depends, Request, status
from typing import Optional
import requests
from sqlmodel import select
import logging
from app.db import User, get_session

logger = logging.getLogger(__name__)

async def get_current_user_from_token(request: Request) -> dict:
    """
    Validate access token in the cookie and return user info.
    Raises HTTPException if token is invalid.
    """
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    # Validate the token with CILogon
    CILOGON_USERINFO_URL = "https://cilogon.org/oauth2/userinfo"
    try:
        response = requests.get(
            CILOGON_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user_info = response.json()
        if "email" not in user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email missing from authentication data"
            )
        
        return user_info
    except requests.RequestException as e:
        logger.error(f"Error validating token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

async def get_current_user(request: Request) -> User:
    """
    Get the current authenticated user from the database.
    Raises HTTPException if user is not found or not authenticated.
    """
    user_info = await get_current_user_from_token(request)
    email = user_info.get("email")
    
    with get_session() as session:
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service unavailable"
            )
        
        statement = select(User).where(User.email == email)
        db_user = session.exec(statement).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        
        return db_user

async def admin_required(request: Request) -> User:
    """
    Dependency to ensure the current user has admin rights.
    Raises HTTPException if user is not an admin.
    """
    user = await get_current_user(request)
    
    if not user.admin_rights:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return user