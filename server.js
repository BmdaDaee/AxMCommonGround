const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'CommonGround API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[CommonGround] Server running on port ${PORT}`);
});
