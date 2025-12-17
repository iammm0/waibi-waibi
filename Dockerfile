# ======================
# 第一阶段：安装所有依赖（包括 devDependencies，因为有 Biome、TailwindCSS 等）
# ======================
FROM docker.io/library/node:24 AS deps
WORKDIR /app

# 优化 npm 配置（使用代理时，增加并发连接数以加速下载）
RUN npm config set maxsockets 15

# 先只拷贝 package 文件，利用 Docker 缓存层
# 只有当 package.json 或 package-lock.json 变化时才重新安装依赖
COPY package.json package-lock.json* ./

# 安装所有依赖（包括 dev！因为 Biome、TailwindCSS 可能是 devDependencies，但构建时需要）
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# ======================
# 第二阶段：构建 Next.js 应用
# ======================
FROM docker.io/library/node:24 AS builder
WORKDIR /app

# 从 deps 阶段拷贝 node_modules（已包含所有依赖，包括 dev）
COPY --from=deps /app/node_modules ./node_modules

# 关闭 Next 遥测
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 拷贝所有源代码（依赖已安装，直接复制所有文件）
COPY . .

# 构建 Next.js 应用
RUN npm run build

# ======================
# 第三阶段：运行时镜像（可选，用于部署）
# ======================
FROM docker.io/library/node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# 只拷贝必要的运行时文件
# 使用 Next.js standalone 输出，体积更小、启动更快
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 拷贝 prompts 目录（人格提示词文件）
COPY --from=builder /app/prompts ./prompts
# 拷贝环境变量文件（需要确保 .env.local 不在 .dockerignore 中）
COPY --from=builder /app/.env.local ./.env.local

# 暴露端口 & 启动命令
EXPOSE 3000
CMD ["node", "server.js"]