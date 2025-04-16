from fastapi import APIRouter

router = APIRouter()

@router.get("/auth/me", tags=["auth"])
async def auth_me():
    """
    Check the user cookies and returns their information.
    """
    # Placeholder for now, always returns failure
    return {
        "status": "failure",
        "message": "Not implemented yet",
        "user": {}
    }