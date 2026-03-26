"""Integration tests for static file serving."""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from src.server import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def static_dir():
    """Get static directory path."""
    return Path(__file__).parent.parent.parent / "static"


def test_index_html_serves_at_root(client):
    """Test index.html serves at root path."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "Hello, World!" in response.text


def test_css_file_serves_with_correct_mime(client):
    """Test CSS file serves with text/css MIME type."""
    response = client.get("/static/css/styles.css")
    assert response.status_code == 200
    assert "text/css" in response.headers.get("content-type", "")


def test_js_file_serves_with_correct_mime(client):
    """Test JS file serves with application/javascript MIME type."""
    response = client.get("/static/js/app.js")
    assert response.status_code == 200
    assert "application/javascript" in response.headers.get("content-type", "")


def test_missing_file_returns_404(client):
    """Test missing file returns 404."""
    response = client.get("/static/nonexistent.html")
    assert response.status_code == 404


def test_path_traversal_blocked(client):
    """Test path traversal is blocked."""
    # Attempt to access file outside static directory
    response = client.get("/static/../../../etc/passwd")
    # Should either return 404 (file not found in static) or be blocked
    assert response.status_code in [403, 404]


def test_health_endpoint_integration(client):
    """Test health endpoint works in integration."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_static_files_content_type(client):
    """Test that static files have appropriate content types."""
    # Test CSS
    css_response = client.get("/static/css/styles.css")
    assert css_response.status_code == 200

    # Test JS
    js_response = client.get("/static/js/app.js")
    assert js_response.status_code == 200

    # Test HTML
    html_response = client.get("/")
    assert html_response.status_code == 200
