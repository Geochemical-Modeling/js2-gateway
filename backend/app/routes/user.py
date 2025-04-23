from fastapi import APIRouter, Request, Response, HTTPException, Depends
from sqlmodel import select, update
from app.db import User, get_session
from sqlalchemy.exc import SQLAlchemyError
import logging
import requests
from typing import Optional
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class OnboardingData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    institution: Optional[str] = None

@router.post("/api/user/onboard")
async def complete_onboarding(data: OnboardingData, request: Request, response: Response):
    """
    Update user information and mark them as onboarded.
    """
    # Get the access token from cookies
    access_token = request.cookies.get("access_token")
    if access_token is None:
        raise HTTPException(status_code=401, detail="Access token is required")
    
    # Verify the user is authenticated
    CILOGON_USERINFO_URL = "https://cilogon.org/oauth2/userinfo"
    try:
        user_info_response = requests.get(
            CILOGON_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
            
        user_info = user_info_response.json()
        if "email" not in user_info:
            raise HTTPException(status_code=400, detail="Email missing from authentication data")
            
        email = user_info["email"]
        
        # Check if the email matches the one in the request
        if data.email and data.email.lower() != email.lower():
            raise HTTPException(status_code=400, detail="Email in request does not match authenticated user")
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error verifying authentication: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify authentication")
    
    # Update the user in the database
    try:
        with get_session() as session:
            if session is None:
                raise HTTPException(status_code=503, detail="Database unavailable")
            
            # Find the user
            statement = select(User).where(User.email == email)
            db_user = session.exec(statement).first()
            
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found in database")
            
            # Update the user data
            db_user.name = data.name or db_user.name
            db_user.institution = data.institution or db_user.institution
            db_user.onboarded = 1  # Mark as onboarded
            
            # Commit the changes
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            
            # Return the updated user data without sensitive fields
            return {
                "status": "success",
                "message": "User onboarding completed successfully",
                "user": {
                    "id": db_user.id,
                    "email": db_user.email,
                    "name": db_user.name,
                    "institution": db_user.institution,
                    "onboarded": db_user.onboarded
                }
            }
            
    except SQLAlchemyError as db_error:
        logger.error(f"Database error during onboarding: {db_error}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        logger.error(f"Unexpected error during onboarding: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")