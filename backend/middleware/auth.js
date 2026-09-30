require('dotenv').config();

function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing API key.' });
  }

  next();
}

module.exports = { verifyApiKey };
