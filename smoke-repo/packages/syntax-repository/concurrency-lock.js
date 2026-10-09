const fs = require('fs');
const os = require('os');
const path = require('path');

const lockFilePath = path.join(os.tmpdir(), 'assayer-specimen-test.lock');

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) {
    return false;
  }
}

function acquireLock() {
  if (fs.existsSync(lockFilePath)) {
    try {
      const content = fs.readFileSync(lockFilePath, 'utf8').trim();
      const existingPid = parseInt(content, 10);
      if (!Number.isNaN(existingPid) && isProcessAlive(existingPid)) {
        throw new Error(
          `\n================================================================================\n` +
          `[assayer] CONCURRENCY GUARD: Another specimen test run is currently active (PID: ${existingPid}).\n` +
          `Running multiple specimen test suites concurrently spawns nested Jest runners and TypeScript\n` +
          `compilers across worker pools, which will exhaust system RAM and freeze the machine.\n` +
          `Please wait for PID ${existingPid} to finish, or terminate it before starting a new run.\n` +
          `================================================================================\n`
        );
      }
    } catch (err) {
      if (err.message.includes('CONCURRENCY GUARD')) {
        throw err;
      }
    }
  }

  fs.writeFileSync(lockFilePath, String(process.pid), 'utf8');

  const release = () => {
    try {
      if (fs.existsSync(lockFilePath)) {
        const content = fs.readFileSync(lockFilePath, 'utf8').trim();
        if (content === String(process.pid)) {
          fs.unlinkSync(lockFilePath);
        }
      }
    } catch (_) {}
  };

  process.on('exit', release);
  process.on('SIGINT', () => {
    release();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    release();
    process.exit(143);
  });
}

function releaseLock() {
  try {
    if (fs.existsSync(lockFilePath)) {
      const content = fs.readFileSync(lockFilePath, 'utf8').trim();
      if (content === String(process.pid)) {
        fs.unlinkSync(lockFilePath);
      }
    }
  } catch (_) {}
}

module.exports = { acquireLock, releaseLock, lockFilePath };
