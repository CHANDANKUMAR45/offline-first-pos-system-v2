const waitOn = require('wait-on');
const { spawn } = require('child_process');
const path = require('path');

const opts = {
  resources: ['http://localhost:5173'],
  timeout: 30000,
};

console.log('[electron-dev] Waiting for Vite dev server...');

waitOn(opts)
  .then(() => {
    console.log('[electron-dev] Vite is ready, starting Electron...');
    const electronPath = require('electron');
    const proc = spawn(String(electronPath), ['.'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    proc.on('close', (code) => process.exit(code || 0));
  })
  .catch((err) => {
    console.error('[electron-dev] Failed waiting for Vite:', err.message);
    process.exit(1);
  });
