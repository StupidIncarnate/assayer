const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  // `gateway-source` points another gateway package at its TypeScript source, which ts-jest
  // transforms, so a test here never reads that gateway's last build. Only the gateway packages'
  // `exports` carry it. `source` stays out: it would point @dungeonmaster/testing's own entry at its
  // `src/` while the base's setup file loads `dist/`, so a test would stage responses on a second
  // MSW server that never answers. `node` and `node-addons` are the Node environment's defaults.
  testEnvironmentOptions: { customExportConditions: ['gateway-source', 'node', 'node-addons'] },
};
