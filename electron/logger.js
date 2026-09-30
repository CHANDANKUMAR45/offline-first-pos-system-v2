const fs = require('fs');
const path = require('path');
const util = require('util');

function initializeLogging(userDataPath) {
  const logDirectory = path.join(userDataPath, 'logs');
  fs.mkdirSync(logDirectory, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const logPath = path.join(logDirectory, `hybrid-pos-${date}.log`);

  for (const level of ['log', 'warn', 'error']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      original(...args);
      const entry = `${new Date().toISOString()} [${level.toUpperCase()}] ${util.format(...args)}\n`;
      try {
        fs.appendFileSync(logPath, entry, 'utf8');
      } catch (error) {
        original('Unable to write application log:', error.message);
      }
    };
  }

  return logPath;
}

module.exports = { initializeLogging };