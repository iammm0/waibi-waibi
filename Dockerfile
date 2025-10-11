# ======================
# 第一阶段：安装所有依赖（包括 devDependencies，因为有 Biome、TailwindCSS 等）
# ======================
FROM docker.io/library/node:22 AS deps
WORKDIR /app

# 设置国内 npm 源（加速下载，避免网络问题导致 .node 文件下载失败）
RUN npm config set registry https://registry.npmmirror.com

# 拷贝 package.json 和 package-lock.json
COPY package.json package-lock.json* ./

# 可选：清理 npm 缓存
RUN npm cache clean --force

# 安装所有依赖（包括 dev！因为 Biome、TailwindCSS 可能是 devDependencies，但构建时需要）
RUN npm ci

# ======================
# 第二阶段：构建 Next.js 应用
# ======================
FROM node:22 AS builder
WORKDIR /app

# 从 deps 阶段拷贝 node_modules（已包含所有依赖，包括 dev）
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 Next.js 应用（使用默认的 Webpack，不是 Turbopack）
RUN npm run build

# ======================
# 第三阶段：运行时镜像（可选，用于部署）
# ======================
FROM node:22 AS runner
WORKDIR /app
ENV NODE_ENV=production

# 只拷贝必要的运行时文件
COPY package.json ./
COPY .env.local ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# 暴露端口 & 启动命令
EXPOSE 3000
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "-p", "3000"]