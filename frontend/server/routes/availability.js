const express = require('express');
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

// GET /api/availability/professional/:professionalId/days - Alias for days
router.get('/professional/:professionalId/days', async (req, res) => {
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

// GET /api/availability/professional/:professionalId - Get all availability data
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;

    const { rows: days } = await pool.query(
      'SELECT id, day_of_week, start_time, end_time FROM available_days WHERE professional_id = $1 ORDER BY day_of_week',
      [professionalId]
    );

    const { rows: blocked } = await pool.query(
      'SELECT id, blocked_date, reason, specialty_id FROM blocked_days WHERE professional_id = $1 ORDER BY blocked_date',
      [professionalId]
    );

    res.json({ days, blocked });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
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
        'INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)',
        [professional_id, day.day_of_week, day.start_time, day.end_time]
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

// POST /api/availability/professional/:professionalId/days - Set available days (alias)
router.post('/professional/:professionalId/days', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { days } = req.body;

    await pool.query('DELETE FROM available_days WHERE professional_id = $1', [professionalId]);

    for (const day of days) {
      await pool.query(
        'INSERT INTO available_days (professional_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)',
        [professionalId, day.day_of_week, day.start_time, day.end_time]
      );
    }

    const { rows } = await pool.query(
      'SELECT * FROM available_days WHERE professional_id = $1 ORDER BY day_of_week',
      [professionalId]
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

// GET /api/availability/blocked - Get blocked days with filters
router.get('/blocked', async (req, res) => {
  try {
    const { professional_id, start_date, end_date } = req.query;
    
    let query = 'SELECT id, professional_id, blocked_date, reason, specialty_id FROM blocked_days WHERE 1=1';
    const params = [];

    if (professional_id) {
      params.push(professional_id);
      query += ` AND professional_id = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND blocked_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND blocked_date <= $${params.length}`;
    }

    query += ' ORDER BY blocked_date';

    const { rows } = await pool.query(query, params);
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

    const { rows: [blockedDay] } = await pool.query(
      'INSERT INTO blocked_days (professional_id, blocked_date, reason, specialty_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [professional_id || null, blocked_date, reason || null, specialty_id || null]
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

// GET /api/availability/slots - Get available time slots for a date
router.get('/slots', async (req, res) => {
  try {
    const { professional_id, date, duration } = req.query;

    if (!professional_id || !date) {
      return res.status(400).json({ error: 'professional_id e date são obrigatórios' });
    }

    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const durationMinutes = parseInt(duration) || 30;

    // Get available days for this professional
    const { rows: availableDays } = await pool.query(
      'SELECT start_time, end_time FROM available_days WHERE professional_id = $1 AND day_of_week = $2',
      [professional_id, dayOfWeek]
    );

    // Check if there's a specific availability for this date (stored as blocked with AVAILABLE: prefix)
    const { rows: specificAvailability } = await pool.query(
      `SELECT reason FROM blocked_days 
       WHERE professional_id = $1 AND blocked_date = $2 AND reason LIKE 'AVAILABLE:%'`,
      [professional_id, date]
    );

    // Check if day is blocked
    const { rows: blockedDay } = await pool.query(
      `SELECT id FROM blocked_days 
       WHERE professional_id = $1 AND blocked_date = $2 AND (reason IS NULL OR reason NOT LIKE 'AVAILABLE:%')`,
      [professional_id, date]
    );

    if (blockedDay.length > 0) {
      return res.json([]);
    }

    // Get booked slots
    const { rows: bookedSlots } = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE professional_id = $1 AND appointment_date = $2 AND status IN ('scheduled', 'completed')`,
      [professional_id, date]
    );

    const bookedTimes = bookedSlots.map(s => s.appointment_time.substring(0, 5));

    // Generate time slots
    const slots = [];
    
    // Use specific availability if exists, otherwise use regular schedule
    let schedules = [];
    
    if (specificAvailability.length > 0) {
      // Parse specific availability from reason (format: AVAILABLE:09:00-12:00)
      specificAvailability.forEach(sa => {
        const match = sa.reason.match(/AVAILABLE:(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (match) {
          schedules.push({ start_time: match[1] + ':00', end_time: match[2] + ':00' });
        }
      });
    } else if (availableDays.length > 0) {
      schedules = availableDays;
    }

    for (const schedule of schedules) {
      const startParts = schedule.start_time.split(':');
      const endParts = schedule.end_time.split(':');
      
      let currentHour = parseInt(startParts[0]);
      let currentMinute = parseInt(startParts[1]);
      const endHour = parseInt(endParts[0]);
      const endMinute = parseInt(endParts[1]);

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        if (!bookedTimes.includes(timeStr)) {
          slots.push(timeStr);
        }

        currentMinute += durationMinutes;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
    }

    res.json(slots);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
  }
});

// GET /api/availability/booked-slots - Get booked slots for a date
router.get('/booked-slots', async (req, res) => {
  try {
    const { professional_id, date } = req.query;

    if (!professional_id || !date) {
      return res.status(400).json({ error: 'professional_id e date são obrigatórios' });
    }

    const { rows } = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE professional_id = $1 AND appointment_date = $2 AND status IN ('scheduled', 'completed')`,
      [professional_id, date]
    );

    const bookedSlots = rows.map(r => r.appointment_time.substring(0, 5));

    res.json({ bookedSlots });
  } catch (error) {
    console.error('Get booked slots error:', error);
    res.status(500).json({ error: 'Erro ao buscar horários ocupados' });
  }
});

module.exports = router;
