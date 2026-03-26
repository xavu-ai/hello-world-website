"""FastAPI static file server."""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.config import get_settings
from src.middleware.security import SecurityHeadersMiddleware
from src.routes.health import router as health_router

# Configure structured logging
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")
    yield
    logger.info("Shutting down server")


app = FastAPI(
    title="Static File Server",
    version=settings.VERSION,
    lifespan=lifespan,
)

# Add security headers
app.add_middleware(SecurityHeadersMiddleware)

# Include health router
app.include_router(health_router, tags=["health"])

# Determine static files path
static_dir = Path(__file__).parent.parent / settings.STATIC_DIR

if not static_dir.exists():
    static_dir.mkdir(parents=True, exist_ok=True)
    logger.warning(f"Created static directory: {static_dir}")


@app.exception_handler(FileNotFoundError)
async def file_not_found_handler(request: Request, exc: FileNotFoundError) -> JSONResponse:
    """Handle file not found errors."""
    logger.warning(f"File not found: {request.url.path}")
    return JSONResponse(
        status_code=404,
        content={"error": "File not found", "code": "NOT_FOUND"},
    )


@app.exception_handler(PermissionError)
async def permission_error_handler(request: Request, exc: PermissionError) -> JSONResponse:
    """Handle permission errors (e.g., path traversal)."""
    logger.warning(f"Permission denied: {request.url.path}")
    return JSONResponse(
        status_code=403,
        content={"error": "Forbidden", "code": "FORBIDDEN"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": "INTERNAL_ERROR"},
    )


# Path traversal protection
@app.middleware("http")
async def path_traversal_protection(request: Request, call_next):
    """Block path traversal attempts."""
    path = request.url.path
    if ".." in path or path.startswith("/"):
        # Check for directory traversal
        normalized = os.path.normpath(path)
        if ".." in normalized:
            logger.warning(f"Path traversal attempt blocked: {path}")
            return JSONResponse(
                status_code=403,
                content={"error": "Forbidden", "code": "PATH_TRAVERSAL_BLOCKED"},
            )
    return await call_next(request)


# Serve index.html at root
@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve index.html at root."""
    index_path = static_dir / "index.html"
    if index_path.exists():
        return HTMLResponse(index_path.read_text())
    raise FileNotFoundError("index.html not found")


# Serve static files
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.server:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
