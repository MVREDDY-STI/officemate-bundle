-- Migration 003: User approval workflow
-- Run with:
--   docker exec -i officemate_db psql -U solum -d officemate < backend/src/db/migrations/003_user_approval.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Approve all existing users so they are not locked out
UPDATE users SET is_approved = true WHERE is_approved = false;
