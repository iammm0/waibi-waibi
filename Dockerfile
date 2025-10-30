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
FROM docker.io/library/node:22 AS builder
WORKDIR /app

# 从 deps 阶段拷贝 node_modules（已包含所有依赖，包括 dev）
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 关闭 Next 遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 构建 Next.js 应用（使用默认的 Webpack，不是 Turbopack）
RUN npm run build

# ======================
# 第三阶段：运行时镜像（可选，用于部署）
# ======================
FROM docker.io/library/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# 只拷贝必要的运行时文件
# 使用 Next.js standalone 输出，体积更小、启动更快
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 拷贝环境变量文件（若存在），用于运行期配置，如 MONGODB_URI 等
COPY --from=builder /app/.env.local ./.env.local

# 暴露端口 & 启动命令
EXPOSE 3000
CMD ["node", "server.js"]