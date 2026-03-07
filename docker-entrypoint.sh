#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────
# SOLUM Officemate — All-in-one container entrypoint
# Order: init PostgreSQL → create DB → run schema → run seed → supervisord
# ─────────────────────────────────────────────────────────────

DB_PASSWORD="${DB_PASSWORD:-password}"
JWT_SECRET="${JWT_SECRET:-change_me_to_a_long_random_secret_at_least_32_chars}"
DB_NAME="officemate"
DB_USER="solum"
PG_DATA="/var/lib/postgresql/16/main"

export DB_PASSWORD JWT_SECRET

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SOLUM Officemate — Starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Init PostgreSQL cluster (first run only) ──────────
if [ ! -f "$PG_DATA/PG_VERSION" ]; then
    echo "[DB] Initialising PostgreSQL cluster..."
    su postgres -c "/usr/lib/postgresql/16/bin/initdb -D $PG_DATA --encoding=UTF8 --locale=C"
fi

# ── Step 2: Start PostgreSQL temporarily for setup ────────────
echo "[DB] Starting PostgreSQL for initial setup..."
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl start -D $PG_DATA -w -t 30 \
    -o '-c listen_addresses=127.0.0.1'"

# ── Step 3: Create user and database (idempotent) ─────────────
echo "[DB] Ensuring user and database exist..."
su postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\" | \
    grep -q 1 || psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\""

su postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\" | \
    grep -q 1 || psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""

# ── Step 4: Run schema migration (idempotent — uses IF NOT EXISTS) ──
echo "[DB] Running schema migration..."
su postgres -c "psql -d $DB_NAME -f /app/src/db/schema.sql" 2>&1 | grep -v "^$" || true

# ── Step 5: Seed default data (runs once, ON CONFLICT DO NOTHING) ──
echo "[DB] Seeding default data..."
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME" \
    JWT_SECRET="$JWT_SECRET" \
    /usr/local/bin/bun run /app/src/db/seed.ts 2>&1 | grep -v "^$" || true

# ── Step 6: Stop temp PostgreSQL (supervisord will restart it) ─
echo "[DB] Stopping temporary PostgreSQL instance..."
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl stop -D $PG_DATA -w"

# ── Step 7: Hand off to supervisord (manages all 3 processes) ─
echo ""
echo "✅ Setup complete. Starting all services via supervisord..."
echo "   • PostgreSQL 16  — 127.0.0.1:5432"
echo "   • Bun backend    — 127.0.0.1:3000"
echo "   • Nginx frontend — 0.0.0.0:80"
echo ""
echo "   App:     http://localhost"
echo "   API:     http://localhost/api/v1/"
echo "   Swagger: http://localhost/docs"
echo ""

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/officemate.conf
