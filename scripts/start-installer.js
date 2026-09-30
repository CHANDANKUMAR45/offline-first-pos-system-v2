const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

function printBuildFailure() {
  console.error('========================================');
  console.error(' INSTALLER BUILD FAILED');
  console.error('========================================');
  console.error('[INSTALLER] The POS development application is still running.');
  console.error('[INSTALLER] Check the error above for details.');
}

if (process.platform !== 'win32') {
  console.log('[INSTALLER] Windows installer builds require Windows; continuing development startup.');
  process.exit(0);
}

const installerProcess = spawn(process.execPath, [path.join(__dirname, 'package-win.js'), '--started-by-dev'], {
  cwd: projectRoot,
  detached: true,
  stdio: 'inherit',
});

console.log('========================================');
console.log(' Hybrid POS - Windows Installer');
console.log('========================================');
console.log('[INSTALLER] Building Windows installer...');
console.log('[INSTALLER] Please wait...');

installerProcess.once('error', (error) => {
  console.error(`[INSTALLER] Could not start installer build: ${error.message}`);
  printBuildFailure();
});
installerProcess.unref();
