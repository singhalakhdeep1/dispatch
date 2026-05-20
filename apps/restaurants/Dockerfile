FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.0

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/restaurants/package.json ./apps/restaurants/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @orderhub/restaurants...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/restaurants/node_modules ./apps/restaurants/node_modules
COPY . .
WORKDIR /app/apps/restaurants
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/restaurants/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/restaurants/package.json ./
ENV NODE_ENV=production
EXPOSE 3007
CMD ["node", "dist/main"]
