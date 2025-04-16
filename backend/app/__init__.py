from app.routes import auth_me, auth

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Include the auth_me router
app.include_router(auth_me.router, tags=["auth"])
app.include_router(auth.router, tags=["auth"])

# Serve all static files (JS, CSS, images, etc.)
app.mount("/static", StaticFiles(directory="/app/dist/static"), name="static")

# Serve index.html for root and any unmatched frontend routes
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    index_path = os.path.join("/app/dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}
