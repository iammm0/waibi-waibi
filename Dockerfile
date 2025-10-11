# 第一阶段：安装依赖
FROM node:22-alpine AS deps
WORKDIR /app

# 如果你用 package-lock.json
COPY package.json package-lock.json* ./

# 安装生产依赖
RUN npm ci --omit=dev

# 第二阶段：构建应用
FROM node:22-alpine AS builder
WORKDIR /app

# 复用安装好的 node_modules，加快速度
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 Next.js
RUN npm run build

# 第三阶段：生成运行时镜像
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 拷贝 package.json （可选，用于 npm start）
COPY package.json .

# 拷贝生产依赖和构建产物
COPY .env.local ./
COPY --from=builder /app/node_modules     ./node_modules
COPY --from=builder /app/.next            ./.next
COPY --from=builder /app/public           ./public
# 如果有 next.config.js 或其他配置文件也一起复制
COPY --from=builder /app/next.config.mjs   .

# 开放端口
EXPOSE 3000

# 启动
CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "-p", "3000"]