-- COP Cadre Registry Database Schema
-- Run this against your PostgreSQL database before starting the backend,
-- or let the backend auto-create tables on startup.

-- Table: registered cadres (user-registered + any seed records)
CREATE TABLE IF NOT EXISTS cadres (
  id            VARCHAR(50)   PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  cnic          VARCHAR(50),
  city          VARCHAR(100),
  province      VARCHAR(100),
  wing          VARCHAR(255),
  role          VARCHAR(255)  DEFAULT 'Provisional Cadre',
  status        VARCHAR(255)  DEFAULT 'Active Provisional Cadre',
  photo         TEXT,
  notes         TEXT,
  joined_at     TIMESTAMP     DEFAULT NOW(),
  expiry_date   VARCHAR(50)   DEFAULT 'NOV 2028',
  hash          VARCHAR(100),
  created_at    TIMESTAMP     DEFAULT NOW()
);

-- Index for faster lookups by phone / name / city / province
CREATE INDEX IF NOT EXISTS idx_cadres_phone   ON cadres(phone);
CREATE INDEX IF NOT EXISTS idx_cadres_name    ON cadres(name);
CREATE INDEX IF NOT EXISTS idx_cadres_cnic    ON cadres(cnic);
CREATE INDEX IF NOT EXISTS idx_cadres_province ON cadres(province);

-- Table: tracks the currently active cadre on this device/backend
CREATE TABLE IF NOT EXISTS active_cadre (
  id          SERIAL PRIMARY KEY,
  cadre_id    VARCHAR(50) REFERENCES cadres(id) ON DELETE CASCADE,
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Ensure only one active cadre row exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cadre_single ON active_cadre(id);