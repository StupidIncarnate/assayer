/**
 * PURPOSE: Finds the tsconfig that owns one source file, the way tsserver does, and returns its compiler options.
 *   Every answer comes from TypeScript's own parser: the nearest `tsconfig.json` above the file owns it when its
 *   parsed file list holds the file; a solution config hands the question to its project references; a config
 *   that does not own the file is passed over and the search goes on above it; `extends` chains arrive merged.
 *   A file no config owns gets `{}`, which is TypeScript's defaults.
 *
 *   Reach for this whenever a question is about ONE file: how to analyse it, how to resolve its imports, or which
 *   module format it runs in. A file can sit under a config that does not own it, such as a test file its package
 *   config excludes, and then the nearest config's options are the wrong answer.
 *
 * USAGE:
 * tsconfigOwnerBroker({ absPath: '/repo/packages/app/src/main.ts' });
 * // Returns { configFilePath: '/repo/packages/app/tsconfig.json', options: { strict: true } }, or { options: {} }
 */
import { dirname } from '#gateway/node/path';
import type { CompilerOptions } from '#gateway/npm/typescript';

import { climbOwnerLayerBroker } from './climb-owner-layer-broker';

export const tsconfigOwnerBroker = ({
  absPath,
}: {
  absPath: string;
}): { configFilePath?: string; options: CompilerOptions } =>
  climbOwnerLayerBroker({ absPath, searchPath: dirname(absPath) }) ?? { options: {} };
