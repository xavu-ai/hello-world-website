"""Tests for health route."""
import pytest
from fastapi.testclient import TestClient

from src.server import app
from src.config import get_settings


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_health_check_response_format(client):
    """Test health check returns correct format."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert "version" in data
    assert data["status"] == "ok"


def test_health_check_returns_version(client):
    """Test health check returns version from settings."""
    settings = get_settings()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["version"] == settings.VERSION


def test_health_check_status_ok(client):
    """Test health check status is ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
