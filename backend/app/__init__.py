from app.routes import auth, user
from app.routes.co2 import co2_calc
from app.routes.rate import rate_calc
from app.routes.phreeqc import phreeqc_calc
from app.routes.supcrtbl import supcrtbl_calc
from app.routes import minerals
from app.routes.h2s import h2s_calc

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


# Setup middleware layer; for prod we should probably just let the only the client be the allowed origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The motivation is to catch all HTTPExceptions and return a consistent JSON response.
# NOTE: If changed, please reflect those changes on frontend as well. It's simple just go to the fetch
# functions for each calc.
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    err_content = {"status_code": exc.status_code, "message": exc.detail}
    return JSONResponse(
        status_code=exc.status_code,
        content=err_content,
    )


app.include_router(minerals.router, tags=["minerals"])
app.include_router(phreeqc_calc.router, tags=["phreeqc"])
app.include_router(supcrtbl_calc.router, tags=["Supcrtbl"])
app.include_router(co2_calc.router, tags=["CO2"])
app.include_router(h2s_calc.router, tags=["H2S"])
app.include_router(auth.router, tags=["auth"])
app.include_router(user.router, tags=["user"])
app.include_router(rate_calc.router, tags=["Rate"])

# Serve all static files (JS, CSS, images, etc.)
app.mount("/static", StaticFiles(directory="/app/dist/static"), name="static")

# Serve index.html for root and any unmatched frontend routes
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    index_path = os.path.join("/app/dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}
