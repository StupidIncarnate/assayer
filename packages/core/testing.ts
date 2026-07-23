/**
 * PURPOSE: Barrel export for @assayer/core test proxies — consumed by other packages' proxies
 *   (via `@assayer/core/testing`) so they can compose core's broker proxies in tests: status +
 *   docs, the CLI-facing precheck/compile brokers (config find/generate/load/validate/hash/
 *   save-stable, git detect-stable, manifest load/trash, compile run), and the serve-time
 *   cross-file predicate compose proxy plus the ts-morph walk proxy the desktop re-parses through.
 *
 * USAGE:
 * import { compileRunBrokerProxy, composeCrossFilePredicatesBrokerProxy } from '@assayer/core/testing';
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
export * from './src/brokers/compile/resolve-root/compile-resolve-root-broker.proxy';

export * from './src/brokers/run/paths/run-paths-broker.proxy';
export * from './src/brokers/run/load/run-load-broker.proxy';
export * from './src/brokers/run/find/run-find-broker.proxy';

export * from './src/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker.proxy';
export * from './src/brokers/stub/realize/stub-realize-broker.proxy';
export * from './src/brokers/stub-overlay/load/stub-overlay-load-broker.proxy';
export * from './src/adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.proxy';
