const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/professionals - Get all active professionals
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, active FROM professionals WHERE active = true ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({ error: 'Erro ao buscar profissionais' });
  }
});

// GET /api/professionals/all - Get all professionals (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, active, user_id, created_at FROM professionals ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all professionals error:', error);
    res.status(500).json({ error: 'Erro ao buscar profissionais' });
  }
});

// POST /api/professionals - Create professional (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, specialties } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const professionalId = uuidv4();

    await pool.query(
      'INSERT INTO professionals (id, name, email, phone, active, created_at) VALUES ($1, $2, $3, $4, true, NOW())',
      [professionalId, name, email, phone || null]
    );

    // Add specialties if provided
    if (specialties && specialties.length > 0) {
      for (const specialtyId of specialties) {
        await pool.query(
          'INSERT INTO professional_specialties (id, professional_id, specialty_id) VALUES ($1, $2, $3)',
          [uuidv4(), professionalId, specialtyId]
        );
      }
    }

    const { rows: [professional] } = await pool.query(
      'SELECT * FROM professionals WHERE id = $1',
      [professionalId]
    );

    res.status(201).json(professional);
  } catch (error) {
    console.error('Create professional error:', error);
    res.status(500).json({ error: 'Erro ao criar profissional' });
  }
});

// PUT /api/professionals/:id - Update professional (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, active, specialties } = req.body;

    await pool.query(
      'UPDATE professionals SET name = $1, email = $2, phone = $3, active = $4 WHERE id = $5',
      [name, email, phone, active !== false, id]
    );

    // Update specialties if provided
    if (specialties) {
      await pool.query('DELETE FROM professional_specialties WHERE professional_id = $1', [id]);
      for (const specialtyId of specialties) {
        await pool.query(
          'INSERT INTO professional_specialties (id, professional_id, specialty_id) VALUES ($1, $2, $3)',
          [uuidv4(), id, specialtyId]
        );
      }
    }

    const { rows: [professional] } = await pool.query(
      'SELECT * FROM professionals WHERE id = $1',
      [id]
    );

    res.json(professional);
  } catch (error) {
    console.error('Update professional error:', error);
    res.status(500).json({ error: 'Erro ao atualizar profissional' });
  }
});

// POST /api/professionals/:id/create-account - Create account for professional
router.post('/:id/create-account', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Get professional
    const { rows: profRows } = await pool.query(
      'SELECT * FROM professionals WHERE id = $1',
      [id]
    );

    if (profRows.length === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const professional = profRows[0];

    if (professional.user_id) {
      return res.status(400).json({ error: 'Profissional já possui conta' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await pool.query(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
      [userId, professional.email.toLowerCase(), hashedPassword]
    );

    // Create profile
    await pool.query(
      'INSERT INTO profiles (id, user_id, name, email, must_change_password, created_at, updated_at) VALUES ($1, $2, $3, $4, true, NOW(), NOW())',
      [uuidv4(), userId, professional.name, professional.email.toLowerCase()]
    );

    // Create role
    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)',
      [uuidv4(), userId, 'professional']
    );

    // Link to professional
    await pool.query(
      'UPDATE professionals SET user_id = $1 WHERE id = $2',
      [userId, id]
    );

    res.status(201).json({ message: 'Conta criada com sucesso' });
  } catch (error) {
    console.error('Create professional account error:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

module.exports = router;
