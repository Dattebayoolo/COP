/**
 * Communists of Pakistan (COP) - Cadre Registry Backend
 * Express + PostgreSQL API server
 * Official Handle: @COPOFPK
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

async function initializeDatabase() {
  try {
    await pool.query(`
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
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cadres_phone   ON cadres(phone);
      CREATE INDEX IF NOT EXISTS idx_cadres_name    ON cadres(name);
      CREATE INDEX IF NOT EXISTS idx_cadres_cnic    ON cadres(cnic);
      CREATE INDEX IF NOT EXISTS idx_cadres_province ON cadres(province);
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_cadre (
        id          SERIAL PRIMARY KEY,
        cadre_id    VARCHAR(50) REFERENCES cadres(id) ON DELETE CASCADE,
        updated_at  TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_active_cadre_single ON active_cadre(id);
    `);
    console.log('[DB] PostgreSQL tables verified/created.');
  } catch (err) {
    console.error('[DB] Initialization error:', err.message);
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

app.get('/api/cadres', async (req, res) => {
  try {
    let query = 'SELECT * FROM cadres';
    const params = [];
    const conditions = [];
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      conditions.push(`(name ILIKE $${params.length} OR city ILIKE $${params.length} OR wing ILIKE $${params.length} OR province ILIKE $${params.length} OR id ILIKE $${params.length})`);
    }
    if (req.query.province) {
      params.push(req.query.province);
      conditions.push(`province = $${params.length}`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY joined_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/cadres]', err.message);
    res.status(500).json({ error: 'Failed to fetch cadres' });
  }
});

app.get('/api/cadres/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM cadres WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cadre not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[GET /api/cadres/:id]', err.message);
    res.status(500).json({ error: 'Failed to fetch cadre' });
  }
});

app.post('/api/cadres', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      id, name, phone, email, cnic, city, province, wing,
      role = 'Provisional Cadre', status = 'Active Provisional Cadre',
      photo = null, notes = '', joinedAt = new Date().toISOString(),
      expiryDate = 'NOV 2028', hash,
    } = req.body;

    if (phone) {
      const existing = await client.query('SELECT id FROM cadres WHERE phone = $1 LIMIT 1', [phone]);
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Duplicate', message: 'Phone already registered.', existingId: existing.rows[0].id });
      }
    }
    if (email) {
      const existing = await client.query('SELECT id FROM cadres WHERE email = $1 LIMIT 1', [email]);
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Duplicate', message: 'Email already registered.', existingId: existing.rows[0].id });
      }
    }

    await client.query(
      `INSERT INTO cadres (id, name, phone, email, cnic, city, province, wing, role, status, photo, notes, joined_at, expiry_date, hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, name, phone, email, cnic, city, province, wing, role, status, photo, notes, joinedAt, expiryDate, hash]
    );

    await client.query('COMMIT');
    res.status(201).json({ isNew: true, comrade: { id, name, phone, email, cnic, city, province, wing, role, status, photo, notes, joinedAt, expiryDate, hash } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[POST /api/cadres]', err.message);
    if (err.code === '23505') return res.status(409).json({ error: 'Duplicate', message: 'Cadre ID already exists.' });
    res.status(500).json({ error: 'Failed to register cadre' });
  } finally {
    client.release();
  }
});

app.delete('/api/cadres/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE active_cadre SET cadre_id = NULL WHERE cadre_id = $1', [id]);
    const result = await pool.query('DELETE FROM cadres WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cadre not found' });
    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[DELETE /api/cadres/:id]', err.message);
    res.status(500).json({ error: 'Failed to delete cadre' });
  }
});

app.get('/api/active-cadre', async (req, res) => {
  try {
    const active = await pool.query('SELECT cadre_id FROM active_cadre ORDER BY id DESC LIMIT 1');
    if (active.rows.length === 0 || !active.rows[0].cadre_id) {
      const recent = await pool.query('SELECT * FROM cadres ORDER BY joined_at DESC LIMIT 1');
      if (recent.rows.length === 0) return res.json({ active: null });
      return res.json({ active: recent.rows[0] });
    }
    const cadre = await pool.query('SELECT * FROM cadres WHERE id = $1', [active.rows[0].cadre_id]);
    if (cadre.rows.length === 0) return res.json({ active: null });
    res.json({ active: cadre.rows[0] });
  } catch (err) {
    console.error('[GET /api/active-cadre]', err.message);
    res.status(500).json({ error: 'Failed to fetch active cadre' });
  }
});

app.post('/api/active-cadre', async (req, res) => {
  try {
    const { cadreId } = req.body;
    await pool.query(`
      INSERT INTO active_cadre (id, cadre_id, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET cadre_id = $1, updated_at = NOW()
    `, [cadreId]);
    res.json({ success: true, activeCadreId: cadreId });
  } catch (err) {
    console.error('[POST /api/active-cadre]', err.message);
    res.status(500).json({ error: 'Failed to set active cadre' });
  }
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[COP Backend] Running on http://localhost:${PORT}`);
    console.log(`[COP Backend] Open http://localhost:${PORT} in your browser`);
  });
});

module.exports = { app, pool };