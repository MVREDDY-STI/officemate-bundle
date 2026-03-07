# ── Bun.js backend ───────────────────────────────────────────
FROM oven/bun:1 AS base
WORKDIR /app

# Install curl for Docker healthcheck
RUN apt-get update -qq && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install dependencies (cached layer)
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

# Copy source
COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["bun", "run", "src/index.ts"]
