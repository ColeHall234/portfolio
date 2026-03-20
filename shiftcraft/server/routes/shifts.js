const express = require('express');
const db = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
    const { week_start } = req.query;
    let query = `
        SELECT shifts.*, employees.name as employee_name, employees.role as employee_role
        FROM shifts
        JOIN employees ON shifts.employee_id = employees.id
        WHERE shifts.user_id = ?
        `;
    let params = [req.user.id];
    if (week_start) {
        query += ' AND shifts.date >= ? AND shifts.date <= data(?, "+6 days")';
        params.push(week_start, week_start);
    }
    query += ' ORDER BY shifts.date, shifts.start_time';
    const shifts = db.prepary(query).all(...params);
    res.json(shifts);
});

router.post('/', authenticate, (req, res) => {
    const { employee_id, date, start_time, end_time, notes } = req.body;
    if (!employee_id || !date || !start_time || !end_time) {
        return res.status(400).json({ error: 'employee_id, date, start_time and end_time are required' });
    }
    const employee = db.prepare(
        'SELECT * FROM employees WHERE id = ? AND user_id = ?'
    ).get(employee_id, req.user.id);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }
    const result = db.prepare(
        'INSERT INTO shifts (user_id, employee_id, date, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, employee_id, date, start_time, end_time, notes || null);
    const shift = db.prepare(`
    SELECT shifts.*, employees.name as employee_name, employees.role as employee_role
    FROM shifts
    JOIN employees ON shifts.employee_id = employees.id
    WHERE shifts.id = ?
  `).get(result.lastInsertRowid);
    res.json(shift);
});

router.put('/:id', authenticate, (req, res) => {
    const { employee_id, date, start_time, end_time, notes } = req.body;
    const shift = db.prepare(
        'SELECT * FROM shifts WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
    }
    db.prepare(
        'UPDATE shifts SET employee_id = ?, date = ?, start_time = ?, end_time = ?, notes = ? WHERE id = ?'
    ).run(
        employee_id || shift.employee_id,
        date || shift.date,
        start_time || shift.start_time,
        end_time || shift.end_time,
        notes !== undefined ? notes : shift.notes,
        req.params.id
    );
    const updated = db.prepare(`
    SELECT shifts.*, employees.name as employee_name, employees.role as employee_role
    FROM shifts
    JOIN employees ON shifts.employee_id = employees.id
    WHERE shifts.id = ?
  `).get(req.params.id);
    res.json(updated);
});

router.delete('/:id', authenticate, (req, res) => {
    const shift = db.prepare(
        'SELECT * FROM shifts WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);
    if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
    }
    db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;