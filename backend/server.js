const express = require('express');
const cors = require('cors');
require('dotenv').config();

const syncRoutes = require('./routes/sync');
const webRoutes = require('./routes/web');
const { verifyApiKey } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors()); // Allow cross-origin requests from Electron dev servers
app.use(express.json({ limit: '10mb' })); // Support larger batch sync payloads

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unprotected Read-Only routes for Web Admin
app.use('/api/web', webRoutes);

// Protect all internal sync endpoints with Authentication
app.use('/api', verifyApiKey);

// Routes
app.use('/api/sync', syncRoutes);

app.listen(PORT, () => {
  console.log(`[Server] Hybrid POS Backend running on http://localhost:${PORT}`);
});
