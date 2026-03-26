"""Pydantic settings for the application."""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Server settings
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Static files
    STATIC_DIR: str = "static"

    # Logging
    LOG_LEVEL: Literal["debug", "info", "warning", "error", "critical"] = "info"

    # Version
    VERSION: str = "1.0.0"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
