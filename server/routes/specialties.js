const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/specialties - Get all active specialties
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description, duration_minutes, active FROM specialties WHERE active = true ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({ error: 'Erro ao buscar especialidades' });
  }
});

// GET /api/specialties/all - Get all specialties (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM specialties ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all specialties error:', error);
    res.status(500).json({ error: 'Erro ao buscar especialidades' });
  }
});

// POST /api/specialties - Create specialty (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, duration_minutes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const specialtyId = uuidv4();

    await pool.query(
      'INSERT INTO specialties (id, name, description, duration_minutes, active, created_at) VALUES ($1, $2, $3, $4, true, NOW())',
      [specialtyId, name, description || null, duration_minutes || 30]
    );

    const { rows: [specialty] } = await pool.query(
      'SELECT * FROM specialties WHERE id = $1',
      [specialtyId]
    );

    res.status(201).json(specialty);
  } catch (error) {
    console.error('Create specialty error:', error);
    res.status(500).json({ error: 'Erro ao criar especialidade' });
  }
});

// PUT /api/specialties/:id - Update specialty (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, active } = req.body;

    await pool.query(
      'UPDATE specialties SET name = $1, description = $2, duration_minutes = $3, active = $4 WHERE id = $5',
      [name, description, duration_minutes || 30, active !== false, id]
    );

    const { rows: [specialty] } = await pool.query(
      'SELECT * FROM specialties WHERE id = $1',
      [id]
    );

    res.json(specialty);
  } catch (error) {
    console.error('Update specialty error:', error);
    res.status(500).json({ error: 'Erro ao atualizar especialidade' });
  }
});

// GET /api/professional-specialties - Get professional-specialty relationships
router.get('/professional-specialties', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, professional_id, specialty_id FROM professional_specialties'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get professional specialties error:', error);
    res.status(500).json({ error: 'Erro ao buscar especialidades dos profissionais' });
  }
});

module.exports = router;
