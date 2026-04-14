# DeerFlow Testing Guide

## 测试框架概述

DeerFlow 项目现在配备了完整的测试基础设施：

### 后端测试 (Python/pytest)
- **单元测试**: `backend/tests/` - 107+ 个现有测试
- **集成测试**: `backend/tests/integration/` - 新增的安全和并发测试
- **测试运行器**: pytest + pytest-asyncio

### 前端测试 (TypeScript)
- **单元测试**: Vitest + Testing Library
- **E2E 测试**: Playwright (多浏览器支持)
- **API Mock**: MSW (Mock Service Worker)

---

## 快速开始

### 后端测试

```bash
cd backend

# 运行所有测试
pytest

# 运行集成测试
pytest tests/integration/ -v

# 运行特定测试文件
pytest tests/integration/test_sandbox_security.py -v

# 生成覆盖率报告
pytest --cov=deerflow --cov-report=html

# 运行异步测试
pytest tests/integration/ -v -k async
```

### 前端测试

```bash
cd frontend

# 安装测试依赖 (首次运行)
pnpm install

# 运行单元测试
pnpm test

# 监听模式 (开发时自动重跑)
pnpm test:watch

# 打开 UI 界面
pnpm test:ui

# 运行 E2E 测试
pnpm test:e2e

# E2E 带 UI
pnpm test:e2e:ui

# E2E 调试模式
pnpm test:e2e:debug
```

---

## 测试文件结构

```
backend/
├── tests/
│   ├── conftest.py              # 全局测试配置
│   ├── test_*.py                # 单元测试 (107+)
│   └── integration/
│       ├── README.md            # 集成测试文档
│       ├── conftest.py          # 集成测试配置
│       ├── test_sandbox_security.py    # 沙箱安全测试
│       ├── test_concurrency_safety.py  # 并发安全测试
│       └── test_api_consistency.py     # API 一致性测试

frontend/
├── tests/
│   ├── unit/
│   │   ├── core/                # 核心逻辑测试 (已有)
│   │   └── components/          # 组件测试 (新增)
│   ├── e2e/                     # E2E 测试 (新增)
│   │   └── thread-management.spec.ts
│   └── mocks/                   # MSW Mocks (新增)
│       └── handlers.ts
├── playwright.config.ts         # Playwright 配置
└── vitest.config.ts             # Vitest 配置
```

---

## 编写新测试

### 后端集成测试示例

```python
"""tests/integration/test_my_feature.py"""
import pytest

@pytest.mark.asyncio
async def test_my_feature(temp_dir, mock_sandbox_provider):
    """测试我的功能"""
    # Arrange
    test_input = "hello"
    
    # Act
    result = mock_sandbox_provider.execute_command(f"echo {test_input}")
    
    # Assert
    assert result["exit_code"] == 0
    assert "hello" in result["stdout"]
```

### 前端组件测试示例

```typescript
/** tests/unit/components/my-component.test.tsx */
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import MyComponent from '@/components/MyComponent';

test('renders correctly', () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### E2E 测试示例

```typescript
/** tests/e2e/my-feature.spec.ts */
import { test, expect } from '@playwright/test';

test('should work', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/DeerFlow/);
});
```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install uv && uv sync
      - run: cd backend && pytest tests/integration/ -v

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - run: cd frontend && pnpm install
      - run: cd frontend && pnpm test
      - run: cd frontend && pnpm exec playwright install --with-deps
      - run: cd frontend && pnpm test:e2e
```

---

## 最佳实践

1. **测试命名**: 使用描述性名称 `test_<feature>_<scenario>.py`
2. **AAA 模式**: Arrange (准备) → Act (执行) → Assert (断言)
3. **独立测试**: 每个测试应独立运行，不依赖其他测试状态
4. **Mock 外部依赖**: 使用 mock 隔离数据库、API 等外部依赖
5. **覆盖率目标**: 
   - 后端集成测试：关键路径 80%+
   - 前端单元测试：组件 60%+
   - E2E 测试：核心用户流程 100%

---

## 故障排查

### 常见问题

**Q: 后端测试导入错误**
```bash
# 确保在 backend 目录运行
cd backend && pytest
```

**Q: 前端测试找不到模块**
```bash
# 重新安装依赖
cd frontend && pnpm install
```

**Q: Playwright 浏览器未安装**
```bash
cd frontend && pnpm exec playwright install --with-deps
```

**Q: 异步测试超时**
```python
# 增加超时时间
@pytest.mark.asyncio
async def test_slow_operation():
    await asyncio.sleep(10)  # 默认超时可能不够
```

---

## 下一步

1. ✅ 测试框架已搭建完成
2. ⏭️ 运行现有测试验证环境
3. ⏭️ 修复沙箱安全漏洞 (`shell=True` → `shell=False`)
4. ⏭️ 根据测试结果逐步重构

需要帮助？查看具体测试文件或运行 `pytest --help` / `pnpm test --help`。
