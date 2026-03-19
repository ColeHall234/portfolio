const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

router.post('/register', async (req, res) => {
  const { email, password, business_name } = req.body;
  if (!email || !password || !business_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (email, password, business_name) VALUES (?, ?, ?)'
    );
    const result = stmt.run(email, hashed, business_name);
    const token = jwt.sign(
      { id: result.lastInsertRowid, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, email, business_name });
  } catch (err) {
    if (err.message.includes('UNIQUE')) { 
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, email: user.email, business_name: user.business_name });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;