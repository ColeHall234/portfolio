require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'app.html'));
});

app.listen(PORT, () => {
    console.log(`Budget app running on http://localhost:${PORT}`);
});