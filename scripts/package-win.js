const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));
const outputDirectory = path.resolve(projectRoot, packageJson.build.directories.output);
const lockPath = path.join(outputDirectory, '.installer-build.lock');
const buildId = `${process.pid}-${Date.now()}`;
const stagingDirectory = path.join(outputDirectory, `.staging-${buildId}`);
const showStatus = !process.argv.includes('--started-by-dev');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
  if (result.error) {
    throw new Error([output, result.error.message].filter(Boolean).join('\n'));
  }
  if (result.status !== 0) {
    throw new Error([
      output,
      `${path.basename(command)} exited with code ${result.status ?? result.signal}`,
    ].filter(Boolean).join('\n'));
  }
}

function findStagedInstaller() {
  const installers = fs.readdirSync(stagingDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.exe');

  if (installers.length === 0) {
    throw new Error(`The build finished, but no .exe installer was found in ${stagingDirectory}`);
  }
  if (installers.length > 1) {
    throw new Error(`The build produced multiple .exe files in ${stagingDirectory}; cannot identify the installer.`);
  }

  return path.join(stagingDirectory, installers[0].name);
}

function publishInstaller(stagedInstallerPath) {
  const installerName = path.basename(stagedInstallerPath);
  const installerPath = path.join(outputDirectory, installerName);
  const temporaryInstallerPath = path.join(outputDirectory, `.${installerName}.${buildId}.tmp`);
  const backupInstallerPath = path.join(outputDirectory, `.${installerName}.${buildId}.bak`);
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

  return installerPath;
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
  console.error(error.message);
  console.error('========================================');
  console.error('  INSTALLER BUILD FAILED');
  console.error('========================================');
}

async function main() {
  if (showStatus) {
    console.log('========================================');
    console.log('  HYBRID POS INSTALLER BUILD');
    console.log('========================================');
    console.log('Building installer...');
  }

  if (process.platform !== 'win32') {
    throw new Error('Windows installer builds require Windows.');
  }

  const electronBuilderCli = require.resolve('electron-builder/cli.js');
  fs.mkdirSync(outputDirectory, { recursive: true });
  if (!acquireBuildLock()) {
    throw new Error('Another installer build is already running. Wait for it to finish and try again.');
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

    const stagedInstallerPath = findStagedInstaller();
    const installerPath = publishInstaller(stagedInstallerPath);
    if (!fs.existsSync(installerPath) || !fs.statSync(installerPath).isFile()) {
      throw new Error(`The installer was not found after publishing: ${installerPath}`);
    }

    const installerStats = fs.statSync(installerPath);
    const sizeInMb = (installerStats.size / (1024 * 1024)).toFixed(1);
    fs.rmSync(stagingDirectory, { recursive: true, force: true });

    if (showStatus) {
      console.log('✓ Build completed successfully!');
      console.log();
      console.log('========================================');
      console.log('  INSTALLER READY');
      console.log('========================================');
      console.log(`File: ${installerPath}`);
      console.log(`Size: ${sizeInMb} MB`);
      console.log('========================================');
    }
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true });
    releaseBuildLock();
  }
}

main().catch((error) => {
  printBuildFailure(error);
  process.exitCode = 1;
});
