"""统一错误响应模型和异常处理中间件。

解决弊端 5: API 错误响应不一致问题
- 定义标准 ErrorResponse 模型
- 提供统一的异常处理装饰器
- 激活 log_level 配置
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from typing import Any, Literal

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ============================================================================
# 错误响应模型
# ============================================================================


class ErrorDetail(BaseModel):
    """详细错误信息模型。"""

    field: str | None = Field(default=None, description="出错的字段名")
    message: str = Field(..., description="具体错误描述")
    code: str | None = Field(default=None, description="错误代码")


class ErrorResponse(BaseModel):
    """统一错误响应模型。

    Attributes:
        error: 错误类型标识符 (snake_case)
        message: 人类可读的错误描述
        type: 错误分类 (not_found, validation, auth, internal 等)
        details: 可选的详细错误信息列表
        request_id: 请求追踪 ID
        timestamp: 错误发生时间 (ISO 8601)
        path: 请求路径
    """

    error: str = Field(..., description="错误类型标识符")
    message: str = Field(..., description="人类可读的错误描述")
    type: Literal["not_found", "validation", "auth", "permission", "conflict", "internal", "service_unavailable"] = Field(
        ..., description="错误分类"
    )
    details: list[ErrorDetail] | None = Field(default=None, description="详细错误信息")
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="请求追踪 ID")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="错误发生时间")
    path: str | None = Field(default=None, description="请求路径")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "agent_not_found",
                "message": "Agent 'research-bot' does not exist",
                "type": "not_found",
                "details": None,
                "request_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2025-01-15T10:30:00Z",
                "path": "/api/agents/research-bot",
            }
        }


# ============================================================================
# 自定义异常类
# ============================================================================


class DeerFlowException(Exception):
    """DeerFlow 自定义异常基类。"""

    def __init__(
        self,
        message: str,
        error_code: str,
        error_type: Literal["not_found", "validation", "auth", "permission", "conflict", "internal", "service_unavailable"] = "internal",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: list[ErrorDetail] | None = None,
    ):
        self.message = message
        self.error_code = error_code
        self.error_type = error_type
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundError(DeerFlowException):
    """资源未找到错误。"""

    def __init__(self, resource: str, identifier: str | None = None, details: list[ErrorDetail] | None = None):
        message = f"{resource} not found" + (f": {identifier}" if identifier else "")
        super().__init__(
            message=message,
            error_code=f"{resource.lower().replace(' ', '_')}_not_found",
            error_type="not_found",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ValidationError(DeerFlowException):
    """数据验证错误。"""

    def __init__(self, message: str, details: list[ErrorDetail] | None = None):
        super().__init__(
            message=message,
            error_code="validation_error",
            error_type="validation",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class AuthenticationError(DeerFlowException):
    """认证失败错误。"""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="authentication_failed",
            error_type="auth",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class PermissionError(DeerFlowException):
    """权限不足错误。"""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            error_code="permission_denied",
            error_type="permission",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ConflictError(DeerFlowException):
    """资源冲突错误。"""

    def __init__(self, message: str, details: list[ErrorDetail] | None = None):
        super().__init__(
            message=message,
            error_code="resource_conflict",
            error_type="conflict",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class ServiceUnavailableError(DeerFlowException):
    """服务不可用错误。"""

    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(
            message=message,
            error_code="service_unavailable",
            error_type="service_unavailable",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# ============================================================================
# 异常处理器
# ============================================================================


def _create_error_response(
    error: str,
    message: str,
    error_type: Literal["not_found", "validation", "auth", "permission", "conflict", "internal", "service_unavailable"],
    request: Request | None = None,
    details: list[ErrorDetail] | None = None,
    status_code: int | None = None,
) -> ErrorResponse:
    """创建统一错误响应对象。"""
    return ErrorResponse(
        error=error,
        message=message,
        type=error_type,
        details=details,
        request_id=request.headers.get("X-Request-ID") if request else None,
        path=str(request.url.path) if request else None,
    )


async def deerflow_exception_handler(request: Request, exc: DeerFlowException) -> JSONResponse:
    """处理 DeerFlow 自定义异常。"""
    error_response = _create_error_response(
        error=exc.error_code,
        message=exc.message,
        error_type=exc.error_type,
        request=request,
        details=exc.details,
    )

    # 记录日志
    log_level = logging.WARNING if exc.status_code < 500 else logging.ERROR
    logger.log(
        log_level,
        f"{exc.error_type.upper()} - {exc.error_code}: {exc.message} [path={request.url.path}, request_id={error_response.request_id}]",
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(mode="json"),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """处理 FastAPI HTTPException，转换为统一格式。"""
    # 映射 HTTP 状态码到错误类型
    if exc.status_code == status.HTTP_404_NOT_FOUND:
        error_type = "not_found"
        error_code = "not_found"
    elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
        error_type = "auth"
        error_code = "unauthorized"
    elif exc.status_code == status.HTTP_403_FORBIDDEN:
        error_type = "permission"
        error_code = "forbidden"
    elif exc.status_code == status.HTTP_409_CONFLICT:
        error_type = "conflict"
        error_code = "conflict"
    elif exc.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY:
        error_type = "validation"
        error_code = "validation_error"
    elif exc.status_code >= 500:
        error_type = "internal"
        error_code = "internal_server_error"
    else:
        error_type = "internal"
        error_code = "http_error"

    error_response = _create_error_response(
        error=error_code,
        message=str(exc.detail),
        error_type=error_type,  # type: ignore[arg-type]
        request=request,
        status_code=exc.status_code,
    )

    logger.warning(f"HTTP {exc.status_code}: {exc.detail} [path={request.url.path}]")

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(mode="json"),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """处理 Pydantic 验证错误，提供详细字段信息。"""
    details = []
    for err in exc.errors():
        details.append(
            ErrorDetail(
                field=".".join(str(x) for x in err.get("loc", [])),
                message=err.get("msg", "Unknown error"),
                code=err.get("type", "unknown"),
            )
        )

    error_response = _create_error_response(
        error="validation_error",
        message=f"Validation failed with {len(details)} error(s)",
        error_type="validation",
        request=request,
        details=details,
    )

    logger.info(f"Validation error: {len(details)} error(s) [path={request.url.path}]")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response.model_dump(mode="json"),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """处理未预期的异常，防止敏感信息泄露。"""
    error_response = _create_error_response(
        error="unexpected_error",
        message="An unexpected error occurred. Please try again later.",
        error_type="internal",
        request=request,
    )

    # 记录完整堆栈跟踪供调试
    logger.exception(f"Unexpected error: {exc} [path={request.url.path}, request_id={error_response.request_id}]")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(mode="json"),
    )


# ============================================================================
# 注册异常处理器
# ============================================================================


def register_exception_handlers(app: FastAPI) -> None:
    """注册所有异常处理器到 FastAPI 应用。

    Usage:
        from app.gateway.error_handler import register_exception_handlers

        app = FastAPI()
        register_exception_handlers(app)
    """
    app.add_exception_handler(DeerFlowException, deerflow_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    logger.info("Registered unified exception handlers")


# ============================================================================
# 辅助函数
# ============================================================================


def raise_not_found(resource: str, identifier: str | None = None) -> None:
    """快捷抛出 404 错误。

    Args:
        resource: 资源名称 (如 'Agent', 'Thread')
        identifier: 资源标识符 (可选)

    Raises:
        NotFoundError: 总是抛出
    """
    raise NotFoundError(resource, identifier)


def raise_validation_error(message: str, field: str | None = None) -> None:
    """快捷抛出 422 验证错误。

    Args:
        message: 错误消息
        field: 相关字段名 (可选)

    Raises:
        ValidationError: 总是抛出
    """
    details = [ErrorDetail(field=field, message=message)] if field else None
    raise ValidationError(message, details)


def raise_auth_error(message: str = "Authentication failed") -> None:
    """快捷抛出 401 认证错误。

    Args:
        message: 错误消息

    Raises:
        AuthenticationError: 总是抛出
    """
    raise AuthenticationError(message)


def raise_permission_error(message: str = "Insufficient permissions") -> None:
    """快捷抛出 403 权限错误。

    Args:
        message: 错误消息

    Raises:
        PermissionError: 总是抛出
    """
    raise PermissionError(message)


def raise_conflict_error(message: str) -> None:
    """快捷抛出 409 冲突错误。

    Args:
        message: 错误消息

    Raises:
        ConflictError: 总是抛出
    """
    raise ConflictError(message)
