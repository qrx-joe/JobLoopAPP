# Contributing to JobLoop

感谢您对 JobLoop 的关注！欢迎贡献代码。

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 9+

### 本地开发

```bash
# 克隆仓库
git clone <repo-url>
cd JobLoop-Codebuddy

# 安装依赖
cd jobloop
npm install

# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 配置必要的环境变量
# 至少需要: DEEPSEEK_API_KEY, DEEPSEEK_API_BASE_URL

# 启动开发服务器
npm run dev
```

## 代码规范

### 格式化

项目使用 Prettier 进行代码格式化：

```bash
npm run format          # 格式化所有代码
npm run format:check    # 检查格式（CI 用）
```

### 类型检查

```bash
npm run typecheck
```

### ESLint

```bash
npm run lint           # 检查
npm run lint:fix       # 自动修复
```

### 完整检查

```bash
npm run check:all      # lint + typecheck + format:check
```

## Git 工作流

### 分支命名

- `feature/` - 新功能
- `fix/` - Bug 修复
- `refactor/` - 重构
- `docs/` - 文档更新

### 提交规范

```
<type>: <subject>

<body>

<footer>
```

Type 类型：
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档
- `style` - 格式（不影响代码）
- `refactor` - 重构
- `test` - 测试
- `chore` - 构建/工具

### Pull Request

1. Fork 仓库并创建分支
2. 确保通过所有检查 (`npm run check:all`)
3. 提交 PR，描述变更内容和动机
4. 等待代码 review

## 项目架构

```
src/
├── app/           # Next.js App Router
│   ├── (main)/   # 页面组件
│   └── api/      # API 路由
├── components/    # React 组件
├── lib/          # 业务逻辑
│   ├── ai/       # LLM 路由
│   ├── prompts/  # Prompt 模板
│   └── file-parser/  # 文件解析
├── hooks/         # 自定义 Hooks
└── types/         # 类型定义
```

## 添加新的 API 接口

1. 在 `src/app/api/` 下创建路由文件
2. 遵循统一的响应格式：

```typescript
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

## 添加新的 Prompt 模板

1. 在 `src/lib/prompts/templates/` 创建模板文件
2. 导出 `*_PROMPT` 对象
3. 在 `registry.ts` 中注册

## 数据库变更

1. 在 `supabase/migrations/` 创建新的迁移文件
2. 使用 `supabase/migrations/001_initial_schema.sql` 作为参考
3. 包含向上和向下迁移

## 常见问题

### `Module not found` 错误

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 报错

```bash
npm run typecheck
```

根据错误信息修复类型问题。

### AI API 调用失败

1. 检查 `.env.local` 中的 API Key
2. 确认 API Key 有足够的调用额度
3. 检查网络连接

## 行为准则

- 保持代码简洁、可读
- 添加必要的注释说明复杂逻辑
- 遵循现有的代码风格
- 确保新增功能有类型定义
