/**
 * PURPOSE: Runs the BUILT assayer CLI compile (via a non-exempt subcommand, which triggers the
 *   precheck compile) against this repo — whose assayer.config.json resolves repoRoot to
 *   ./smoke-repo — and resolves with the child process exit code. Snapshots the committed
 *   assayer.config.json bytes before spawning and restores them verbatim once the child closes,
 *   on BOTH the success and error paths, so the precheck's obs-stable-saved mutation (writing
 *   version + stableBranch back into the config) never leaves the working tree dirty. Pairs with
 *   electronAppHarness to form the app's e2e harness infra. Requires `npm run build` first.
 *
 * USAGE:
 * const compileHarness = assayerCompileHarness();
 * const exitCode = await compileHarness.compile();
 * // exitCode === 0 when the compile precheck passed; assayer.config.json is left byte-identical
 */
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { ExitCodeStub } from '../../src/contracts/exit-code/exit-code.stub';
import type { ExitCode } from '../../src/contracts/exit-code/exit-code-contract';

const cliEntry = join(__dirname, '..', '..', '..', 'cli', 'dist', 'bin', 'assayer.js');
const repoRoot = join(__dirname, '..', '..', '..', '..');
const configPath = join(repoRoot, 'assayer.config.json');

export const assayerCompileHarness = (): { compile: () => Promise<ExitCode> } => ({
  compile: async (): Promise<ExitCode> => {
    const originalConfig = readFileSync(configPath);
    return new Promise<ExitCode>((resolve, reject) => {
      const child = spawn(process.execPath, [cliEntry, 'status'], { cwd: repoRoot, stdio: 'ignore' });
      child.on('error', (error) => {
        writeFileSync(configPath, originalConfig);
        reject(error);
      });
      child.on('close', (code) => {
        writeFileSync(configPath, originalConfig);
        resolve(ExitCodeStub({ value: code ?? 0 }));
      });
    });
  },
});
