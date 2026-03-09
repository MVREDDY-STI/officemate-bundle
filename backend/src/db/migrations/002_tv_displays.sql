-- ─────────────────────────────────────────────────────────────
-- Migration 002: TV Display management tables
-- ─────────────────────────────────────────────────────────────

-- ── TV Display devices ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tv_displays (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL DEFAULT 'TV Display',
  device_id           TEXT UNIQUE NOT NULL,
  room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
  device_token        TEXT UNIQUE,
  pairing_code        TEXT,
  pairing_expires_at  TIMESTAMPTZ,
  last_seen_at        TIMESTAMPTZ,
  is_online           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_displays_pairing ON tv_displays (pairing_code)
  WHERE pairing_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_displays_token ON tv_displays (device_token)
  WHERE device_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_displays_room ON tv_displays (room_id)
  WHERE room_id IS NOT NULL;

-- ── Display slides (sidebar bottom section content) ──────────
CREATE TABLE IF NOT EXISTS display_slides (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT    NOT NULL,
  slide_type       TEXT    NOT NULL CHECK (slide_type IN ('text','quote_avatar','image','birthday')),
  content          JSONB   NOT NULL DEFAULT '{}',
  duration_seconds INT     NOT NULL DEFAULT 5  CHECK (duration_seconds >= 2 AND duration_seconds <= 60),
  sort_order       INT     NOT NULL DEFAULT 0,
  target           TEXT    NOT NULL DEFAULT 'all' CHECK (target IN ('all','specific')),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_display_slides_updated_at BEFORE UPDATE ON display_slides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_slides_active ON display_slides (sort_order)
  WHERE is_active = TRUE;

-- ── Slide targets (junction: slide → specific displays) ──────
CREATE TABLE IF NOT EXISTS display_slide_targets (
  slide_id   UUID NOT NULL REFERENCES display_slides(id) ON DELETE CASCADE,
  display_id UUID NOT NULL REFERENCES tv_displays(id)   ON DELETE CASCADE,
  PRIMARY KEY (slide_id, display_id)
);

CREATE INDEX IF NOT EXISTS idx_slide_targets_display ON display_slide_targets (display_id);

-- ── TV logo (stored as a content block) ──────────────────────
-- Using the existing content_blocks table with key 'tv:logo'
-- No new table needed.
