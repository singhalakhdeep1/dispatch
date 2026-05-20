FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/driver-app/package.json ./apps/driver-app/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo build --filter=@orderhub/driver-app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/driver-app/.next/standalone ./
COPY --from=builder /app/apps/driver-app/.next/static ./apps/driver-app/.next/static
COPY --from=builder /app/apps/driver-app/public ./apps/driver-app/public
EXPOSE 3006
CMD ["node", "apps/driver-app/server.js"]
