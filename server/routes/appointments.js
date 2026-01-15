const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments - Get user appointments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, professional_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT a.*, 
             p.name as professional_name, p.email as professional_email,
             s.name as specialty_name, s.duration_minutes,
             pr.name as user_name, pr.email as user_email, pr.phone as user_phone
      FROM appointments a
      LEFT JOIN professionals p ON a.professional_id = p.id
      LEFT JOIN specialties s ON a.specialty_id = s.id
      LEFT JOIN profiles pr ON a.user_id = pr.user_id
      WHERE 1=1
    `;
    const params = [];

    // If user is not admin, show only their appointments
    if (req.userRole !== 'admin' && req.userRole !== 'developer') {
      params.push(req.userId);
      query += ` AND a.user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    if (professional_id) {
      params.push(professional_id);
      query += ` AND a.professional_id = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND a.appointment_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND a.appointment_date <= $${params.length}`;
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// GET /api/appointments/professional - Get professional's appointments
router.get('/professional', authMiddleware, async (req, res) => {
  try {
    // Get professional_id for this user
    const { rows: profRows } = await pool.query(
      'SELECT id FROM professionals WHERE user_id = $1',
      [req.userId]
    );

    if (profRows.length === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado' });
    }

    const professionalId = profRows[0].id;

    const { rows } = await pool.query(
      `SELECT a.*, 
              s.name as specialty_name, s.duration_minutes,
              pr.name as user_name, pr.email as user_email, pr.phone as user_phone
       FROM appointments a
       LEFT JOIN specialties s ON a.specialty_id = s.id
       LEFT JOIN profiles pr ON a.user_id = pr.user_id
       WHERE a.professional_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [professionalId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get professional appointments error:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// POST /api/appointments - Create appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { professional_id, specialty_id, appointment_date, appointment_time, notes } = req.body;

    if (!professional_id || !specialty_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Dados incompletos para o agendamento' });
    }

    // Check if slot is available
    const { rows: existingAppointments } = await pool.query(
      `SELECT id FROM appointments 
       WHERE professional_id = $1 AND appointment_date = $2 AND appointment_time = $3
       AND status IN ('scheduled', 'completed')`,
      [professional_id, appointment_date, appointment_time]
    );

    if (existingAppointments.length > 0) {
      return res.status(400).json({ error: 'Este horário já está ocupado' });
    }

    const appointmentId = uuidv4();

    await pool.query(
      `INSERT INTO appointments (id, user_id, professional_id, specialty_id, appointment_date, appointment_time, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', NOW(), NOW())`,
      [appointmentId, req.userId, professional_id, specialty_id, appointment_date, appointment_time, notes || null]
    );

    const { rows: [newAppointment] } = await pool.query(
      `SELECT a.*, 
              p.name as professional_name,
              s.name as specialty_name
       FROM appointments a
       LEFT JOIN professionals p ON a.professional_id = p.id
       LEFT JOIN specialties s ON a.specialty_id = s.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build update query dynamically
    const allowedFields = ['status', 'notes', 'professional_confirmed', 'professional_confirmed_at', 'user_confirmed', 'user_confirmed_at', 'appointment_date', 'appointment_time'];
    const setClauses = [];
    const params = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        params.push(updates[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    params.push(id);
    const query = `UPDATE appointments SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`;

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW() 
       WHERE id = $1 AND (user_id = $2 OR $3 IN ('admin', 'developer'))
       RETURNING *`,
      [id, req.userId, req.userRole]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado ou sem permissão' });
    }

    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
});

// GET /api/appointments/booked-slots - Get booked slots for a professional on a date
router.get('/booked-slots', async (req, res) => {
  try {
    const { professional_id, date } = req.query;

    if (!professional_id || !date) {
      return res.status(400).json({ error: 'professional_id e date são obrigatórios' });
    }

    const { rows } = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE professional_id = $1 AND appointment_date = $2
       AND status IN ('scheduled', 'completed')`,
      [professional_id, date]
    );

    res.json(rows.map(r => r.appointment_time));
  } catch (error) {
    console.error('Get booked slots error:', error);
    res.status(500).json({ error: 'Erro ao buscar horários ocupados' });
  }
});

module.exports = router;
