const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/availability/days/:professionalId - Get available days for a professional
router.get('/days/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;

    const { rows } = await pool.query(
      'SELECT id, day_of_week, start_time, end_time FROM available_days WHERE professional_id = $1 ORDER BY day_of_week',
      [professionalId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get available days error:', error);
    res.status(500).json({ error: 'Erro ao buscar dias disponíveis' });
  }
});

// POST /api/availability/days - Set available days for a professional (admin)
router.post('/days', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { professional_id, days } = req.body;

    // Delete existing days
    await pool.query('DELETE FROM available_days WHERE professional_id = $1', [professional_id]);

    // Insert new days
    for (const day of days) {
      await pool.query(
        'INSERT INTO available_days (id, professional_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), professional_id, day.day_of_week, day.start_time, day.end_time]
      );
    }

    const { rows } = await pool.query(
      'SELECT * FROM available_days WHERE professional_id = $1 ORDER BY day_of_week',
      [professional_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Set available days error:', error);
    res.status(500).json({ error: 'Erro ao definir dias disponíveis' });
  }
});

// GET /api/availability/blocked/:professionalId - Get blocked days for a professional
router.get('/blocked/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;

    const { rows } = await pool.query(
      'SELECT id, blocked_date, reason, specialty_id FROM blocked_days WHERE professional_id = $1 ORDER BY blocked_date',
      [professionalId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get blocked days error:', error);
    res.status(500).json({ error: 'Erro ao buscar dias bloqueados' });
  }
});

// POST /api/availability/blocked - Add blocked day (admin)
router.post('/blocked', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { professional_id, blocked_date, reason, specialty_id } = req.body;

    const blockedId = uuidv4();

    await pool.query(
      'INSERT INTO blocked_days (id, professional_id, blocked_date, reason, specialty_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [blockedId, professional_id, blocked_date, reason || null, specialty_id || null]
    );

    const { rows: [blockedDay] } = await pool.query(
      'SELECT * FROM blocked_days WHERE id = $1',
      [blockedId]
    );

    res.status(201).json(blockedDay);
  } catch (error) {
    console.error('Add blocked day error:', error);
    res.status(500).json({ error: 'Erro ao adicionar dia bloqueado' });
  }
});

// DELETE /api/availability/blocked/:id - Remove blocked day (admin)
router.delete('/blocked/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM blocked_days WHERE id = $1', [id]);

    res.json({ message: 'Dia bloqueado removido com sucesso' });
  } catch (error) {
    console.error('Delete blocked day error:', error);
    res.status(500).json({ error: 'Erro ao remover dia bloqueado' });
  }
});

// GET /api/availability/all-blocked - Get all blocked days
router.get('/all-blocked', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, professional_id, blocked_date, reason, specialty_id FROM blocked_days ORDER BY blocked_date'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all blocked days error:', error);
    res.status(500).json({ error: 'Erro ao buscar dias bloqueados' });
  }
});

module.exports = router;
