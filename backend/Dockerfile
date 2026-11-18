FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy backend package manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

# Copy source code and build
COPY . .
RUN pnpm build

# --- Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --prod --frozen-lockfile
RUN pnpm db:generate

COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main"]
