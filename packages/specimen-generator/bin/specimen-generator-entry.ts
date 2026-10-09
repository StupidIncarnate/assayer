#!/usr/bin/env node

/**
 * PURPOSE: The generator's command-line entry. It passes the arguments and the repo root to
 * StartSpecimenGenerator, prints the answer (stdout on success, stderr on failure) and sets the exit
 * code. The repo root is found from this file's own place: bin, then the package, then `packages`,
 * then the repo.
 *
 * USAGE:
 * tsx --conditions=source packages/specimen-generator/bin/specimen-generator-entry.ts --check
 * // Prints one summary line and exits 0 when smoke-repo is current
 */

import { argv, setExitCode, stderr, stdout } from '#gateway/node/process';
import { join } from '#gateway/node/path';

import { StartSpecimenGenerator } from '../src/startup/start-specimen-generator';

const COMMAND_ARG_START_INDEX = 2;

if (require.main === module) {
  try {
    const { exitCode, output } = StartSpecimenGenerator({
      argv: argv.slice(COMMAND_ARG_START_INDEX),
      repoRoot: join(__dirname, '..', '..', '..'),
    });
    const stream = exitCode === 0 ? stdout : stderr;
    stream.write(`${output}\n`);
    setExitCode(exitCode);
  } catch (error: unknown) {
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    setExitCode(1);
  }
}
