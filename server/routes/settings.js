const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM system_settings');
    
    // Convert to object format
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const { rows } = await pool.query(
      'SELECT value FROM system_settings WHERE key = $1',
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    res.json(rows[0].value);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

// PUT /api/settings/:key - Update setting (admin)
router.put('/:key', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Check if setting exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM system_settings WHERE key = $1',
      [key]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE system_settings SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3',
        [JSON.stringify(value), req.userId, key]
      );
    } else {
      await pool.query(
        'INSERT INTO system_settings (id, key, value, updated_by, updated_at) VALUES ($1, $2, $3, $4, NOW())',
        [uuidv4(), key, JSON.stringify(value), req.userId]
      );
    }

    res.json({ message: 'Configuração atualizada' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
});

module.exports = router;
