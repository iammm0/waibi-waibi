# Waibi Universe / Waibi 宇宙

[English](#english) | [中文](#中文)

---

<a name="english"></a>
# English

An MBTI-driven chat and training playground built with Next.js (app router). Users can:
- Browse 16 MBTI personas, each with a base prompt and user-contributed prompt fragments
- Chat with any persona (auth required), with per-persona API key selection
- Train persona behavior by submitting example pairs and adjusting parameters

This repository includes a simple JWT-based auth flow, MongoDB persistence, and a theming system ("waibi" aka dark vs rational aka light).

## Features

- 16 MBTI personas landing: `app/mbti/page.tsx`
- Persona training detail: `app/mbti/[id]/page.tsx`
- Chat with persona (select model client-side): `app/chat/page.tsx` → `components/persona-chat.tsx`
- Persona prompts loading (file-based + user-contributed): `prompts/*.json` + `/api/persona/[code]/prompt`
- Auth (register/login/refresh/me) and Bearer token protection
- MongoDB persistence for user-contributed prompts and per-user chat histories
- Per-persona LLM API key selection with global fallback
- Dual theme system: "waibi" (dark) and "rational" (light)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MongoDB

Using Docker Compose (recommended):

```bash
docker compose up -d
```

Or use any local MongoDB instance at `mongodb://127.0.0.1:27017/waibi`

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (see [Environment Variables](#environment-variables) section below).

### 4. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# ==== LLM (OpenAI-compatible) ====
# Global upstream endpoint (shared by all personas)
LLM_BASE_URL=https://your-openai-compatible.example/v1/chat/completions
# Global fallback API key (used if persona-specific key is absent)
LLM_API_KEY=
# Global default model (can be overridden from the chat UI)
LLM_MODEL=gpt-4o

# Persona-specific API keys (optional; take precedence over global)
LLM_API_KEY_INTJ=
LLM_API_KEY_INTP=
LLM_API_KEY_INFJ=
LLM_API_KEY_INFP=
LLM_API_KEY_ISTJ=
LLM_API_KEY_ISFJ=
LLM_API_KEY_ISTP=
LLM_API_KEY_ISFP=
LLM_API_KEY_ENTJ=
LLM_API_KEY_ENTP=
LLM_API_KEY_ENFJ=
LLM_API_KEY_ENFP=
LLM_API_KEY_ESTJ=
LLM_API_KEY_ESFJ=
LLM_API_KEY_ESTP=
LLM_API_KEY_ESFP=

# ==== MongoDB ====
MONGODB_URI=mongodb://127.0.0.1:27017/waibi

# ==== JWT ====
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=30d

# ==== Persona external business endpoints (optional) ====
# If set, they can be surfaced to the frontend for future per-persona routing.
PERSONA_API_INTJ=
PERSONA_API_INTP=
PERSONA_API_INFJ=
PERSONA_API_INFP=
PERSONA_API_ISTJ=
PERSONA_API_ISFJ=
PERSONA_API_ISTP=
PERSONA_API_ISFP=
PERSONA_API_ENTJ=
PERSONA_API_ENTP=
PERSONA_API_ENFJ=
PERSONA_API_ENFP=
PERSONA_API_ESTJ=
PERSONA_API_ESFJ=
PERSONA_API_ESTP=
PERSONA_API_ESFP=
```

**Notes:**
- `LLM_BASE_URL` is global; each persona can have its own API key via `LLM_API_KEY_<CODE>`.
- The chat request body may include `model` to override `LLM_MODEL`.

## Directory Structure

Key directories and files:

- `app/mbti/page.tsx`: MBTI grid landing page
- `app/mbti/[id]/page.tsx`: Training detail for a selected persona (with UI-only progress simulation)
- `components/persona-chat.tsx`: Persona chat component (select persona + select/enter model)
- `app/api/persona/[code]/chat`: Calls upstream LLM with persona system prompt + user message, persists interaction
- `app/api/persona/[code]/prompt`: Returns base prompt (from file) + contributed prompts
- `model/Interaction.ts`: Per-user, per-persona chat history storage
- `model/UserPrompt.ts`: User-contributed prompt storage
- `prompts/*.json`: Base system prompts per persona

## API Documentation

### Authentication

- **Register**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Refresh**: `POST /api/auth/refresh`
- **Me**: `GET /api/auth/me`

Store `accessToken` and `refreshToken` in `localStorage`. The app automatically attaches `Authorization: Bearer <token>` for protected routes.

### Persona APIs

- `GET /api/persona/[code]/prompt` → `{ base, contributed, api? }`
- `POST /api/persona/[code]/contribute` (auth required) → submit prompt fragment `{ text }`
- `GET /api/persona/[code]/history` (auth required) → latest history for current user
- `POST /api/persona/[code]/chat` (auth required) → `{ reply, interactionId }`

Codes are lowercase persona names (e.g., `intj`, `enfp`, ...).

## Theming

Two theme modes are available:
- **waibi**: Dark theme
- **rational**: Light theme

The header includes a mode toggle; components adapt styles based on `useVibe()` hook.

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run Biome linter
- `npm run format`: Format code with Biome

### Development Tips

- If you modify prompt files under `prompts/`, restart dev server if needed.
- For persona-specific API keys, add `LLM_API_KEY_<CODE>` in `.env.local` and restart.
- MongoDB must be reachable before auth or persona endpoints work.
- Node.js version >= 24.0.0 is required.

## Deployment

### Docker

The project includes a multi-stage Dockerfile for optimized production builds:

```bash
docker build -t waibi-web .
docker run -p 3000:3000 --env-file .env.local waibi-web
```

The Dockerfile uses Next.js standalone output for smaller image size and faster startup.

### Requirements

- Node.js >= 24.0.0
- MongoDB (local or remote)
- OpenAI-compatible LLM API endpoint

## License

MIT

---

<a name="中文"></a>
# 中文

基于 Next.js (app router) 构建的 MBTI 驱动聊天和训练平台。用户可以：
- 浏览 16 种 MBTI 人格类型，每种都有基础提示词和用户贡献的提示词片段
- 与任何人格类型聊天（需要认证），支持为每个人格类型选择独立的 API 密钥
- 通过提交示例对话对和调整参数来训练人格行为

本项目包含基于 JWT 的身份验证流程、MongoDB 持久化存储，以及主题系统（"waibi" 暗色主题 vs "rational" 亮色主题）。

## 功能特性

- 16 种 MBTI 人格类型展示页面：`app/mbti/page.tsx`
- 人格训练详情页：`app/mbti/[id]/page.tsx`
- 与人格聊天（客户端选择模型）：`app/chat/page.tsx` → `components/persona-chat.tsx`
- 人格提示词加载（基于文件 + 用户贡献）：`prompts/*.json` + `/api/persona/[code]/prompt`
- 身份验证（注册/登录/刷新/个人信息）和 Bearer token 保护
- MongoDB 持久化存储用户贡献的提示词和每用户的聊天历史
- 支持为每个人格类型配置独立的 LLM API 密钥，带全局回退
- 双主题系统："waibi"（暗色）和 "rational"（亮色）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 MongoDB

使用 Docker Compose（推荐）：

```bash
docker compose up -d
```

或使用本地 MongoDB 实例，地址为 `mongodb://127.0.0.1:27017/waibi`

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件（参见下面的[环境变量](#环境变量)部分）。

### 4. 运行开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

## 环境变量

创建 `.env.local` 文件，包含以下变量：

```env
# ==== LLM (OpenAI 兼容) ====
# 全局上游端点（所有人格类型共享）
LLM_BASE_URL=https://your-openai-compatible.example/v1/chat/completions
# 全局回退 API 密钥（当人格特定密钥不存在时使用）
LLM_API_KEY=
# 全局默认模型（可在聊天 UI 中覆盖）
LLM_MODEL=gpt-4o

# 人格特定 API 密钥（可选；优先级高于全局密钥）
LLM_API_KEY_INTJ=
LLM_API_KEY_INTP=
LLM_API_KEY_INFJ=
LLM_API_KEY_INFP=
LLM_API_KEY_ISTJ=
LLM_API_KEY_ISFJ=
LLM_API_KEY_ISTP=
LLM_API_KEY_ISFP=
LLM_API_KEY_ENTJ=
LLM_API_KEY_ENTP=
LLM_API_KEY_ENFJ=
LLM_API_KEY_ENFP=
LLM_API_KEY_ESTJ=
LLM_API_KEY_ESFJ=
LLM_API_KEY_ESTP=
LLM_API_KEY_ESFP=

# ==== MongoDB ====
MONGODB_URI=mongodb://127.0.0.1:27017/waibi

# ==== JWT ====
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=30d

# ==== 人格外部业务端点（可选） ====
# 如果设置，可以在前端展示，用于未来的人格特定路由。
PERSONA_API_INTJ=
PERSONA_API_INTP=
PERSONA_API_INFJ=
PERSONA_API_INFP=
PERSONA_API_ISTJ=
PERSONA_API_ISFJ=
PERSONA_API_ISTP=
PERSONA_API_ISFP=
PERSONA_API_ENTJ=
PERSONA_API_ENTP=
PERSONA_API_ENFJ=
PERSONA_API_ENFP=
PERSONA_API_ESTJ=
PERSONA_API_ESFJ=
PERSONA_API_ESTP=
PERSONA_API_ESFP=
```

**注意事项：**
- `LLM_BASE_URL` 是全局的；每个人格类型可以通过 `LLM_API_KEY_<CODE>` 拥有自己的 API 密钥。
- 聊天请求体可以包含 `model` 字段来覆盖 `LLM_MODEL`。

## 目录结构

关键目录和文件：

- `app/mbti/page.tsx`: MBTI 网格展示页面
- `app/mbti/[id]/page.tsx`: 选定人格的训练详情页（包含仅 UI 的进度模拟）
- `components/persona-chat.tsx`: 人格聊天组件（选择人格 + 选择/输入模型）
- `app/api/persona/[code]/chat`: 使用人格系统提示词 + 用户消息调用上游 LLM，持久化交互记录
- `app/api/persona/[code]/prompt`: 返回基础提示词（来自文件）+ 贡献的提示词
- `model/Interaction.ts`: 每用户、每人格的聊天历史存储
- `model/UserPrompt.ts`: 用户贡献的提示词存储
- `prompts/*.json`: 每个人格的基础系统提示词

## API 文档

### 身份验证

- **注册**: `POST /api/auth/register`
- **登录**: `POST /api/auth/login`
- **刷新**: `POST /api/auth/refresh`
- **个人信息**: `GET /api/auth/me`

将 `accessToken` 和 `refreshToken` 存储在 `localStorage` 中。应用会自动为受保护的路由附加 `Authorization: Bearer <token>`。

### 人格 API

- `GET /api/persona/[code]/prompt` → `{ base, contributed, api? }`
- `POST /api/persona/[code]/contribute`（需要认证）→ 提交提示词片段 `{ text }`
- `GET /api/persona/[code]/history`（需要认证）→ 当前用户的最新历史记录
- `POST /api/persona/[code]/chat`（需要认证）→ `{ reply, interactionId }`

代码为小写人格名称（例如：`intj`、`enfp` 等）。

## 主题系统

提供两种主题模式：
- **waibi**: 暗色主题
- **rational**: 亮色主题

页头包含模式切换按钮；组件基于 `useVibe()` 钩子适配样式。

## 开发

### 可用脚本

- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产版本
- `npm run start`: 启动生产服务器
- `npm run lint`: 运行 Biome 代码检查
- `npm run format`: 使用 Biome 格式化代码

### 开发提示

- 如果修改 `prompts/` 目录下的提示词文件，可能需要重启开发服务器。
- 要为特定人格配置 API 密钥，在 `.env.local` 中添加 `LLM_API_KEY_<CODE>` 并重启。
- 在身份验证或人格端点工作之前，MongoDB 必须可访问。
- 需要 Node.js 版本 >= 24.0.0。

## 部署

### Docker

项目包含多阶段 Dockerfile，用于优化的生产构建：

```bash
docker build -t waibi-web .
docker run -p 3000:3000 --env-file .env.local waibi-web
```

Dockerfile 使用 Next.js standalone 输出，以获得更小的镜像体积和更快的启动速度。

### 系统要求

- Node.js >= 24.0.0
- MongoDB（本地或远程）
- OpenAI 兼容的 LLM API 端点

## 许可证

MIT
