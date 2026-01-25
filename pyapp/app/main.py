from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.sessions import SessionMiddleware

from .config import get_settings
from .info_api import router as info_router

# Create an instrumentor object
instrumentator = Instrumentator()


# Define the lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events.
    """

    yield  # Run FastAPI


# Initialize FastAPI app with the lifespan manager
app = FastAPI(lifespan=lifespan)
settings = get_settings()
app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY)
instrumentator.instrument(app)  # Adds Prometheus middleware during initialization
instrumentator.expose(app)  # Registers /metrics endpoint before other catch-all routes


# Include the API routers
app.include_router(info_router, prefix="/api", tags=["Info API"])


# --- Static Files Configuration in production ---
# In a production Docker build, the 'client/dist' files will be copied to 'pyapp/static'
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():  # Yes! We are running in a container
    # Mount the static directory for /assets
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    templates = Jinja2Templates(directory=str(STATIC_DIR))  # For templating index.html

    @app.get("/{full_path:path}", tags=["Client"])
    async def serve_react_app(request: Request, full_path: str):
        """
        Catch-all endpoint to serve the React files outside 'assets'
        """
        if not full_path:
            full_path = "index.html"
        file_path = STATIC_DIR / full_path
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        if full_path == "index.html":
            return templates.TemplateResponse(
                request=request, name="index.html", context=dict(settings)
            )  # Add environment variables
        else:
            return FileResponse(str(file_path))

else:  # We are running in dev
    from .auth_api import auth_router

    app.include_router(auth_router, include_in_schema=False)  # We need the '/auth' API


# Add a root endpoint for basic API health check
@app.get("/", include_in_schema=False)
def read_root():
    return {"message": "FastAPI server is running"}
