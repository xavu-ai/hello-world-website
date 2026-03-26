"""Tests for config module."""
import pytest
from pydantic import ValidationError

from src.config import Settings, get_settings


def test_settings_defaults():
    """Test default settings values."""
    settings = Settings()
    assert settings.PORT == 8000
    assert settings.HOST == "0.0.0.0"
    assert settings.STATIC_DIR == "static"
    assert settings.LOG_LEVEL == "info"
    assert settings.VERSION == "1.0.0"


def test_settings_custom_values(monkeypatch):
    """Test custom settings values from environment."""
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("LOG_LEVEL", "debug")
    monkeypatch.setenv("VERSION", "2.0.0")

    settings = Settings()

    assert settings.PORT == 9000
    assert settings.LOG_LEVEL == "debug"
    assert settings.VERSION == "2.0.0"


def test_settings_invalid_log_level():
    """Test invalid log level raises validation error."""
    with pytest.raises(ValidationError):
        Settings(LOG_LEVEL="invalid")


def test_settings_log_level_values():
    """Test valid log level values."""
    for level in ["debug", "info", "warning", "error", "critical"]:
        settings = Settings(LOG_LEVEL=level)
        assert settings.LOG_LEVEL == level


def test_get_settings_returns_cached():
    """Test that get_settings returns cached instance."""
    settings1 = get_settings()
    settings2 = get_settings()
    assert settings1 is settings2


def test_settings_model_config():
    """Test settings model configuration."""
    settings = Settings()
    assert settings.model_config["case_sensitive"] is True
