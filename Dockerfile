# Stage 1: install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
# Allow Prisma build scripts
RUN echo '{ "onlyBuiltDependencies": ["@prisma/engines", "prisma", "@parcel/watcher", "@swc/core"] }' \
    > /root/.npmrc || true
RUN pnpm install --frozen-lockfile

# Stage 2: build the application
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Stage 3: minimal production runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs migrate-and-start.sh ./migrate-and-start.sh
RUN chmod +x migrate-and-start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "migrate-and-start.sh"]
