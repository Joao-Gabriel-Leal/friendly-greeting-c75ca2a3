const express = require('express');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/profiles - Get all profiles (admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, ur.role
       FROM profiles p
       LEFT JOIN user_roles ur ON p.user_id = ur.user_id
       ORDER BY p.name`
    );
    res.json(rows);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
});

// GET /api/profiles/by-users - Get profiles by user IDs
router.get('/by-users', authMiddleware, async (req, res) => {
  try {
    const userIds = req.query.user_ids;
    
    if (!userIds) {
      return res.status(400).json({ error: 'user_ids são obrigatórios' });
    }

    const ids = Array.isArray(userIds) ? userIds : [userIds];
    
    const { rows } = await pool.query(
      `SELECT p.*, ur.role
       FROM profiles p
       LEFT JOIN user_roles ur ON p.user_id = ur.user_id
       WHERE p.user_id = ANY($1)`,
      [ids]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get profiles by users error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfis' });
  }
});

// GET /api/profiles/user/:userId - Get profile by user ID
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permission
    if (req.userId != userId && req.userRole !== 'admin' && req.userRole !== 'developer') {
      return res.status(403).json({ error: 'Sem permissão para acessar este perfil' });
    }

    const { rows } = await pool.query(
      `SELECT p.*, ur.role
       FROM profiles p
       LEFT JOIN user_roles ur ON p.user_id = ur.user_id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// GET /api/profiles/:id - Get profile by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT p.*, ur.role
       FROM profiles p
       LEFT JOIN user_roles ur ON p.user_id = ur.user_id
       WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Check permission
    if (req.userId != rows[0].user_id && req.userRole !== 'admin' && req.userRole !== 'developer') {
      return res.status(403).json({ error: 'Sem permissão para acessar este perfil' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// PUT /api/profiles/:id - Update profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, cpf, setor, suspended_until, blocked, must_change_password } = req.body;

    // Get profile to check ownership
    const { rows: profiles } = await pool.query('SELECT user_id FROM profiles WHERE id = $1', [id]);
    
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Check permission - users can only update their own profile (except admin)
    const isAdmin = req.userRole === 'admin' || req.userRole === 'developer';
    if (req.userId != profiles[0].user_id && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para atualizar este perfil' });
    }

    // Regular users can only update name, phone, cpf, setor
    if (isAdmin) {
      await pool.query(
        `UPDATE profiles SET name = COALESCE($1, name), phone = $2, cpf = $3, setor = $4, 
         suspended_until = $5, blocked = $6, must_change_password = COALESCE($7, must_change_password), updated_at = NOW() 
         WHERE id = $8`,
        [name, phone, cpf, setor, suspended_until, blocked || false, must_change_password, id]
      );
    } else {
      await pool.query(
        `UPDATE profiles SET name = COALESCE($1, name), phone = $2, cpf = $3, setor = $4, updated_at = NOW() 
         WHERE id = $5`,
        [name, phone, cpf, setor, id]
      );
    }

    const { rows: [profile] } = await pool.query(
      'SELECT * FROM profiles WHERE id = $1',
      [id]
    );

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// POST /api/profiles/:userId/block - Block/unblock user (admin)
router.post('/:userId/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { blocked, reason } = req.body;

    await pool.query(
      'UPDATE profiles SET blocked = $1, updated_at = NOW() WHERE user_id = $2',
      [blocked, userId]
    );

    // Log action
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, target_type, details, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [req.userId, blocked ? 'block_user' : 'unblock_user', userId, 'user', JSON.stringify({ reason })]
    );

    res.json({ message: blocked ? 'Usuário bloqueado' : 'Usuário desbloqueado' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Erro ao bloquear/desbloquear usuário' });
  }
});

// POST /api/profiles/:userId/suspend - Suspend user (admin)
router.post('/:userId/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspended_until, reason } = req.body;

    await pool.query(
      'UPDATE profiles SET suspended_until = $1, updated_at = NOW() WHERE user_id = $2',
      [suspended_until, userId]
    );

    // Log action
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, target_type, details, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [req.userId, suspended_until ? 'suspend_user' : 'unsuspend_user', userId, 'user', JSON.stringify({ suspended_until, reason })]
    );

    res.json({ message: suspended_until ? 'Usuário suspenso' : 'Suspensão removida' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Erro ao suspender usuário' });
  }
});

// PUT /api/profiles/:userId/role - Update user role (admin)
router.put('/:userId/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'professional', 'admin', 'developer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role inválida' });
    }

    // Check if role exists
    const { rows: existingRole } = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = $1',
      [userId]
    );

    if (existingRole.length > 0) {
      await pool.query('UPDATE user_roles SET role = $1 WHERE user_id = $2', [role, userId]);
    } else {
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [userId, role]
      );
    }

    res.json({ message: 'Role atualizada com sucesso' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
});

module.exports = router;
