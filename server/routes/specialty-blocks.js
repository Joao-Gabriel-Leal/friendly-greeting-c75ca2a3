const express = require('express');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/specialty-blocks/user/:userId - Get specialty blocks for a user
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permission
    if (req.userId != userId && req.userRole !== 'admin' && req.userRole !== 'developer') {
      return res.status(403).json({ error: 'Sem permissão para acessar estes bloqueios' });
    }

    const { rows } = await pool.query(
      `SELECT usb.*, s.name as specialty_name
       FROM user_specialty_blocks usb
       LEFT JOIN specialties s ON usb.specialty_id = s.id
       WHERE usb.user_id = $1
       ORDER BY usb.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get specialty blocks error:', error);
    res.status(500).json({ error: 'Erro ao buscar bloqueios de especialidade' });
  }
});

// POST /api/specialty-blocks - Create specialty block (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { user_id, specialty_id, blocked_until, reason } = req.body;

    if (!user_id || !specialty_id) {
      return res.status(400).json({ error: 'user_id e specialty_id são obrigatórios' });
    }

    // Insert specialty block (SERIAL id auto-generated)
    const { rows: [block] } = await pool.query(
      `INSERT INTO user_specialty_blocks (user_id, specialty_id, blocked_until, reason, created_by, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [user_id, specialty_id, blocked_until || null, reason || null, req.userId]
    );

    res.status(201).json(block);
  } catch (error) {
    console.error('Create specialty block error:', error);
    res.status(500).json({ error: 'Erro ao criar bloqueio de especialidade' });
  }
});

// DELETE /api/specialty-blocks/:id - Delete specialty block (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM user_specialty_blocks WHERE id = $1', [id]);

    res.json({ message: 'Bloqueio removido com sucesso' });
  } catch (error) {
    console.error('Delete specialty block error:', error);
    res.status(500).json({ error: 'Erro ao remover bloqueio' });
  }
});

module.exports = router;
