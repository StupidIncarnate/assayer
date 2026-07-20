/**
 * PURPOSE: Barrel export for @assayer/core adapters — the pieces the wrapped Jest runner loads from
 *   disk at test time (the probe injector and the probe runtime), which therefore need a stable
 *   built entry point rather than a deep dist path, plus the single ts-morph walk boundary the
 *   desktop re-parses a caller through when it composes cross-file predicates at serve time.
 *
 * USAGE:
 * import { jestProbeInjectAdapter, tsMorphWalkFileAdapter } from '@assayer/core/adapters';
 */

// Subpath export entry for @assayer/core/adapters

export * from './src/adapters/jest/probe-inject/jest-probe-inject-adapter';
export * from './src/adapters/jest/probe-runtime/jest-probe-runtime-adapter';
export * from './src/adapters/jest/interpret-case/jest-interpret-case-adapter';
export * from './src/adapters/jest/resolve-entry/jest-resolve-entry-adapter';

export * from './src/adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
