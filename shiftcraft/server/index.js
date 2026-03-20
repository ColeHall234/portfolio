const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const employeeRoutes = require('./routes/employees');
app.use('/api/employees', employeeRoutes);

const shiftRoutes = require('./routes/shifts');
app.use('/api/shifts', shiftRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShiftCraft server is running' });
});

app.use(express.static(path.join(__dirname, '../client')));

app.listen(PORT, () => {
  console.log(`ShiftCraft server running on port ${PORT}`);
});