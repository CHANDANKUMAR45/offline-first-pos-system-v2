const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredPaths = [
  'electron/main.js',
  'electron/preload.js',
  'src/main.jsx',
  'backend/server.js',
  'database/connection.js'
];

for (const entry of requiredPaths) {
  const fullPath = path.join(root, entry);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required app file: ${entry}`);
  }
}

console.log('Smoke test passed: required app files are present.');
