from app.routes import auth_me, auth

from app.routes.h2s import h2s_calc
from app.routes.co2 import co2_calc

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse

from fastapi.staticfiles import StaticFiles
import os



app = FastAPI()

# Universal exception handler specifically for HTTPExceptions
# The motivation is to catch all HTTPExceptions and return a consistent JSON response.
@app.exception_handler(HTTPException)
async def exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )

# Inside the the calculators
# app.include_router(h2s_calc.router, prefix="/api/h2s", tags="h2s")
app.include_router(co2_calc.router, prefix="/api/co2", tags="co2")

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
