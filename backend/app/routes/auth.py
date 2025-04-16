from starlette.responses import RedirectResponse
from fastapi import APIRouter
import os, requests

router = APIRouter()

@router.get("/auth", tags=["auth"])
async def auth_me():
    """
    Redirect for OIDC authentication.
    """
    CILOGON_CLIENT_ID = os.getenv("CILOGON_CLIENT_ID")
    CILOGON_CLIENT_SECRET = os.getenv("CILOGON_CLIENT_SECRET")
    CILOGON_REDIRECT_URI = os.getenv("CILOGON_REDIRECT_URI")
    
    # Placeholder for now
    return RedirectResponse(url=f"https://cilogon.org/authorize?response_type=code&client_id={CILOGON_CLIENT_ID}&redirect_uri={CILOGON_REDIRECT_URI}&scope=openid+profile+email+org.cilogon.userinfo")

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
    CILOGON_USERINFO_URL = "https://cilogon.org/userinfo"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "authorization_code",
        "client_id": CILOGON_CLIENT_ID,
        "client_secret": CILOGON_CLIENT_SECRET,
        "code": code,
        "redirect_uri": CILOGON_REDIRECT_URI
    }
    # Make the request
    response = requests.post(CILOGON_TOKEN_URL, headers=headers, data=data)
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the response
        token_response = response.json()
        access_token = token_response.get("access_token")
        refresh_token = token_response.get("refresh_token")
        id_token = token_response.get("id_token")

        # Use the access token to get user info
        user_info_response = requests.get(CILOGON_USERINFO_URL, headers={
            "Authorization": f"Bearer {access_token}"
        })
        
        if user_info_response.status_code == 200:
            user_info = user_info_response.json()
            return {
                "status": "success",
                "message": "User authenticated successfully",
                "user_info": user_info,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "id_token": id_token
            }
        else:
            return {
                "status": "error",
                "message": "Failed to fetch user info",
                "details": user_info_response.json()
            }
    return {
        "status": "error",
        "message": "Failed to fetch access token",
        "details": response.json()
    }