const { acquireLock } = require('./concurrency-lock');

module.exports = async function globalSetup() {
  acquireLock();
};
