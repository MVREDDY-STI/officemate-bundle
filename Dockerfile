# ═══════════════════════════════════════════════════════════════
# SOLUM Officemate — All-in-one container
# Contains: PostgreSQL 16 + Bun.js backend + Nginx frontend
#
# Usage:
#   docker build -t officemate .
#   docker run -p 80:80 officemate
#
# Or with a persistent DB volume:
#   docker run -p 80:80 -v officemate_data:/var/lib/postgresql/16/main officemate
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build React frontend ──────────────────────────────
FROM node:22-alpine AS fe-build
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
# Empty VITE_API_URL → Nginx proxies /api/ on the same port 80
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# ── Stage 2: Install Bun backend dependencies ──────────────────
FROM oven/bun:1 AS be-deps
WORKDIR /app
COPY backend/package.json backend/bun.lockb* ./
RUN bun install --frozen-lockfile || bun install


# ── Stage 3: All-in-one runtime image ─────────────────────────
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# ── Install PostgreSQL 16 ──────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        gnupg curl ca-certificates lsb-release \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
       | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] \
       https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends \
        postgresql-16 \
    && rm -rf /var/lib/apt/lists/*

# ── Install Nginx + Supervisor ─────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

# ── Install Bun ────────────────────────────────────────────────
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
COPY --from=oven/bun:1 /usr/local/bin/bunx /usr/local/bin/bunx

# ── Frontend: copy built assets ────────────────────────────────
COPY --from=fe-build /frontend/dist /usr/share/nginx/html

# ── Nginx config: serves SPA + proxies /api/ to Bun backend ───
COPY nginx-allinone.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# ── Backend: copy source + pre-installed node_modules ─────────
WORKDIR /app
COPY --from=be-deps /app/node_modules ./node_modules
COPY backend/src ./src
COPY backend/package.json ./

# ── Supervisord config ─────────────────────────────────────────
COPY supervisord.conf /etc/supervisor/conf.d/officemate.conf

# ── Entrypoint: init DB then start supervisor ──────────────────
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
