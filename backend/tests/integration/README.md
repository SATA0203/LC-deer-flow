# Integration Tests for DeerFlow Backend

本目录包含 DeerFlow 后端的关键集成测试，用于验证重构后的系统稳定性和安全性。

## 测试分类

### 沙箱安全测试 (`test_sandbox_security_*.py`)
- 命令注入防护测试
- 路径遍历攻击测试
- 资源限制测试 (CPU/内存/进程数)

### 并发安全测试 (`test_concurrency_*.py`)
- 配置系统线程安全测试
- 子 Agent 线程池压力测试
- 全局状态竞态条件测试

### 中间件链测试 (`test_middleware_chain_*.py`)
- 中间件顺序验证
- 中间件性能基准测试
- 错误传播测试

### API 一致性测试 (`test_api_consistency_*.py`)
- 错误响应格式统一性测试
- 认证授权测试
- 请求/响应 schema 验证

## 运行测试

```bash
# 运行所有集成测试
pytest tests/integration/ -v

# 运行特定类别
pytest tests/integration/test_sandbox_security_*.py -v
pytest tests/integration/test_concurrency_*.py -v

# 生成覆盖率报告
pytest tests/integration/ --cov=deerflow --cov-report=html
```

## 新增测试指南

1. 测试文件命名：`test_<module>_<scenario>.py`
2. 使用 `pytest.fixture` 管理测试依赖
3. 异步测试使用 `@pytest.mark.asyncio`
4. 安全测试需包含正向和反向用例
5. 性能测试需设定明确的阈值
