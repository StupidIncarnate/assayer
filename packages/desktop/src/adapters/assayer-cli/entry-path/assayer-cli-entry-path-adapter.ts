/**
 * PURPOSE: Resolves the filesystem path to the BUILT assayer CLI, by walking UP from this module to
 *   the nearest ancestor that contains it.
 *
 *   Find-up rather than a counted `../..` because this module runs from BOTH src (ts-jest) and dist,
 *   and dist's extra level silently shifts every fixed relative path — the same trap
 *   `analyzer-roots-resolve-adapter` documents.
 *
 *   Resolved by PATH rather than by importing the CLI, because that dependency cannot exist: the CLI
 *   already depends on the desktop (it launches the window), so desktop → cli would be a cycle. The
 *   desktop drives the CLI as a PROCESS, which is also the design — spawning the same binary a human
 *   would run is what keeps "run in the UI" and "run headless" from becoming two implementations.
 *
 *   Returns undefined when the CLI is not built, so the caller can say so rather than spawn nothing.
 *
 * USAGE:
 * assayerCliEntryPathAdapter();
 * // Returns the ExecutablePath to packages/cli/dist/bin/assayer.js, or undefined
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

import { filePathContract } from '@assayer/core/contracts';
import type { FilePath } from '@assayer/core/contracts';

import { executablePathContract } from '../../../contracts/executable-path/executable-path-contract';
import type { ExecutablePath } from '../../../contracts/executable-path/executable-path-contract';

const CLI_ENTRY = join('packages', 'cli', 'dist', 'bin', 'assayer.js');

export const assayerCliEntryPathAdapter = ({ from }: { from?: FilePath } = {}): ExecutablePath | undefined => {
  const dir = from === undefined ? __dirname : String(from);

  if (existsSync(join(dir, CLI_ENTRY))) {
    return executablePathContract.parse(join(dir, CLI_ENTRY));
  }

  const parent = dirname(dir);

  if (parent === dir) {
    return undefined;
  }

  return assayerCliEntryPathAdapter({ from: filePathContract.parse(parent) });
};
