/**
 * PURPOSE: Barrel export for @assayer/core test proxies — consumed by other packages' proxies
 *   (via `@assayer/core/testing`) so they can compose core's broker proxies in tests: status +
 *   docs, plus the ten CLI-facing precheck/compile brokers (config find/generate/load/validate/
 *   hash/save-stable, git detect-stable, manifest load/trash, compile run).
 *
 * USAGE:
 * import { compileRunBrokerProxy, configFindBrokerProxy } from '@assayer/core/testing';
 */

// Subpath export entry for @assayer/core/testing

export * from './src/brokers/status/get/status-get-broker.proxy';
export * from './src/brokers/docs/get/docs-get-broker.proxy';

export * from './src/brokers/config/find/config-find-broker.proxy';
export * from './src/brokers/config/generate/config-generate-broker.proxy';
export * from './src/brokers/config/load/config-load-broker.proxy';
export * from './src/brokers/config/validate/config-validate-broker.proxy';
export * from './src/brokers/config/hash/config-hash-broker.proxy';
export * from './src/brokers/config/stable-branch-save/config-stable-branch-save-broker.proxy';

export * from './src/brokers/analyzer/hash/analyzer-hash-broker.proxy';

export * from './src/brokers/git/detect-stable-branch/git-detect-stable-branch-broker.proxy';

export * from './src/brokers/manifest/load/manifest-load-broker.proxy';
export * from './src/brokers/manifest/trash/manifest-trash-broker.proxy';

export * from './src/brokers/compile/run/compile-run-broker.proxy';
