ARG NODE_VERSION=24.15.0
ARG PNPM_VERSION=11.15.0
# Alpine package mirror. Override where dl-cdn.alpinelinux.org is unreachable (the production VPS).
ARG ALPINE_MIRROR=https://dl-cdn.alpinelinux.org/alpine

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ARG ALPINE_MIRROR
WORKDIR /app
RUN sed -i "s#https://dl-cdn.alpinelinux.org/alpine#${ALPINE_MIRROR}#" /etc/apk/repositories \
    && apk add --no-cache libc6-compat
RUN npm install --global pnpm@${PNPM_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch --frozen-lockfile --store-dir /pnpm/store
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --store-dir /pnpm/store

# Retained for hot-reload workflows; Compose uses the standalone runner target.
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL=postgresql://payload:payload@127.0.0.1:5432/vanidel \
    PAYLOAD_SECRET=build-only-placeholder-secret-not-real \
    pnpm build

FROM node:${NODE_VERSION}-alpine AS runner
ARG ALPINE_MIRROR
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN sed -i "s#https://dl-cdn.alpinelinux.org/alpine#${ALPINE_MIRROR}#" /etc/apk/repositories \
    && apk add --no-cache libc6-compat wget \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p .next media \
    && chown -R nextjs:nodejs .next media

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --spider -q "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
