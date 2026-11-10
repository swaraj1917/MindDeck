const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { requireAuth } = require('./middleware/auth');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MindDeck API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MindDeck backend is healthy' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/decks', requireAuth, require('./routes/decks'));
app.use('/api/cards', requireAuth, require('./routes/cards'));
app.use('/api/reviews', requireAuth, require('./routes/reviews'));
app.use('/api/study', requireAuth, require('./routes/study'));
app.use('/api/stats', requireAuth, require('./routes/stats'));

module.exports = app;