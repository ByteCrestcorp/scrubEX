
# =============================================================================
FROM node:22-slim AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci


FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build


FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --gid 10002 nextjs \
 && useradd --uid 10002 --gid 10002 --no-create-home --shell /usr/sbin/nologin nextjs


COPY --from=build --chown=10002:10002 /app/.next/standalone ./
COPY --from=build --chown=10002:10002 /app/.next/static ./.next/static
COPY --from=build --chown=10002:10002 /app/public ./public

USER 10002
EXPOSE 3000

CMD ["node", "server.js"]
