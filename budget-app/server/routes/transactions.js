const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

router.get('/', authenticate, (req, res) => {
    try {
        const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY date DESC, created_at DESC
    `).all(req.user.userId);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authenticate, (req, res) => {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const stmt = db.prepare(`
      INSERT INTO transactions (user_id, type, category, amount, description, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(
            req.user.userId,
            type,
            category,
            parseFloat(amount),
            description || '',
            date
        );
        const transaction = db.prepare(
            'SELECT * FROM transactions WHERE id = ?'
        ).get(result.lastInsertRowid);
        res.json(transaction);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authenticate, (req, res) => {
    try {
        const transaction = db.prepare(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.userId);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;