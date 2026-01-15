const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, setor } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await pool.query(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
      [userId, email.toLowerCase(), hashedPassword]
    );

    // Create profile
    await pool.query(
      'INSERT INTO profiles (id, user_id, name, email, setor, must_change_password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())',
      [uuidv4(), userId, name, email.toLowerCase(), setor || null]
    );

    // Create user role
    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES ($1, $2, $3)',
      [uuidv4(), userId, 'user']
    );

    // Get user with role for token
    const { rows: [userWithRole] } = await pool.query(
      `SELECT u.id, u.email, ur.role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.id = $1`,
      [userId]
    );

    const token = generateToken(userWithRole);

    res.status(201).json({
      user: { id: userId, email: email.toLowerCase() },
      token,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Get user with role
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.password_hash, ur.role,
              p.blocked, p.suspended_until
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Conta bloqueada. Contate os administradores.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    });

    res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, ur.role,
              p.id as profile_id, p.name, p.phone, p.cpf, p.setor,
              p.suspended_until, p.blocked, p.must_change_password,
              p.created_at, p.updated_at
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = rows[0];
    
    res.json({
      user: { id: user.id, email: user.email },
      profile: {
        id: user.profile_id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        setor: user.setor,
        suspended_until: user.suspended_until,
        blocked: user.blocked || false,
        must_change_password: user.must_change_password || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      role: user.role || 'user'
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.userId]
    );

    await pool.query(
      'UPDATE profiles SET must_change_password = false, updated_at = NOW() WHERE user_id = $1',
      [req.userId]
    );

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

module.exports = router;
