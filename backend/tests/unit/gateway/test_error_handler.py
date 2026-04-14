"""统一错误响应模型测试。

验证 ErrorResponse 模型和异常处理器的基本功能。
"""

import pytest
from fastapi import FastAPI, status
from fastapi.testclient import TestClient

from app.gateway.error_handler import (
    AuthenticationError,
    ConflictError,
    DeerFlowException,
    ErrorDetail,
    ErrorResponse,
    NotFoundError,
    PermissionError,
    ValidationError,
    register_exception_handlers,
)


@pytest.fixture
def test_app() -> FastAPI:
    """创建测试用 FastAPI 应用。"""
    app = FastAPI(title="Test App")
    register_exception_handlers(app)

    @app.get("/not-found")
    def raise_not_found():
        raise NotFoundError("Agent", "test-agent")

    @app.get("/validation-error")
    def raise_validation():
        raise ValidationError("Invalid input", [ErrorDetail(field="name", message="Name is required")])

    @app.get("/auth-error")
    def raise_auth():
        raise AuthenticationError("Token expired")

    @app.get("/permission-error")
    def raise_permission():
        raise PermissionError("Admin access required")

    @app.get("/conflict-error")
    def raise_conflict():
        raise ConflictError("Agent already exists")

    @app.get("/custom-error")
    def raise_custom():
        raise DeerFlowException(
            message="Custom error occurred",
            error_code="custom_error",
            error_type="internal",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    @app.get("/http-exception")
    def raise_http_exception():
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Resource not found via HTTPException")

    return app


@pytest.fixture
def client(test_app: FastAPI) -> TestClient:
    """创建测试客户端。"""
    return TestClient(test_app, raise_server_exceptions=False)


class TestErrorResponseModel:
    """测试 ErrorResponse 模型。"""

    def test_error_response_creation(self):
        """测试 ErrorResponse 基本创建。"""
        response = ErrorResponse(
            error="test_error",
            message="Test error message",
            type="validation",
        )

        assert response.error == "test_error"
        assert response.message == "Test error message"
        assert response.type == "validation"
        assert response.request_id is not None
        assert response.timestamp is not None

    def test_error_response_with_details(self):
        """测试带详细信息的 ErrorResponse。"""
        details = [
            ErrorDetail(field="name", message="Name is required", code="required"),
            ErrorDetail(field="email", message="Invalid email format", code="invalid_format"),
        ]

        response = ErrorResponse(
            error="validation_error",
            message="Validation failed",
            type="validation",
            details=details,
            path="/api/test",
        )

        assert len(response.details) == 2
        assert response.details[0].field == "name"
        assert response.details[1].code == "invalid_format"

    def test_error_response_json_serialization(self):
        """测试 ErrorResponse JSON 序列化。"""
        response = ErrorResponse(
            error="not_found",
            message="Agent not found",
            type="not_found",
            path="/api/agents/test",
        )

        json_data = response.model_dump(mode="json")

        assert json_data["error"] == "not_found"
        assert json_data["message"] == "Agent not found"
        assert json_data["type"] == "not_found"
        assert "request_id" in json_data
        assert "timestamp" in json_data


class TestDeerFlowExceptions:
    """测试自定义异常类。"""

    def test_not_found_error(self):
        """测试 NotFoundError。"""
        exc = NotFoundError("Agent", "test-agent")

        assert exc.message == "Agent not found: test-agent"
        assert exc.error_code == "agent_not_found"
        assert exc.error_type == "not_found"
        assert exc.status_code == status.HTTP_404_NOT_FOUND

    def test_not_found_error_without_identifier(self):
        """测试不带标识符的 NotFoundError。"""
        exc = NotFoundError("Resource")

        assert exc.message == "Resource not found"
        assert exc.error_code == "resource_not_found"

    def test_validation_error(self):
        """测试 ValidationError。"""
        details = [ErrorDetail(field="name", message="Required")]
        exc = ValidationError("Validation failed", details)

        assert exc.message == "Validation failed"
        assert exc.error_code == "validation_error"
        assert exc.error_type == "validation"
        assert exc.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_authentication_error(self):
        """测试 AuthenticationError。"""
        exc = AuthenticationError("Token expired")

        assert exc.message == "Token expired"
        assert exc.error_code == "authentication_failed"
        assert exc.error_type == "auth"
        assert exc.status_code == status.HTTP_401_UNAUTHORIZED

    def test_permission_error(self):
        """测试 PermissionError。"""
        exc = PermissionError("Admin only")

        assert exc.message == "Admin only"
        assert exc.error_code == "permission_denied"
        assert exc.error_type == "permission"
        assert exc.status_code == status.HTTP_403_FORBIDDEN

    def test_conflict_error(self):
        """测试 ConflictError。"""
        exc = ConflictError("Resource already exists")

        assert exc.message == "Resource already exists"
        assert exc.error_code == "resource_conflict"
        assert exc.error_type == "conflict"
        assert exc.status_code == status.HTTP_409_CONFLICT


class TestExceptionHandlers:
    """测试异常处理器。"""

    def test_not_found_handler(self, client: TestClient):
        """测试 404 异常处理。"""
        response = client.get("/not-found")

        assert response.status_code == 404
        data = response.json()

        assert data["error"] == "agent_not_found"
        assert "test-agent" in data["message"]
        assert data["type"] == "not_found"
        assert data["request_id"] is not None
        assert data["path"] == "/not-found"

    def test_validation_error_handler(self, client: TestClient):
        """测试验证错误处理。"""
        response = client.get("/validation-error")

        assert response.status_code == 422
        data = response.json()

        assert data["error"] == "validation_error"
        assert data["type"] == "validation"
        assert len(data["details"]) == 1
        assert data["details"][0]["field"] == "name"

    def test_auth_error_handler(self, client: TestClient):
        """测试认证错误处理。"""
        response = client.get("/auth-error")

        assert response.status_code == 401
        data = response.json()

        assert data["error"] == "authentication_failed"
        assert data["type"] == "auth"
        assert "Token expired" in data["message"]

    def test_permission_error_handler(self, client: TestClient):
        """测试权限错误处理。"""
        response = client.get("/permission-error")

        assert response.status_code == 403
        data = response.json()

        assert data["error"] == "permission_denied"
        assert data["type"] == "permission"

    def test_conflict_error_handler(self, client: TestClient):
        """测试冲突错误处理。"""
        response = client.get("/conflict-error")

        assert response.status_code == 409
        data = response.json()

        assert data["error"] == "resource_conflict"
        assert data["type"] == "conflict"

    def test_custom_error_handler(self, client: TestClient):
        """测试自定义错误处理。"""
        response = client.get("/custom-error")

        assert response.status_code == 500
        data = response.json()

        assert data["error"] == "custom_error"
        assert data["type"] == "internal"
        assert "Custom error occurred" in data["message"]

    def test_http_exception_handler(self, client: TestClient):
        """测试 HTTPException 转换处理。"""
        response = client.get("/http-exception")

        assert response.status_code == 404
        data = response.json()

        assert data["error"] == "not_found"
        assert data["type"] == "not_found"
        assert "Resource not found via HTTPException" in data["message"]


class TestHelperFunctions:
    """测试辅助函数。"""

    def test_raise_not_found(self):
        """测试 raise_not_found 辅助函数。"""
        with pytest.raises(NotFoundError) as exc_info:
            from app.gateway.error_handler import raise_not_found

            raise_not_found("Thread", "thread-123")

        assert exc_info.value.message == "Thread not found: thread-123"

    def test_raise_validation_error(self):
        """测试 raise_validation_error 辅助函数。"""
        with pytest.raises(ValidationError) as exc_info:
            from app.gateway.error_handler import raise_validation_error

            raise_validation_error("Invalid format", field="email")

        assert exc_info.value.message == "Invalid format"
        assert exc_info.value.details is not None
        assert exc_info.value.details[0].field == "email"

    def test_raise_auth_error(self):
        """测试 raise_auth_error 辅助函数。"""
        with pytest.raises(AuthenticationError) as exc_info:
            from app.gateway.error_handler import raise_auth_error

            raise_auth_error("Invalid token")

        assert exc_info.value.message == "Invalid token"

    def test_raise_permission_error(self):
        """测试 raise_permission_error 辅助函数。"""
        with pytest.raises(PermissionError) as exc_info:
            from app.gateway.error_handler import raise_permission_error

            raise_permission_error()

        assert exc_info.value.message == "Insufficient permissions"

    def test_raise_conflict_error(self):
        """测试 raise_conflict_error 辅助函数。"""
        with pytest.raises(ConflictError) as exc_info:
            from app.gateway.error_handler import raise_conflict_error

            raise_conflict_error("Duplicate entry")

        assert exc_info.value.message == "Duplicate entry"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
