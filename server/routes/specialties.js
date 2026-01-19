const express = require('express');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/specialties - Get specialties (supports ?active=true filter)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = 'SELECT id, name, description, duration_minutes, active, created_at FROM specialties';
    
    if (active === 'true') {
      query += ' WHERE active = true';
    }
    
    query += ' ORDER BY name';

    const { rows } = await pool.query(query);
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

// GET /api/specialties/:id - Get specialty by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      'SELECT * FROM specialties WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get specialty error:', error);
    res.status(500).json({ error: 'Erro ao buscar especialidade' });
  }
});

// POST /api/specialties - Create specialty (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, duration_minutes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Insert specialty (SERIAL id auto-generated)
    const { rows: [specialty] } = await pool.query(
      'INSERT INTO specialties (name, description, duration_minutes, active, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING *',
      [name, description || null, duration_minutes || 30]
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

    const { rows: [specialty] } = await pool.query(
      'UPDATE specialties SET name = $1, description = $2, duration_minutes = $3, active = $4 WHERE id = $5 RETURNING *',
      [name, description, duration_minutes || 30, active !== false, id]
    );

    if (!specialty) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }

    res.json(specialty);
  } catch (error) {
    console.error('Update specialty error:', error);
    res.status(500).json({ error: 'Erro ao atualizar especialidade' });
  }
});

// DELETE /api/specialties/:id - Delete specialty (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - just deactivate
    await pool.query('UPDATE specialties SET active = false WHERE id = $1', [id]);

    res.json({ message: 'Especialidade removida com sucesso' });
  } catch (error) {
    console.error('Delete specialty error:', error);
    res.status(500).json({ error: 'Erro ao remover especialidade' });
  }
});

// GET /api/specialties/professional-specialties - Get professional-specialty relationships
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
