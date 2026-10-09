#!/usr/bin/env node

/**
 * PURPOSE: Starting point CLI entry point — replace with real command routing once you have
 * commands to dispatch.
 *
 * USAGE:
 * node dist/bin/specimen-generator-entry.js hello
 * // Runs StartSpecimenGenerator({ command: 'hello' })
 */

import { argv, exit, stderr } from '#gateway/node/process';
import { StartSpecimenGenerator } from '../src/startup/start-specimen-generator';

const COMMAND_ARG_START_INDEX = 2;

if (require.main === module) {
  const [command] = argv.slice(COMMAND_ARG_START_INDEX);

  StartSpecimenGenerator({ command }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stderr.write(`Error: ${  errorMessage  }\n`);
    exit(1);
  });
}
