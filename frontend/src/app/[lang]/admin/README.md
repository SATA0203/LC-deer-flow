# 后端管理界面开发指南

## 概述

已为 DeerFlow 项目创建了基于 Next.js 的后端管理界面，可以直接管理 Agents、Skills、MCP Servers、Memory、Channels 和 Models。

## 技术栈

- **前端**: Next.js + TypeScript + Tailwind CSS
- **状态管理**: TanStack Query (React Query)
- **HTTP 客户端**: Axios
- **UI 组件**: 原生 HTML + Tailwind CSS

## 功能模块

### 1. Agents 管理 (`/admin/agents`)
- 查看、创建、编辑、删除自定义 Agent
- 配置 Agent 的描述、模型、工具组和 SOUL.md
- 支持名称验证（仅允许字母、数字和连字符）

### 2. Skills 管理 (`/admin/skills`)
- 查看所有技能（Public 和 Custom）
- 启用/禁用技能
- 显示技能类别、许可证和状态

### 3. MCP Servers 管理 (`/admin/mcp`)
- 查看 MCP 服务器配置
- 启用/禁用服务器
- 编辑服务器配置（类型、命令、参数、URL 等）

### 4. Memory 管理 (`/admin/memory`)
- 查看用户上下文和历史上下文
- 管理记忆事实（Facts）
- 添加、编辑、删除记忆事实
- 调整置信度

### 5. Channels 管理 (`/admin/channels`)
- 查看 IM 通道服务状态
- 重启特定通道
- 实时状态监控（每 5 秒自动刷新）

### 6. Models 管理 (`/admin/models`)
- 查看所有配置的 AI 模型
- 显示模型能力和特性
- 只读视图（模型配置需通过环境变量修改）

## 文件结构

```
frontend/src/app/[lang]/admin/
├── layout.tsx              # 管理界面布局（侧边栏导航）
├── page.tsx                # 管理面板首页
├── agents/
│   └── page.tsx            # Agents 管理页面
├── skills/
│   └── page.tsx            # Skills 管理页面
├── mcp/
│   └── page.tsx            # MCP Servers 管理页面
├── memory/
│   └── page.tsx            # Memory 管理页面
├── channels/
│   └── page.tsx            # Channels 管理页面
└── models/
    └── page.tsx            # Models 管理页面
```

## 使用方法

### 1. 启动开发服务器

```bash
cd frontend
pnpm dev
```

### 2. 访问管理界面

访问 `http://localhost:3000/admin`（根据语言配置可能是 `/en/admin` 或 `/zh/admin`）

### 3. API 依赖

确保后端服务正在运行，管理界面需要调用以下 API endpoints：

- `GET /api/agents` - 获取 Agents 列表
- `POST /api/agents` - 创建 Agent
- `PUT /api/agents/{name}` - 更新 Agent
- `DELETE /api/agents/{name}` - 删除 Agent
- `GET /api/skills` - 获取 Skills 列表
- `PUT /api/skills/{name}/toggle` - 切换 Skill 状态
- `GET /api/mcp/config` - 获取 MCP 配置
- `PUT /api/mcp/config` - 更新 MCP 配置
- `GET /api/memory` - 获取 Memory 数据
- `POST/PUT/DELETE /api/memory/facts/*` - 管理 Memory Facts
- `GET /api/channels/` - 获取 Channels 状态
- `POST /api/channels/{name}/restart` - 重启 Channel
- `GET /api/models` - 获取 Models 列表

## 扩展开发

### 添加新的管理模块

1. 在 `frontend/src/app/[lang]/admin/` 下创建新目录
2. 创建 `page.tsx` 文件实现页面逻辑
3. 在 `layout.tsx` 的 `navItems` 数组中添加导航项
4. 在 `page.tsx` 的 `modules` 数组中添加模块卡片

### 示例：添加新模块

```typescript
// 在 layout.tsx 中添加
const navItems = [
  // ... existing items
  { href: "/admin/new-module", label: "New Module" },
];

// 在 admin/page.tsx 中添加
const modules = [
  // ... existing modules
  {
    href: "/admin/new-module",
    title: "New Module",
    description: "Description of the new module",
  },
];
```

## 注意事项

1. **权限控制**: 当前版本未实现认证和授权，生产环境需要添加
2. **API 兼容性**: 确保后端 API 与前端调用保持一致
3. **错误处理**: 建议在生产环境中添加更完善的错误处理和提示
4. **响应式设计**: 界面已支持基本的响应式布局
5. **国际化**: 当前使用 `[lang]` 路由参数，支持多语言扩展

## 后续优化建议

1. 添加用户认证和权限管理
2. 实现批量操作功能
3. 添加搜索和过滤功能
4. 优化大数据量展示（分页、虚拟滚动）
5. 添加操作日志和审计功能
6. 实现配置导入导出功能
7. 添加实时监控和图表展示
