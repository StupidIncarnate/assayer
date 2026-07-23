/**
 * PURPOSE: Barrel export for @assayer/core brokers — the core "seams" the CLI and the
 *   desktop main process call: status + docs, plus the CLI precheck / compile-pipeline
 *   brokers (config resolution, stable-branch detection + save, manifest load/trash, and
 *   the compile-flow entry point). Internal compile sub-brokers stay unexported.
 *
 * USAGE:
 * import { compileRunBroker, configFindBroker } from '@assayer/core/brokers';
 */

// Subpath export entry for @assayer/core/brokers

export * from './src/brokers/status/get/status-get-broker';
export * from './src/brokers/docs/get/docs-get-broker';

export * from './src/brokers/config/find/config-find-broker';
export * from './src/brokers/config/generate/config-generate-broker';
export * from './src/brokers/config/load/config-load-broker';
export * from './src/brokers/config/validate/config-validate-broker';
export * from './src/brokers/config/hash/config-hash-broker';
export * from './src/brokers/config/stable-branch-save/config-stable-branch-save-broker';

export * from './src/brokers/analyzer/hash/analyzer-hash-broker';

export * from './src/brokers/git/detect-stable-branch/git-detect-stable-branch-broker';

export * from './src/brokers/manifest/load/manifest-load-broker';
export * from './src/brokers/manifest/trash/manifest-trash-broker';

export * from './src/brokers/compile/run/compile-run-broker';
export * from './src/brokers/compile/resolve-root/compile-resolve-root-broker';

export * from './src/brokers/run/unit/run-unit-broker';
export * from './src/brokers/run/paths/run-paths-broker';
export * from './src/brokers/run/load/run-load-broker';
export * from './src/brokers/run/id/run-id-broker';
export * from './src/brokers/run/find/run-find-broker';

export * from './src/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker';

export * from './src/brokers/stub/realize/stub-realize-broker';
export * from './src/brokers/stub-overlay/load/stub-overlay-load-broker';
