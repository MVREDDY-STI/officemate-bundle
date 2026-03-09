# OfficeMate Database Setup Guide

## PostgreSQL Credentials (Docker)

**Default credentials** (from `docker-compose.yml`):
- **Username:** `solum`
- **Password:** `password`
- **Database:** `officemate`
- **Host:** `localhost:5432` (from Docker host machine)
- **Host (from inside Docker):** `db:5432` (container-to-container)

### Connecting via pgAdmin or Other Tools

Use these credentials to connect:
```
Server: localhost
Port: 5432
Username: solum
Password: password
Database: officemate
```

## Setting Up the Database

### Option 1: Fresh Database (Recommended)

#### 1. Clean Docker Volumes (if restarting)
```bash
docker compose down -v
```

#### 2. Start Docker Containers
```bash
docker compose up -d
```

The database schema and migrations will be **automatically applied** on first run:
- `01_schema.sql` — Main database schema
- `02_tv_displays.sql` — TV display system tables
- `03_user_approval.sql` — User approval workflow (is_approved column)

#### 3. Verify Database Health
```bash
docker compose exec db psql -U solum -d officemate -c "SELECT version();"
```

### Option 2: Existing Database with Missing Migrations

If you have an existing database and the `is_approved` column is missing, apply the migration manually:

```bash
docker exec -i officemate_db psql -U solum -d officemate \
  < backend/src/db/migrations/003_user_approval.sql
```

Verify the migration applied:
```bash
docker exec officemate_db psql -U solum -d officemate \
  -c "\d users" | grep is_approved
```

Expected output: `is_approved | boolean | not null default false`

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `users` | User accounts & auth | id, email, password_hash, role, **is_approved** |
| `refresh_tokens` | Session management | id, user_id, token_hash, expires_at |
| `rooms` | Meeting rooms | id, name, room_code, capacity, color |
| `bookings` | Room reservations | id, room_id, user_id, booking_date, start_slot, end_slot, **title** |
| `building_info` | Building metadata | id, address, phone, email, wifi_ssid, etc. |

### TV Display System Tables

| Table | Purpose |
|-------|---------|
| `tv_displays` | Paired TV displays |
| `display_slides` | Slide content (text, quotes, images, birthdays) |
| `display_slide_targets` | Slide assignment to displays |
| `content_blocks` | Shared content (logo, theme color) |

### Audit Columns

All tables have `created_at` and `updated_at` timestamps (except single-row tables like `building_info`).

## Migrations

### 001 — Schema (Initial)
Main database schema with users, bookings, rooms, refresh tokens, building info.

**File:** `backend/src/db/schema.sql`

### 002 — TV Displays
TV display system with tables for displays, slides, and content blocks.

**File:** `backend/src/db/migrations/002_tv_displays.sql`

### 003 — User Approval
Adds `is_approved` column to users table for admin approval workflow.

**File:** `backend/src/db/migrations/003_user_approval.sql`

**Changes:**
- Adds `is_approved BOOLEAN NOT NULL DEFAULT false` to users table
- Approves all existing users automatically (`UPDATE users SET is_approved = true`)

## Troubleshooting

### Issue: "column 'is_approved' does not exist"

**Cause:** The `003_user_approval.sql` migration hasn't been applied.

**Solution:**
```bash
# For fresh database: Just run docker compose up -d
# (migrations auto-apply on initialization)

# For existing database: Manually apply the migration
docker exec -i officemate_db psql -U solum -d officemate \
  < backend/src/db/migrations/003_user_approval.sql
```

### Issue: Database connection refused

**Check container health:**
```bash
docker compose ps
```

**Check if DB is ready:**
```bash
docker compose logs db | tail -20
```

**Restart the DB:**
```bash
docker compose restart db
docker compose logs db
```

### Issue: Data persists after `docker compose down`

**The named volumes persist data.** To completely remove:
```bash
docker compose down -v  # -v removes volumes
```

## Accessing the Database

### Via psql (PostgreSQL CLI)

From host machine:
```bash
docker exec -it officemate_db psql -U solum -d officemate
```

Inside the container:
```bash
psql -U solum -d officemate
```

### Via pgAdmin

1. **Install pgAdmin** (if not using Docker):
   ```bash
   # macOS
   brew install pgadmin4

   # Or use Docker:
   docker run -p 5050:80 dpage/pgadmin4
   ```

2. **Connect to Server:**
   - **Host name/address:** `localhost` (or `db` if using Docker pgAdmin)
   - **Port:** `5432`
   - **Username:** `solum`
   - **Password:** `password`
   - **Database:** `officemate`

### Via Docker Compose Exec

```bash
# List all tables
docker exec officemate_db psql -U solum -d officemate -c "\dt"

# Check users table structure
docker exec officemate_db psql -U solum -d officemate -c "\d users"

# Query bookings with user info
docker exec officemate_db psql -U solum -d officemate -c \
  "SELECT b.id, r.name, b.title, u.name, b.booking_date FROM bookings b
   JOIN rooms r ON b.room_id = r.id
   JOIN users u ON b.user_id = u.id
   ORDER BY b.booking_date DESC LIMIT 10;"
```

## Environment Variables

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_DB=officemate
POSTGRES_USER=solum
POSTGRES_PASSWORD=password        # ⚠️ Change in production!

# JWT
JWT_SECRET=your_long_random_secret_at_least_32_chars  # ⚠️ Change!

# MinIO (S3)
S3_ACCESS_KEY=minioadmin           # ⚠️ Change in production!
S3_SECRET_KEY=minioadmin123        # ⚠️ Change in production!
S3_BUCKET=officemate
```

See `.env.example` for all available options.

## Backups

### Backup Database
```bash
docker exec officemate_db pg_dump -U solum -d officemate > officemate_backup.sql
```

### Restore Database
```bash
docker exec -i officemate_db psql -U solum -d officemate < officemate_backup.sql
```

### Backup Docker Volumes
```bash
# List volumes
docker volume ls | grep officemate

# Backup postgres volume
docker run --rm -v officemate_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Production Checklist

- [ ] Change `POSTGRES_PASSWORD` in `.env`
- [ ] Change `JWT_SECRET` in `.env` (32+ characters)
- [ ] Change `S3_ACCESS_KEY` and `S3_SECRET_KEY`
- [ ] Remove `ports: 9001:9001` from MinIO in docker-compose.yml
- [ ] Enable SSL/TLS for PostgreSQL
- [ ] Regular automated backups
- [ ] Monitor database logs
- [ ] Set up replication (optional)
