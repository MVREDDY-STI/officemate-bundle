-- ─────────────────────────────────────────────────────────────
-- SOLUM Officemate — PostgreSQL Schema
-- Slot encoding: 0 = 09:00, 1 = 09:30, … 17 = 17:30 (30-min)
-- ─────────────────────────────────────────────────────────────

-- Enable btree_gist for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- updated_at auto-trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Refresh tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Building info (single row) ──────────────────────────────
CREATE TABLE IF NOT EXISTS building_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  description     TEXT,
  hours           JSONB   DEFAULT '[]',
  wifi_ssid       TEXT,
  wifi_password   TEXT,
  delivery_name   TEXT,
  delivery_company TEXT,
  delivery_address TEXT,
  emergency_name   TEXT,
  emergency_company TEXT,
  emergency_address TEXT,
  map_image_url    TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_building_updated_at BEFORE UPDATE ON building_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Rooms ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  room_code  TEXT UNIQUE NOT NULL,
  capacity   INT         NOT NULL DEFAULT 4,
  features   TEXT[]      NOT NULL DEFAULT '{}',
  image_url  TEXT,
  color      TEXT        NOT NULL DEFAULT '#f59e3d',
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Bookings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_date DATE        NOT NULL,
  start_slot   INT         NOT NULL CHECK (start_slot >= 0 AND start_slot <= 17),
  end_slot     INT         NOT NULL CHECK (end_slot >= 1 AND end_slot <= 18),
  title        TEXT        NOT NULL DEFAULT 'Meeting',
  status       TEXT        NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_slot_order CHECK (end_slot > start_slot),
  -- Prevent double-booking: no overlap for same room+date with confirmed status
  EXCLUDE USING GIST (
    room_id      WITH =,
    booking_date WITH =,
    int4range(start_slot, end_slot) WITH &&
  ) WHERE (status = 'confirmed')
);
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  description  TEXT,
  image_url    TEXT,
  event_date   DATE,
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order   INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Guests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name   TEXT        NOT NULL,
  last_name    TEXT,
  email        TEXT,
  visit_date   DATE,
  visit_time   TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','checked_in','cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Asset types ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_types (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      TEXT UNIQUE NOT NULL,
  icon_name TEXT
);

-- ── Assets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type_id    UUID REFERENCES asset_types(id),
  assigned_user_id UUID REFERENCES users(id),
  device_name      TEXT,
  serial_number    TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','retired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Asset requests ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name    TEXT,
  device_model   TEXT,
  purpose        TEXT,
  prime_approval TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_asset_requests_updated_at BEFORE UPDATE ON asset_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Support categories ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  icon_name  TEXT,
  sort_order INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS support_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES support_categories(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0
);

-- ── Content blocks (CMS) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key  TEXT UNIQUE NOT NULL,
  content      TEXT        NOT NULL DEFAULT '',
  content_type TEXT        NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','image','html')),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   UUID REFERENCES users(id)
);
CREATE TRIGGER trg_content_updated_at BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Team members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL,
  title      TEXT,
  photo_url  TEXT,
  section    TEXT    NOT NULL DEFAULT 'team',
  sort_order INT     NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Company info (footer) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS company_info (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hq_title     TEXT,
  hq_address   TEXT,
  sales_title  TEXT,
  sales_contact TEXT,
  copyright    TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_company_updated_at BEFORE UPDATE ON company_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Performance indexes ──────────────────────────────────────
-- Bookings: fast availability checks (room + date) and user history
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings (room_id, booking_date) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings (user_id, booking_date DESC);

-- Guests: host's guest list sorted by visit date
CREATE INDEX IF NOT EXISTS idx_guests_host_date ON guests (host_user_id, visit_date DESC);

-- Refresh tokens: fast lookup by hash (used on every token refresh)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- Content blocks: key lookups (used by batch fetch endpoint)
CREATE INDEX IF NOT EXISTS idx_content_blocks_key ON content_blocks (storage_key);

-- Events: published events sorted by order/date
CREATE INDEX IF NOT EXISTS idx_events_published ON events (sort_order, event_date) WHERE is_published = TRUE;

-- Assets: user's asset list and request history
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_asset_requests_user ON asset_requests (user_id, created_at DESC);

-- Teams and Employees (org chart / About Us)
CREATE TABLE IF NOT EXISTS teams (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id            UUID REFERENCES teams(id) ON DELETE CASCADE,
    employee_id        VARCHAR(50),
    name               VARCHAR(100) NOT NULL,
    designation        VARCHAR(100),
    email              VARCHAR(255),
    phone              VARCHAR(20),
    dob                DATE,
    emergency_contact  VARCHAR(100),
    photo_url          TEXT,
    sort_order         INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_team ON employees (team_id, sort_order);
