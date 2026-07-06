#!/usr/bin/env node

/**
 * PURPOSE: assayer CLI entry point. Parses argv, delegates to StartAssayer, and writes the
 *   resulting output to stdout. Errors (e.g. an unknown docs topic) go to stderr with a
 *   non-zero exit code.
 *
 * USAGE:
 * assayer status
 * assayer docs overview
 * assayer                 # (no command) opens the desktop app scoped to the current repo
 */

import { StartAssayer } from '../src/startup/start-assayer';

const COMMAND_ARG_START_INDEX = 2;

if (require.main === module) {
  try {
    const output = StartAssayer({
      argv: process.argv.slice(COMMAND_ARG_START_INDEX),
      repoPath: process.env.PWD ?? '.',
    });
    process.stdout.write(`${output}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
}
