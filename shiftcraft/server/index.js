const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const employeeRoutes = require('./routes/employees');
app.use('/api/employees', employeeRoutes);
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShiftCraft server is running' });
});

app.listen(PORT, () => {
  console.log(`ShiftCraft server running on port ${PORT}`);
});

