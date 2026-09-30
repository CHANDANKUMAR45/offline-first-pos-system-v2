const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));
const outputDirectory = 'C:\\HybridPOS-installer';
const installerName = `Hybrid-POS-Setup-${packageJson.version}.exe`;
const installerPath = path.join(outputDirectory, installerName);
const lockPath = path.join(outputDirectory, '.installer-build.lock');
const buildId = `${process.pid}-${Date.now()}`;
const stagingDirectory = path.join(outputDirectory, `.staging-${buildId}`);
const stagedInstallerPath = path.join(stagingDirectory, installerName);
const temporaryInstallerPath = path.join(outputDirectory, `.${installerName}.${buildId}.tmp`);
const backupInstallerPath = path.join(outputDirectory, `.${installerName}.${buildId}.bak`);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} exited with code ${result.status ?? result.signal}`);
  }
}

function publishInstaller() {
  fs.copyFileSync(stagedInstallerPath, temporaryInstallerPath);
  let previousInstallerBackedUp = false;

  try {
    if (fs.existsSync(installerPath)) {
      fs.renameSync(installerPath, backupInstallerPath);
      previousInstallerBackedUp = true;
    }

    fs.renameSync(temporaryInstallerPath, installerPath);

    if (previousInstallerBackedUp) fs.rmSync(backupInstallerPath, { force: true });
  } catch (error) {
    if (previousInstallerBackedUp && !fs.existsSync(installerPath)) {
      fs.renameSync(backupInstallerPath, installerPath);
    }
    throw error;
  }
}

function acquireBuildLock() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const descriptor = fs.openSync(lockPath, 'wx');
      fs.writeFileSync(descriptor, String(process.pid));
      fs.closeSync(descriptor);
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;

      const ownerPid = Number(fs.readFileSync(lockPath, 'utf8'));
      if (Number.isInteger(ownerPid) && ownerPid > 0) {
        try {
          process.kill(ownerPid, 0);
          return false;
        } catch (processError) {
          if (processError.code === 'EPERM') return false;
          if (processError.code !== 'ESRCH') throw processError;
        }
      }

      fs.rmSync(lockPath, { force: true });
    }
  }

  throw new Error('Could not acquire the installer build lock.');
}

function releaseBuildLock() {
  try {
    if (Number(fs.readFileSync(lockPath, 'utf8')) === process.pid) {
      fs.rmSync(lockPath, { force: true });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(`[INSTALLER] Could not remove build lock: ${error.message}`);
  }
}

function printBuildFailure(error) {
  console.error('[INSTALLER] Build error:', error.message);
  console.error('========================================');
  console.error(' INSTALLER BUILD FAILED');
  console.error('========================================');
  console.error('[INSTALLER] The POS development application is still running.');
  console.error('[INSTALLER] Check the error above for details.');
}

async function main() {
  if (!process.argv.includes('--started-by-dev')) {
    console.log('========================================');
    console.log(' Hybrid POS - Windows Installer');
    console.log('========================================');
    console.log('[INSTALLER] Building Windows installer...');
    console.log('[INSTALLER] Please wait...');
  }

  if (process.platform !== 'win32') {
    throw new Error('Windows installer builds require Windows.');
  }

  const electronBuilderCli = require.resolve('electron-builder/cli.js');
  fs.mkdirSync(outputDirectory, { recursive: true });
  if (!acquireBuildLock()) {
    console.log('[INSTALLER] Another installer build is already running; skipping duplicate build.');
    return;
  }

  process.once('exit', releaseBuildLock);
  fs.rmSync(stagingDirectory, { recursive: true, force: true });
  fs.mkdirSync(stagingDirectory, { recursive: true });

  try {
    run(process.execPath, [path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']);
    run(process.execPath, [
      electronBuilderCli,
      '--win',
      'nsis',
      '--x64',
      `--config.directories.output=${stagingDirectory}`,
    ]);

    if (!fs.existsSync(stagedInstallerPath)) {
      throw new Error(`electron-builder succeeded but did not create ${stagedInstallerPath}`);
    }

    publishInstaller();
    if (!fs.existsSync(installerPath) || !fs.statSync(installerPath).isFile()) {
      throw new Error(`Installer was not found after publishing: ${installerPath}`);
    }

    const installerStats = fs.statSync(installerPath);
    const sizeInMb = (installerStats.size / 1_000_000).toFixed(1);
    fs.rmSync(stagingDirectory, { recursive: true, force: true });

    console.log('========================================');
    console.log(' INSTALLER READY');
    console.log('========================================');
    console.log('Installer location:');
    console.log(installerPath);
    console.log('File exists: YES');
    console.log('[INSTALLER] Build completed successfully.');
    console.log(`[INSTALLER] File: ${installerPath}`);
    console.log(`[INSTALLER] Size: ${sizeInMb} MB`);
    console.log('[INSTALLER] Status: READY');
    console.log('You can now double-click the installer to install Hybrid POS.');
    console.log('========================================');
  } finally {
    releaseBuildLock();
  }
}

main().catch((error) => {
  printBuildFailure(error);
  process.exitCode = 1;
});
