"""Test configuration for integration tests.

Extends the base conftest.py with fixtures specific to integration testing:
- Async test support
- HTTP client fixtures
- Database isolation
- Sandbox mock utilities
"""

import asyncio
import os
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Generator
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient


# Enable async test support
pytest_plugins = ["pytest_asyncio"]


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for sandbox testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def mock_sandbox_provider():
    """Mock sandbox provider for safe testing."""
    mock = MagicMock()
    mock.execute_command = MagicMock(return_value={"stdout": "", "stderr": "", "exit_code": 0})
    return mock


@pytest.fixture
def app_config_override():
    """Override app config for integration tests."""
    from deerflow.config.app_config import AppConfig
    
    test_config = AppConfig(
        sandbox_working_dir="/tmp/test_sandbox",
        max_subagent_concurrency=2,
        enable_security_scan=True,
    )
    
    with patch("deerflow.config.app_config._app_config", test_config):
        yield test_config


@pytest_asyncio.fixture
async def http_client() -> AsyncGenerator[TestClient, None]:
    """Create an async HTTP client for API testing."""
    from app.main import app
    
    with TestClient(app) as client:
        yield client


@pytest.fixture
def sample_agent_state():
    """Sample agent state for middleware testing."""
    return {
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
        ],
        "thread_id": "test-thread-123",
        "run_id": "test-run-456",
    }


@pytest.fixture
def security_test_cases():
    """Security test cases for sandbox testing."""
    return {
        "command_injection": [
            "echo hello; rm -rf /",
            "echo hello && rm -rf /",
            "echo hello | rm -rf /",
            "$(rm -rf /)",
            "`rm -rf /`",
        ],
        "path_traversal": [
            "../../../etc/passwd",
            "....//....//etc/passwd",
            "/etc/passwd",
            "foo/../../../etc/passwd",
        ],
        "resource_exhaustion": [
            ":(){ :|:& };:",  # Fork bomb
            "while true; do :; done",  # Infinite loop
            "dd if=/dev/zero of=/tmp/fill bs=1M count=999999",  # Disk fill
        ],
    }
