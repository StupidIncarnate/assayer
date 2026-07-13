/**
 * PURPOSE: Drives the CLI precheck flow end-to-end against the REAL built binary
 *   (packages/cli/dist/bin/assayer.js). Owns a fresh, hermetic temp working directory OUTSIDE the
 *   repo per test (created in beforeEach, removed in afterEach) so config-lookup walks up to
 *   nothing. A test seeds an assayer.config.json / source files / a corrupt cache, then spawns the
 *   CLI as a child process with that dir as cwd and captures its stdout, stderr, and exit code.
 *   Owns all node:fs / node:child_process access so the colocated .integration.test.ts imports only
 *   this harness + stubs. Requires `tsc --build tsconfig.build.json` first so dist/bin/assayer.js
 *   exists.
 *
 * USAGE:
 * const cli = assayerCliHarness();
 * // beforeEach makes a fresh temp cwd; afterEach removes it (auto-wired by the harness transformer)
 * cli.writeConfig({ json: '{"repoRoot":"./src","exclude":[]}' });
 * cli.writeSource({ relPath: 'src/sample.ts', source: 'export const x = 1;\n' });
 * const result = await cli.run({ argv: ['status'] });
 * // result.exitCode === 0; result.stdout ends with the status block
 */
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';

import { CliRunResultStub } from '../../src/contracts/cli-run-result/cli-run-result.stub';
import type { CliRunResult } from '../../src/contracts/cli-run-result/cli-run-result-contract';
import { CliFileTextStub } from '../../src/contracts/cli-file-text/cli-file-text.stub';
import type { CliFileText } from '../../src/contracts/cli-file-text/cli-file-text-contract';

const cliEntry = join(__dirname, '..', '..', 'dist', 'bin', 'assayer.js');

export const assayerCliHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  writeConfig: ({ json }: { json: string }) => void;
  writeSource: ({ relPath, source }: { relPath: string; source: string }) => void;
  writeCacheFile: ({ relPath, contents }: { relPath: string; contents: string }) => void;
  run: ({ argv }: { argv: readonly string[] }) => Promise<CliRunResult>;
  exists: ({ relPath }: { relPath: string }) => boolean;
  read: ({ relPath }: { relPath: string }) => CliFileText;
} => {
  let dir = '';

  return {
    beforeEach: (): void => {
      dir = mkdtempSync(join(tmpdir(), 'assayer-cli-'));
    },
    afterEach: (): void => {
      rmSync(dir, { recursive: true, force: true });
    },
    writeConfig: ({ json }: { json: string }): void => {
      writeFileSync(join(dir, 'assayer.config.json'), json);
    },
    writeSource: ({ relPath, source }: { relPath: string; source: string }): void => {
      const target = join(dir, relPath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, source);
    },
    writeCacheFile: ({ relPath, contents }: { relPath: string; contents: string }): void => {
      const target = join(dir, relPath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, contents);
    },
    run: async ({ argv }: { argv: readonly string[] }): Promise<CliRunResult> =>
      new Promise((resolve: (result: CliRunResult) => void, reject: (error: Error) => void) => {
        const child = spawn(process.execPath, [cliEntry, ...argv], {
          cwd: dir,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
          stdout += String(chunk);
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderr += String(chunk);
        });
        child.on('error', reject);
        child.on('close', (code: number | null) => {
          resolve(CliRunResultStub({ stdout, stderr, exitCode: code ?? 0 }));
        });
      }),
    exists: ({ relPath }: { relPath: string }): boolean => existsSync(join(dir, relPath)),
    read: ({ relPath }: { relPath: string }): CliFileText =>
      CliFileTextStub({ value: readFileSync(join(dir, relPath), 'utf8') }),
  };
};
