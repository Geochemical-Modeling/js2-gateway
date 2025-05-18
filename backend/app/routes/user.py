from fastapi import APIRouter, Request, Response, HTTPException, Depends, status
from sqlmodel import select, update, Session, col
from app.db import User, get_session
from sqlalchemy.exc import SQLAlchemyError
import logging
import requests
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.services.email_service import (
  send_new_user_notification,
  send_user_pending_notification,
  send_account_approved_notification,
)
from app.services.auth_utils import admin_required, get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class OnboardingData(BaseModel):
  name: Optional[str] = None
  email: Optional[str] = None
  institution: Optional[str] = None


class UserUpdateData(BaseModel):
  approved_user: Optional[int] = None
  admin_rights: Optional[int] = None
  archived: Optional[int] = None


class UserResponse(BaseModel):
  id: int
  email: str
  name: Optional[str] = None
  institution: Optional[str] = None
  approved_user: int = 0
  admin_rights: int = 0
  archived: int = 0
  onboarded: int = 0
  approved_at: Optional[datetime] = None


@router.post("/api/user/onboard")
async def complete_onboarding(
  data: OnboardingData, request: Request, response: Response
):
  """
  Update user information and mark them as onboarded.
  Send notification emails to admin and user.
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
      raise HTTPException(
        status_code=400, detail="Email missing from authentication data"
      )

    email = user_info["email"]

    # Check if the email matches the one in the request
    if data.email and data.email.lower() != email.lower():
      raise HTTPException(
        status_code=400, detail="Email in request does not match authenticated user"
      )

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

      # Send email notifications
      if db_user.approved_user == 0:
        # Send admin notification only if user is not already approved
        logger.info(f"Sending admin notification for new user: {db_user.id}")
        send_new_user_notification(db_user.id, db_user.name or "Unknown", db_user.email)

        # Send confirmation to user
        logger.info(f"Sending confirmation email to user: {db_user.email}")
        send_user_pending_notification(db_user.email, db_user.name or "New User")

      # Return the updated user data without sensitive fields
      return {
        "status": "success",
        "message": "User onboarding completed successfully",
        "user": {
          "id": db_user.id,
          "email": db_user.email,
          "name": db_user.name,
          "institution": db_user.institution,
          "onboarded": db_user.onboarded,
          "approved_user": db_user.approved_user,
        },
      }

  except SQLAlchemyError as db_error:
    logger.error(f"Database error during onboarding: {db_error}")
    raise HTTPException(status_code=500, detail="Database error occurred")
  except Exception as e:
    logger.error(f"Unexpected error during onboarding: {e}")
    raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.get("/api/admin/users", response_model=List[UserResponse])
async def list_users(
  request: Request,
  admin_user: User = Depends(admin_required),
  approved: Optional[int] = None,
  onboarded: Optional[int] = None,
  archived: Optional[int] = None,
):
  """
  List users with optional filtering. Admin access required.
  """
  try:
    with get_session() as session:
      if session is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

      # Build the query with filters
      query = select(User)

      if approved is not None:
        query = query.where(User.approved_user == approved)

      if onboarded is not None:
        query = query.where(User.onboarded == onboarded)

      if archived is not None:
        query = query.where(User.archived == archived)

      # Execute the query
      users = session.exec(query).all()

      return users

  except SQLAlchemyError as e:
    logger.error(f"Database error listing users: {e}")
    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
  except Exception as e:
    logger.error(f"Error listing users: {e}")
    raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
  user_id: int,
  user_data: UserUpdateData,
  request: Request,
  admin_user: User = Depends(admin_required),
):
  """
  Update a user's status (approval, admin rights, archived). Admin access required.
  """
  try:
    with get_session() as session:
      if session is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

      # Find the user to update
      user = session.get(User, user_id)
      if not user:
        raise HTTPException(status_code=404, detail="User not found")

      # Track if approval status changed
      was_approved = user.approved_user == 1

      # Update user fields if provided
      if user_data.approved_user is not None:
        user.approved_user = user_data.approved_user
        # Set approval date if being approved
        if user_data.approved_user == 1 and not was_approved:
          user.approved_at = datetime.now()

      if user_data.admin_rights is not None:
        user.admin_rights = user_data.admin_rights

      if user_data.archived is not None:
        user.archived = user_data.archived

      # Save changes
      session.add(user)
      session.commit()
      session.refresh(user)

      # Send approval notification if newly approved
      if user_data.approved_user == 1 and not was_approved:
        send_account_approved_notification(user.email, user.name or "User")
        logger.info(f"Sent approval notification to user {user.id}: {user.email}")

      return user

  except SQLAlchemyError as e:
    logger.error(f"Database error updating user {user_id}: {e}")
    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
  except Exception as e:
    logger.error(f"Error updating user {user_id}: {e}")
    raise HTTPException(status_code=500, detail=str(e))
