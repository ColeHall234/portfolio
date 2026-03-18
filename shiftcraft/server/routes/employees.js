const express = require('express');
const db = require('../database');
const authenticate = require('../middleware/auth');

const router = express.Router();
const FREE_EMPLOYEE_LIMIT = 5;

router.get('/', authenticate, (req, res) => {
  const employees = db.prepare(
    'SELECT * FROM employees WHERE user_id = ? ORDER BY name'
  ).all(req.user.id);
  res.json(employees);
});

router.post('/', authenticate, (req, res) => {
  const { name, email, role } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Employee name is required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.plan === 'free') {
    const count = db.prepare(
      'SELECT COUNT(*) as count FROM employees WHERE user_id = ?'
    ).get(req.user.id);
    if (count.count >= FREE_EMPLOYEE_LIMIT) {
      return res.status(403).json({
        error: 'Free plan limited to 5 employees. Upgrade to add more.',
        upgrade_required: true
      });
    }
  }
  const result = db.prepare(
    'INSERT INTO employees (user_id, name, email, role) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, name, email || null, role || null);
  const employee = db.prepare(
    'SELECT * FROM employees WHERE id = ?'
  ).get(result.lastInsertRowid);
  res.json(employee);
});

router.put('/:id', authenticate, (req, res) => {
  const { name, email, role } = req.body;
  const employee = db.prepare(
    'SELECT * FROM employees WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  db.prepare(
    'UPDATE employees SET name = ?, email = ?, role = ? WHERE id = ?'
  ).run(name || employee.name, email || employee.email, role || employee.role, req.params.id);
  const updated = db.prepare(
    'SELECT * FROM employees WHERE id = ?'
  ).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticate, (req, res) => {
  const employee = db.prepare(
    'SELECT * FROM employees WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;