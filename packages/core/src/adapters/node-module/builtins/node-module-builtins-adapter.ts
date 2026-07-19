/**
 * PURPOSE: Lists node's builtin module names from `node:module`'s `builtinModules` — the authoritative
 *   set the resolver checks a specifier against to classify a `builtin` edge. Builtins are matched by
 *   NAME rather than by resolution because, without ambient node types loaded, `fs`/`node:fs` do not
 *   resolve to a file at all; the name list is the honest signal that a specifier is a node builtin.
 *
 * USAGE:
 * nodeModuleBuiltinsAdapter();
 * // Returns readonly PackageName[]: ['fs', 'path', 'crypto', ...]
 */
import { builtinModules } from 'node:module';

import { packageNameContract } from '@assayer/shared/contracts';
import type { PackageName } from '@assayer/shared/contracts';

export const nodeModuleBuiltinsAdapter = (): readonly PackageName[] =>
  builtinModules.map((name) => packageNameContract.parse(name));
