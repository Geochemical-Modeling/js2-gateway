from starlette.responses import RedirectResponse
from fastapi import Request, Response, APIRouter
import os, requests
import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select
from app.db import User, get_session
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/auth", tags=["auth"])
async def auth_me():
    """
    Redirect for OIDC authentication.
    """
    CILOGON_CLIENT_ID = os.getenv("CILOGON_CLIENT_ID")
    CILOGON_REDIRECT_URI = os.getenv("CILOGON_REDIRECT_URI")

    # Placeholder for now
    return RedirectResponse(
        url=f"https://cilogon.org/authorize?response_type=code&client_id={CILOGON_CLIENT_ID}&redirect_uri={CILOGON_REDIRECT_URI}&scope=openid+profile+email+org.cilogon.userinfo"
    )


@router.get("/callback", tags=["auth"])
async def auth_callback(code: str):
    """
    Callback endpoint for OIDC authentication.
    """
    # Make a request to the CILOGON token endpoint
    CILOGON_CLIENT_ID = os.getenv("CILOGON_CLIENT_ID")
    CILOGON_CLIENT_SECRET = os.getenv("CILOGON_CLIENT_SECRET")
    CILOGON_REDIRECT_URI = os.getenv("CILOGON_REDIRECT_URI")
    CILOGON_TOKEN_URL = "https://cilogon.org/oauth2/token"
    CILOGON_USERINFO_URL = "https://cilogon.org/oauth2/userinfo"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "authorization_code",
        "client_id": CILOGON_CLIENT_ID,
        "client_secret": CILOGON_CLIENT_SECRET,
        "code": code,
        "redirect_uri": CILOGON_REDIRECT_URI,
    }
    # Make the request
    response = requests.post(CILOGON_TOKEN_URL, headers=headers, data=data)
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the response
        token_response = response.json()
        access_token = token_response.get("access_token")

        # Use the access token to get user info
        user_info_response = requests.get(
            CILOGON_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )

        if user_info_response.status_code == 200:
            try:
                user_info = user_info_response.json()
                # Check to see if the user_info contains the email field
                if "email" not in user_info:
                    return RedirectResponse(url="/?alert=missing_email")
                response = RedirectResponse(url="/?alert=login_successful")
                # Set the access token in the cookies
                response.set_cookie(
                    key="access_token",
                    value=access_token,
                    httponly=True,
                    samesite="Lax",
                )
                return response
            except requests.exceptions.JSONDecodeError:
                return RedirectResponse(url="/?alert=invalid_userinfo_response")
        else:
            return RedirectResponse(url="/?alert=invalid_userinfo_response")
    return RedirectResponse(url="/?alert=invalid_token_response")


@router.get("/auth/logout", tags=["auth"])
async def auth_logout(response: Response):
    """
    Logout the user.
    """
    response = RedirectResponse(url="/?alert=logout")
    response.delete_cookie("access_token")
    return response


@router.get("/auth/me", tags=["auth"])
async def auth_me(request: Request, response: Response):
    """
    Get the userinfo with additional authorization details from the database.
    If user doesn't exist in the database, create a minimal user entry.
    """
    access_token = request.cookies.get("access_token")
    if access_token is None:
        response.delete_cookie("access_token")
        return {
            "status": "failure",
            "message": "Access token is required",
            "details": "Please provide a valid access token in the cookies.",
        }

    CILOGON_USERINFO_URL = "https://cilogon.org/oauth2/userinfo"

    try:
        user_info_response = requests.get(
            CILOGON_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"},
            timeout=2
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch user info: {e}")
        response.delete_cookie("access_token")
        return {
            "status": "failure",
            "message": "Failed to fetch user info",
            "details": str(e),
        }

    if user_info_response.status_code == 200:
        try:
            logger.info("User info response received successfully")
            user_info = user_info_response.json()

            # Get user authorization details from database using the email
            user_auth = {}
            db_status = "success"
            db_message = "Database lookup successful"
            is_new_user = False

            if "email" in user_info:
                email = user_info["email"]
                logger.info(f"Looking up user authorization for email: {email}")

                try:
                    with get_session() as session:
                        if session is None:
                            db_status = "warning"
                            db_message = "Database connection unavailable"
                            logger.warning(
                                "Database session is None, skipping user lookup"
                            )
                        else:
                            try:
                                logger.info(
                                    "Querying user_details table for existing user"
                                )
                                statement = select(User).where(User.email == email)
                                db_user = session.exec(statement).first()

                                if db_user:
                                    logger.info(
                                        f"Found existing user in database: {db_user.id}"
                                    )
                                    # Convert SQLModel to dict and add to response
                                    user_auth = {
                                        "id": db_user.id,
                                        "email": db_user.email,
                                        "name": db_user.name,
                                        "institution": db_user.institution,
                                        "approved_user": db_user.approved_user,
                                        "admin_rights": db_user.admin_rights,
                                        "approved_at": db_user.approved_at.isoformat()
                                        if db_user.approved_at
                                        else None,
                                        "archived": db_user.archived,
                                        "onboarded": db_user.onboarded,
                                    }
                                else:
                                    logger.info(
                                        f"User {email} not found, creating minimal user entry"
                                    )

                                    # Get name components from CILogon data if available
                                    name = user_info.get("name", "")
                                    if (
                                        "given_name" in user_info
                                        and "family_name" in user_info
                                    ):
                                        name = f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}"

                                    # Create new user with minimal defaults
                                    new_user = User(
                                        email=email,
                                        name=name.strip() if name else None,
                                        institution=user_info.get("idp_name", None),
                                        approved_user=0,  # Default to not approved
                                        admin_rights=0,  # Default to no admin rights
                                        archived=0,  # Default to not archived
                                        onboarded=0,  # Default to not onboarded
                                    )

                                    # Add and commit the new user
                                    try:
                                        session.add(new_user)
                                        session.commit()
                                        # Refresh to get the assigned ID
                                        session.refresh(new_user)
                                        logger.info(
                                            f"Created new user with ID: {new_user.id}"
                                        )

                                        # Set flag for new user creation
                                        is_new_user = True

                                        # Convert SQLModel to dict and add to response
                                        user_auth = {
                                            "id": new_user.id,
                                            "email": new_user.email,
                                            "name": new_user.name,
                                            "institution": new_user.institution,
                                            "approved_user": new_user.approved_user,
                                            "admin_rights": new_user.admin_rights,
                                            "approved_at": new_user.approved_at.isoformat()
                                            if new_user.approved_at
                                            else None,
                                            "archived": new_user.archived,
                                            "onboarded": new_user.onboarded,
                                        }

                                        db_message = "New user created successfully"
                                    except SQLAlchemyError as add_error:
                                        logger.error(
                                            f"Failed to create new user: {add_error}"
                                        )
                                        db_status = "error"
                                        db_message = f"Failed to create new user: {str(add_error)}"
                            except Exception as table_error:
                                db_status = "error"
                                db_message = f"Error querying user_details table: {str(table_error)}"
                                logger.error(db_message)
                except SQLAlchemyError as db_error:
                    db_status = "error"
                    db_message = f"Database connection error: {str(db_error)}"
                    logger.error(db_message)

            return {
                "status": "success",
                "message": "User authenticated successfully",
                "user_info": user_info,
                "user_auth": user_auth,
                "db_status": db_status,
                "db_message": db_message,
                "is_new_user": is_new_user,
                "access_token": access_token,
            }
        except requests.exceptions.JSONDecodeError:
            logger.error("Failed to decode user info response as JSON")
            response.delete_cookie("access_token")
            return {
                "status": "failure",
                "message": "Failed to decode user info response as JSON",
                "details": user_info_response.text,
            }
    else:
        logger.error(f"Failed to fetch user info: {user_info_response.status_code}")
        response.delete_cookie("access_token")
        return {
            "status": "failure",
            "message": "Failed to fetch user info",
            "details": user_info_response.text,
        }
