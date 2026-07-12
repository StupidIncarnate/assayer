#!/usr/bin/env node

/**
 * PURPOSE: assayer CLI entry point. Parses argv, awaits StartAssayer's routed output, and writes
 *   it to stdout. Failures (a malformed config, compile errors, an unknown docs topic) surface as
 *   an exact-output CliExactOutputError whose message is written VERBATIM to stderr — no 'Error: '
 *   prefix — followed by exit code 1, so an LLM sees the exact product-surface text.
 *
 * USAGE:
 * assayer status
 * assayer docs overview
 * assayer                 # (no command) opens the desktop app scoped to the current repo
 */

import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { StartAssayer } from '../src/startup/start-assayer';

const COMMAND_ARG_START_INDEX = 2;

if (require.main === module) {
  // Dispatch asynchronously: StartAssayer routes through the precheck, which is async. Wrapping in
  // Promise.resolve keeps this await lint-clean whether StartAssayer resolves synchronously or
  // returns a promise; the trailing .catch is the single error boundary for both synchronous
  // throws and async rejections — writing the message VERBATIM (no 'Error: ' prefix) then exit 1.
  (async (): Promise<void> => {
    const output = await Promise.resolve(
      StartAssayer({
        argv: process.argv.slice(COMMAND_ARG_START_INDEX),
        repoPath: processCwdAdapter(),
      }),
    );
    process.stdout.write(`${output}\n`);
  })().catch((error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
