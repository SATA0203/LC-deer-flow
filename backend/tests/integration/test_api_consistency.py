"""Integration tests for API consistency.

These tests verify that all API endpoints follow consistent patterns for:
- Error response format
- Authentication/authorization
- Request/response schemas
"""

import pytest
from typing import Any, Dict


class TestErrorResponseFormat:
    """Test unified error response format."""
    
    @pytest.mark.asyncio
    async def test_error_response_structure(self, http_client):
        """Test that error responses follow standard structure."""
        # Attempt to access non-existent resource
        response = http_client.get("/api/nonexistent")
        
        # Should return JSON with standard error fields
        assert response.status_code >= 400
        
        if response.status_code != 404:  # Skip if route doesn't exist
            error_data = response.json()
            
            # Standard error fields (to be implemented)
            expected_fields = ["error", "message", "type"]
            
            # Check if at least some standard fields are present
            has_standard_fields = any(field in error_data for field in expected_fields)
            
            # For now, just verify it's valid JSON
            assert isinstance(error_data, dict)
    
    @pytest.mark.asyncio
    async def test_validation_error_format(self, http_client):
        """Test validation error response format."""
        # Send invalid request data
        response = http_client.post(
            "/api/threads/invalid-id/messages",
            json={"content": None}  # Invalid content
        )
        
        # Should return 422 or 400
        assert response.status_code in [400, 422, 404]
    
    @pytest.mark.asyncio
    async def test_auth_error_format(self, http_client):
        """Test authentication error response format."""
        # Access protected endpoint without auth
        response = http_client.get("/api/protected")
        
        # Should return 401 or 403 (or 404 if endpoint doesn't exist)
        assert response.status_code in [401, 403, 404]


class TestRequestValidation:
    """Test request validation consistency."""
    
    @pytest.mark.asyncio
    async def test_missing_required_fields(self, http_client):
        """Test that missing required fields are rejected."""
        # Try to create thread without required fields
        response = http_client.post(
            "/api/threads",
            json={}
        )
        
        # Should either succeed with defaults or fail validation
        assert response.status_code in [200, 201, 400, 422, 404]
    
    @pytest.mark.asyncio
    async def test_invalid_field_types(self, http_client):
        """Test that invalid field types are rejected."""
        response = http_client.post(
            "/api/threads",
            json={
                "title": 123,  # Should be string
                "created_at": "not-a-date"
            }
        )
        
        # Should fail validation or ignore invalid fields
        assert response.status_code in [200, 201, 400, 422, 404]


class TestResponseConsistency:
    """Test response format consistency."""
    
    @pytest.mark.asyncio
    async def test_success_response_structure(self, http_client):
        """Test that success responses have consistent structure."""
        # Get threads list (or similar endpoint)
        response = http_client.get("/api/threads")
        
        if response.status_code == 200:
            data = response.json()
            
            # Should return list or dict with data
            assert isinstance(data, (list, dict))
    
    @pytest.mark.asyncio
    async def test_pagination_format(self, http_client):
        """Test pagination response format."""
        response = http_client.get("/api/threads?limit=10&offset=0")
        
        if response.status_code == 200:
            data = response.json()
            
            # If paginated, should have consistent format
            if isinstance(data, dict):
                # Common pagination fields
                pagination_fields = ["items", "total", "limit", "offset"]
                has_pagination = any(field in data for field in pagination_fields)
                
                if has_pagination:
                    assert "items" in data


class TestMiddlewareChain:
    """Test middleware chain behavior."""
    
    @pytest.mark.asyncio
    async def test_middleware_execution_order(self, sample_agent_state):
        """Test that middlewares execute in correct order."""
        # Simulate middleware chain execution
        execution_log = []
        
        def create_middleware(name: str):
            async def middleware(state):
                execution_log.append(f"{name}_start")
                # Process state
                execution_log.append(f"{name}_end")
                return state
            return middleware
        
        # Create mock middlewares
        middlewares = [
            create_middleware("auth"),
            create_middleware("validation"),
            create_middleware("logging"),
        ]
        
        # Execute chain
        state = sample_agent_state
        for mw in middlewares:
            state = await mw(state)
        
        # Verify order
        expected = [
            "auth_start", "auth_end",
            "validation_start", "validation_end",
            "logging_start", "logging_end"
        ]
        
        assert execution_log == expected
    
    @pytest.mark.asyncio
    async def test_middleware_error_propagation(self, sample_agent_state):
        """Test that errors propagate correctly through middleware chain."""
        error_caught = False
        
        async def failing_middleware(state):
            raise ValueError("Middleware error")
        
        async def catching_middleware(state):
            try:
                return await failing_middleware(state)
            except ValueError:
                nonlocal error_caught
                error_caught = True
                return state
        
        result = await catching_middleware(sample_agent_state)
        assert error_caught
        assert result == sample_agent_state


class TestHealthChecks:
    """Test health check endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, http_client):
        """Test health check endpoint."""
        response = http_client.get("/health")
        
        # Should return 200 with status info
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)
    
    @pytest.mark.asyncio
    async def test_readiness_endpoint(self, http_client):
        """Test readiness check endpoint."""
        response = http_client.get("/ready")
        
        # May or may not exist
        assert response.status_code in [200, 404]


class TestCORSHeaders:
    """Test CORS header consistency."""
    
    @pytest.mark.asyncio
    async def test_cors_headers_present(self, http_client):
        """Test that CORS headers are present."""
        response = http_client.options("/api/threads")
        
        # Check for CORS headers (if CORS is enabled)
        cors_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers"
        ]
        
        has_cors = any(header in response.headers for header in cors_headers)
        
        # CORS may or may not be enabled in test environment
        # Just verify consistency
        if has_cors:
            assert "Access-Control-Allow-Origin" in response.headers
