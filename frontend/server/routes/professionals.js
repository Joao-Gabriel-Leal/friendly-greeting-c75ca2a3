const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/professionals - Get all professionals (supports ?active=true filter)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = `
      SELECT p.id, p.name, p.email, p.phone, p.active, p.user_id, p.created_at,
             COALESCE(
               json_agg(
                 json_build_object('id', ps.specialty_id, 'name', s.name)
               ) FILTER (WHERE ps.id IS NOT NULL), 
               '[]'
             ) as specialties
      FROM professionals p
      LEFT JOIN professional_specialties ps ON p.id = ps.professional_id
      LEFT JOIN specialties s ON ps.specialty_id = s.id
    `;
    
    if (active === 'true') {
      query += ' WHERE p.active = true';
    }
    
    query += ' GROUP BY p.id ORDER BY p.name';

    const { rows } = await pool.query(query);
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
      `SELECT p.id, p.name, p.email, p.phone, p.active, p.user_id, p.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', ps.specialty_id, 'name', s.name)
                ) FILTER (WHERE ps.id IS NOT NULL), 
                '[]'
              ) as specialties
       FROM professionals p
       LEFT JOIN professional_specialties ps ON p.id = ps.professional_id
       LEFT JOIN specialties s ON ps.specialty_id = s.id
       GROUP BY p.id
       ORDER BY p.name`
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all professionals error:', error);
    res.status(500).json({ error: 'Erro ao buscar profissionais' });
  }
});

// GET /api/professionals/:id - Get professional by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.email, p.phone, p.active, p.user_id, p.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', ps.specialty_id, 'name', s.name)
                ) FILTER (WHERE ps.id IS NOT NULL), 
                '[]'
              ) as specialties
       FROM professionals p
       LEFT JOIN professional_specialties ps ON p.id = ps.professional_id
       LEFT JOIN specialties s ON ps.specialty_id = s.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({ error: 'Erro ao buscar profissional' });
  }
});

// GET /api/professionals/user/:userId - Get professional by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.email, p.phone, p.active, p.user_id, p.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', ps.specialty_id, 'name', s.name)
                ) FILTER (WHERE ps.id IS NOT NULL), 
                '[]'
              ) as specialties
       FROM professionals p
       LEFT JOIN professional_specialties ps ON p.id = ps.professional_id
       LEFT JOIN specialties s ON ps.specialty_id = s.id
       WHERE p.user_id = $1
       GROUP BY p.id`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get professional by user error:', error);
    res.status(500).json({ error: 'Erro ao buscar profissional' });
  }
});

// GET /api/professionals/by-specialty/:specialtyId - Get professionals by specialty
router.get('/by-specialty/:specialtyId', async (req, res) => {
  try {
    const { specialtyId } = req.params;
    
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.email, p.phone, p.active
       FROM professionals p
       INNER JOIN professional_specialties ps ON p.id = ps.professional_id
       WHERE ps.specialty_id = $1 AND p.active = true
       ORDER BY p.name`,
      [specialtyId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get professionals by specialty error:', error);
    res.status(500).json({ error: 'Erro ao buscar profissionais' });
  }
});

// POST /api/professionals - Create professional (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, specialties } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Insert professional (SERIAL id auto-generated)
    const { rows: [newProfessional] } = await pool.query(
      'INSERT INTO professionals (name, email, phone, active, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING *',
      [name, email || null, phone || null]
    );

    // Add specialties if provided
    if (specialties && specialties.length > 0) {
      for (const specialtyId of specialties) {
        await pool.query(
          'INSERT INTO professional_specialties (professional_id, specialty_id) VALUES ($1, $2)',
          [newProfessional.id, specialtyId]
        );
      }
    }

    res.status(201).json(newProfessional);
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
    if (specialties !== undefined) {
      await pool.query('DELETE FROM professional_specialties WHERE professional_id = $1', [id]);
      if (specialties && specialties.length > 0) {
        for (const specialtyId of specialties) {
          await pool.query(
            'INSERT INTO professional_specialties (professional_id, specialty_id) VALUES ($1, $2)',
            [id, specialtyId]
          );
        }
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

// DELETE /api/professionals/:id - Delete professional (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - just deactivate
    await pool.query('UPDATE professionals SET active = false WHERE id = $1', [id]);

    res.json({ message: 'Profissional removido com sucesso' });
  } catch (error) {
    console.error('Delete professional error:', error);
    res.status(500).json({ error: 'Erro ao remover profissional' });
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

    if (!professional.email) {
      return res.status(400).json({ error: 'Profissional não possui email cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (SERIAL id auto-generated)
    const { rows: [newUser] } = await pool.query(
      'INSERT INTO users (email, password_hash, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, email',
      [professional.email.toLowerCase(), hashedPassword]
    );

    // Create profile
    await pool.query(
      'INSERT INTO profiles (user_id, name, email, must_change_password, created_at, updated_at) VALUES ($1, $2, $3, true, NOW(), NOW())',
      [newUser.id, professional.name, professional.email.toLowerCase()]
    );

    // Create role
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [newUser.id, 'professional']
    );

    // Link to professional
    await pool.query(
      'UPDATE professionals SET user_id = $1 WHERE id = $2',
      [newUser.id, id]
    );

    res.status(201).json({ message: 'Conta criada com sucesso' });
  } catch (error) {
    console.error('Create professional account error:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

module.exports = router;
