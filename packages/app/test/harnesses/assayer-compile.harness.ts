/**
 * PURPOSE: Runs the BUILT assayer CLI compile (via a non-exempt subcommand, which triggers the
 *   precheck compile) against this repo — whose assayer.config.json resolves repoRoot to
 *   ./smoke-repo — and resolves with the child process exit code. Pairs with electronAppHarness
 *   to form the app's e2e harness infra. Requires `npm run build` first.
 *
 * USAGE:
 * const compileHarness = assayerCompileHarness();
 * const exitCode = await compileHarness.compile();
 * // exitCode === 0 when the compile precheck passed
 */
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ExitCodeStub } from '../../src/contracts/exit-code/exit-code.stub';
import type { ExitCode } from '../../src/contracts/exit-code/exit-code-contract';

const cliEntry = join(__dirname, '..', '..', '..', 'cli', 'dist', 'bin', 'assayer.js');
const repoRoot = join(__dirname, '..', '..', '..', '..');

export const assayerCompileHarness = (): { compile: () => Promise<ExitCode> } => ({
  compile: async (): Promise<ExitCode> =>
    new Promise<ExitCode>((resolve, reject) => {
      const child = spawn(process.execPath, [cliEntry, 'status'], { cwd: repoRoot, stdio: 'ignore' });
      child.on('error', reject);
      child.on('close', (code) => {
        resolve(ExitCodeStub({ value: code ?? 0 }));
      });
    }),
});
