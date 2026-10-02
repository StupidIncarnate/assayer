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

export * from './status/get/status-get-broker';
export * from './docs/get/docs-get-broker';

export * from './config/find/config-find-broker';
export * from './config/generate/config-generate-broker';
export * from './config/load/config-load-broker';
export * from './config/validate/config-validate-broker';
export * from './config/hash/config-hash-broker';
export * from './config/stable-branch-save/config-stable-branch-save-broker';

export * from './analyzer/hash/analyzer-hash-broker';

export * from './git/detect-stable-branch/git-detect-stable-branch-broker';

export * from './manifest/load/manifest-load-broker';
export * from './manifest/trash/manifest-trash-broker';

export * from './compile/run/compile-run-broker';
export * from './compile/resolve-root/compile-resolve-root-broker';

export * from './run/unit/run-unit-broker';
export * from './run/paths/run-paths-broker';
export * from './run/load/run-load-broker';
export * from './run/id/run-id-broker';
export * from './run/find/run-find-broker';
export * from './run/console-save/run-console-save-broker';
export * from './run/console-find/run-console-find-broker';

export * from './file/walk/file-walk-broker';

export * from './param-type/resolve/param-type-resolve-broker';

export * from './compose/cross-file-predicates/compose-cross-file-predicates-broker';
export * from './compose/cross-file-map/compose-cross-file-map-broker';

export * from './stub/realize/stub-realize-broker';
export * from './stub-overlay/load/stub-overlay-load-broker';

export * from './harness/realize/harness-realize-broker';

export * from './probe-runtime/create/probe-runtime-create-broker';
export * from './case/interpret/case-interpret-broker';
