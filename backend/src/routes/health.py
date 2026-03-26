"""Health check endpoint."""
from fastapi import APIRouter, Depends

from src.config import Settings, get_settings

router = APIRouter()


@router.get("/health")
async def health_check(settings: Settings = Depends(get_settings)) -> dict:
    """Return health status of the service."""
    return {
        "status": "ok",
        "version": settings.VERSION,
    }
