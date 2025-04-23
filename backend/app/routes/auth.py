from starlette.responses import RedirectResponse
from fastapi import Request, Response
from fastapi import APIRouter
import os, requests

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
    curl -d grant_type=authorization_code \
     -d client_id=$CILOGON_CLIENT_ID \
     -d client_secret=$CILOGON_CLIENT_SECRET \
     -d code=$CILOGON_CODE \
     -d redirect_uri=$CILOGON_REDIRECT_URI \
  https://cilogon.org/oauth2/token \
  > cilogon-token-response.json

    export CILOGON_ACCESS_TOKEN=$(jq -r .access_token < cilogon-token-response.json)
    export CILOGON_REFRESH_TOKEN=$(jq -r .refresh_token < cilogon-token-response.json)
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
                response = RedirectResponse(url="/")
                response.set_cookie(
                    key="access_token", value=access_token, httponly=True
                )
                return response
            except requests.exceptions.JSONDecodeError:
                return {
                    "status": "error",
                    "message": "Failed to decode user info response as JSON",
                    "details": user_info_response.text,
                }
        else:
            return {
                "status": "error",
                "message": "Failed to fetch user info",
                "details": user_info_response.text,
            }
    return {
        "status": "error",
        "message": "Failed to fetch access token",
        "details": response.json(),
    }


@router.get("/auth/me", tags=["auth"])
async def auth_me(request: Request, response: Response):
    """
    Get the userinfo.
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
            CILOGON_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"}
        )
    except requests.exceptions.RequestException as e:
        response.delete_cookie("access_token")
        return {
            "status": "failure",
            "message": "Failed to fetch user info",
            "details": str(e),
        }
    if user_info_response.status_code == 200:
        try:
            user_info = user_info_response.json()
            return {
                "status": "success",
                "message": "User authenticated successfully",
                "user_info": user_info,
                "access_token": access_token,
            }
        except requests.exceptions.JSONDecodeError:
            response.delete_cookie("access_token")
            return {
                "status": "failure",
                "message": "Failed to decode user info response as JSON",
                "details": user_info_response.text,
            }
    else:
        response.delete_cookie("access_token")
        return {
            "status": "failure",
            "message": "Failed to fetch user info",
            "details": user_info_response.text,
        }



@router.get("/auth/logout", tags=["auth"])
async def auth_logout(response: Response):
    """
    Logout the user.
    """
    response = RedirectResponse(url="/")
    response.delete_cookie("access_token")
    return response