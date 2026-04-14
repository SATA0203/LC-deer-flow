# 统一错误响应系统 - 使用指南

## 📋 概述

已完成 DeerFlow API 错误响应标准化重构，解决弊端 5：API 错误响应不一致问题。

## ✅ 已完成的工作

### 1. 核心文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `backend/app/gateway/error_handler.py` | 统一错误处理模块 | ✅ 已创建 |
| `backend/app/gateway/app.py` | 注册异常处理器 | ✅ 已修改 |
| `backend/tests/unit/gateway/test_error_handler.py` | 单元测试 | ✅ 已创建 |

### 2. 功能特性

#### 统一错误响应模型
```json
{
  "error": "agent_not_found",
  "message": "Agent not found: test-agent",
  "type": "not_found",
  "details": null,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/agents/test-agent"
}
```

#### 自定义异常类
- `NotFoundError` - 404 资源未找到
- `ValidationError` - 422 验证错误
- `AuthenticationError` - 401 认证失败
- `PermissionError` - 403 权限不足
- `ConflictError` - 409 资源冲突
- `ServiceUnavailableError` - 503 服务不可用

#### 辅助函数
```python
from app.gateway.error_handler import (
    raise_not_found,
    raise_validation_error,
    raise_auth_error,
    raise_permission_error,
    raise_conflict_error
)

# 使用示例
raise_not_found("Agent", "test-agent")
raise_validation_error("Invalid email format", field="email")
raise_auth_error("Token expired")
```

## 🚀 使用方法

### 方式 1：使用自定义异常类

```python
from app.gateway.error_handler import NotFoundError, ValidationError

@app.get("/agents/{name}")
def get_agent(name: str):
    agent = db.get_agent(name)
    if not agent:
        raise NotFoundError("Agent", name)
    return agent
```

### 方式 2：使用辅助函数

```python
from app.gateway.error_handler import raise_not_found, raise_validation_error

@app.post("/agents")
def create_agent(data: AgentCreateRequest):
    if db.agent_exists(data.name):
        raise_conflict_error(f"Agent '{data.name}' already exists")
    if not is_valid_name(data.name):
        raise_validation_error("Invalid agent name format", field="name")
    return db.create_agent(data)
```

### 方式 3：保留 HTTPException（自动转换）

```python
from fastapi import HTTPException

@app.get("/legacy")
def legacy_endpoint():
    # 旧的 HTTPException 会自动转换为统一格式
    raise HTTPException(status_code=404, detail="Not found")
```

## 🧪 测试

语法验证已通过：
- ✅ error_handler.py
- ✅ app.py  
- ✅ test_error_handler.py

完整测试需要安装依赖后运行：
```bash
cd /workspace/backend
pytest tests/unit/gateway/test_error_handler.py -v
```

## 📊 迁移指南

### 现有代码迁移步骤

1. **识别现有 HTTPException 使用**
   ```bash
   grep -r "HTTPException" backend/app/gateway/routers/
   ```

2. **逐步替换为自定义异常**
   ```python
   # 旧代码
   from fastapi import HTTPException
   raise HTTPException(status_code=404, detail="Agent not found")
   
   # 新代码
   from app.gateway.error_handler import raise_not_found
   raise_not_found("Agent", agent_id)
   ```

3. **保留向后兼容**
   - 现有 `HTTPException` 仍可使用，会自动转换
   - 建议新代码使用自定义异常

### 迁移优先级

| 路由文件 | 优先级 | HTTPException 数量 |
|---------|--------|-------------------|
| `agents.py` | P1 | ~15 |
| `threads.py` | P1 | ~10 |
| `runs.py` | P2 | ~8 |
| `skills.py` | P2 | ~5 |
| 其他 | P3 | <5 each |

## 🎯 收益

1. **一致性**: 所有错误响应格式统一
2. **可观测性**: 每个错误都有 request_id 便于追踪
3. **国际化友好**: error code + message 分离
4. **类型安全**: Pydantic 模型保证响应结构
5. **日志增强**: 自动记录错误级别和上下文

## ⚠️ 注意事项

1. **依赖要求**: 需要 FastAPI + Pydantic v2
2. **向后兼容**: 现有 HTTPException 仍可用
3. **性能影响**: 微乎其微（仅增加 dict 序列化）

## 📝 下一步

1. ✅ 核心功能已完成
2. ⏳ 迁移现有路由（可选，渐进式）
3. ⏳ 添加集成测试验证实际 API
4. ⏳ 更新 API 文档

---

**状态**: ✅ 完成  
**日期**: 2025-01-15  
**影响范围**: 所有 API 路由  
**回归风险**: 低（向后兼容）
