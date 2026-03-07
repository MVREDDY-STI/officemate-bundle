-- ─────────────────────────────────────────────────────────────
-- SOLUM Officemate — Seed Data
-- Run AFTER schema.sql
-- ─────────────────────────────────────────────────────────────

-- Admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@solum.com', '$2b$12$placeholder_bcrypt_hash_admin', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Regular user (password: user123)
INSERT INTO users (email, password_hash, name, role)
VALUES ('user@solum.com', '$2b$12$placeholder_bcrypt_hash_user', 'Peppin', 'user')
ON CONFLICT (email) DO NOTHING;

-- Building info
INSERT INTO building_info (address, phone, email, description, wifi_ssid, wifi_password, delivery_name, delivery_company, delivery_address, emergency_name, emergency_company, emergency_address, hours)
VALUES (
  '357 Guseong-ro, Yongin-si, Gyeonggi-do 16914',
  '+82 1588 0502',
  'esl@solu-m.com',
  'SOLUM Officemate — your connected workplace hub.',
  'SOLUM_OFFICE',
  'solum2024',
  'Delivery Reception',
  'SOLUM Building Services',
  'Ground Floor, Reception Desk',
  'Security Desk',
  'SOLUM Group',
  'Level B1, Security Control Room',
  '[
    {"day":"Monday","open":"09:00","close":"18:00"},
    {"day":"Tuesday","open":"09:00","close":"18:00"},
    {"day":"Wednesday","open":"09:00","close":"18:00"},
    {"day":"Thursday","open":"09:00","close":"18:00"},
    {"day":"Friday","open":"09:00","close":"18:00"},
    {"day":"Saturday","open":"Closed","close":""},
    {"day":"Sunday","open":"Closed","close":""}
  ]'::jsonb
);

-- Rooms
INSERT INTO rooms (name, room_code, capacity, features, color, sort_order) VALUES
  ('SAMVAADA',  'Room 01', 4,  ARRAY['TV','White Board'], '#f59e3d', 1),
  ('SANKALPA',  'Room 02', 4,  ARRAY['TV','White Board'], '#60a5fa', 2),
  ('CHINTANA',  'Room 03', 4,  ARRAY['TV','White Board'], '#34d399', 3),
  ('MANTHANA',  'Room 04', 4,  ARRAY['TV','White Board'], '#f87171', 4),
  ('AVALOKANA', 'Room 05', 10, ARRAY['TV','White Board'], '#a78bfa', 5)
ON CONFLICT (name) DO NOTHING;

-- Asset types
INSERT INTO asset_types (name, icon_name) VALUES
  ('Laptop',  'Monitor'),
  ('Mobile',  'Smartphone'),
  ('ESL Tag', 'Tag'),
  ('Monitor', 'Monitor'),
  ('TV',      'Tv'),
  ('Gateway', 'Wifi')
ON CONFLICT (name) DO NOTHING;

-- Support categories
INSERT INTO support_categories (title, icon_name, sort_order) VALUES
  ('My Membership',    'User',    1),
  ('IT & Audiovisuals','Settings',2),
  ('Website & app',    'Monitor', 3),
  ('My Building',      'Building',4);

-- Support items
INSERT INTO support_items (category_id, label, sort_order)
SELECT c.id, item.label, item.ord
FROM support_categories c,
     LATERAL (VALUES
       ('My Membership', 'Account Central',    1),
       ('My Membership', 'Billing',            2),
       ('My Membership', 'Refund',             3),
       ('My Membership', 'Member Expectations',4),
       ('IT & Audiovisuals', 'Printing',       1),
       ('IT & Audiovisuals', 'Wifi',           2),
       ('IT & Audiovisuals', 'Laptop',         3),
       ('IT & Audiovisuals', 'Extra Monitor',  4),
       ('IT & Audiovisuals', 'Phones',         5),
       ('Website & app', 'Website & App (The Member Network)', 1),
       ('Website & app', 'Account Central',    2),
       ('Website & app', 'Services Store',     3),
       ('Website & app', 'Emails & Notifications', 4),
       ('Website & app', 'WeWork Community Guidelines', 5),
       ('My Building', 'Building/Facilities',  1),
       ('My Building', 'Security',             2),
       ('My Building', 'Office',               3),
       ('My Building', 'Pantry',               4),
       ('My Building', 'Account Central',      5)
     ) AS item(cat_name, label, ord)
WHERE c.title = item.cat_name
ON CONFLICT DO NOTHING;

-- Team members
INSERT INTO team_members (name, title, section, sort_order) VALUES
  ('Alex Kim',   'Head of Ops',   'team', 1),
  ('Sara Lim',   'HR Manager',    'team', 2),
  ('Jin Park',   'IT Lead',       'team', 3)
ON CONFLICT DO NOTHING;

-- Company info
INSERT INTO company_info (hq_title, hq_address, sales_title, sales_contact, copyright)
VALUES (
  'SOLUM Group HQ',
  E'357 Guseong-ro, Yongin-si\nGyeonggi-do 16914',
  'Sales and Marketing',
  E'+82 1588 0502\nesl@solu-m.com',
  '대표이사 : 전성호 사업자등록번호 : 490-81-00105 Copyright © 2024 SOLUM. All rights reserved.'
);

-- Events
INSERT INTO events (title, description, event_date, is_published, sort_order) VALUES
  ('Diwali Celebration', 'Join us for a vibrant Diwali celebration with lights and festivities.', '2024-11-01', TRUE, 1),
  ('Holi Festival',      'Celebrate the festival of colours with your colleagues.',               '2025-03-14', TRUE, 2)
ON CONFLICT DO NOTHING;
