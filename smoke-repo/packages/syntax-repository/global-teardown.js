const { releaseLock } = require('./concurrency-lock');

module.exports = async function globalTeardown() {
  releaseLock();
};
