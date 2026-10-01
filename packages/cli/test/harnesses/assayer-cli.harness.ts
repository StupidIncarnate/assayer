/**
 * PURPOSE: Drives the CLI precheck flow end-to-end against the REAL CLI entry, run from source
 *   (packages/cli/bin/assayer.ts through tsx, with every workspace package resolved to its TypeScript
 *   source through the `source` export condition), so no build is needed first. Owns a fresh,
 *   hermetic temp working directory OUTSIDE the repo per test (created in beforeEach, removed in
 *   afterEach) so config-lookup walks up to nothing. A test seeds an assayer.config.json / source files / a corrupt cache, then spawns the
 *   CLI as a child process with that dir as cwd and captures its stdout, stderr, and exit code.
 *   Owns all node:fs / node:child_process access so the colocated .integration.test.ts imports only
 *   this harness + stubs.
 *
 * USAGE:
 * const cli = assayerCliHarness();
 * // beforeEach makes a fresh temp cwd; afterEach removes it (auto-wired by the harness transformer)
 * cli.writeConfig({ json: '{"repoRoot":"./src","exclude":[]}' });
 * cli.writeSource({ relPath: 'src/sample.ts', source: 'export const x = 1;\n' });
 * const result = await cli.run({ argv: ['status'] });
 * // result.exitCode === 0; result.stdout ends with the status block
 */
import { join, dirname } from '#gateway/node/path';
import { spawn } from '#gateway/node/child_process';
import { tmpdir } from '#gateway/node/os';
import {
  mkdtempSync,
  ensureDirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  rmSync,
} from '#gateway/node/fs';

import { CliRunResultStub } from '../../src/contracts/cli-run-result/cli-run-result.stub';
import type { CliRunResult } from '../../src/contracts/cli-run-result/cli-run-result-contract';
import { execPath } from '#gateway/node/process';
import { tsxLoaderUrl } from '#gateway/npm/tsx';

// `--conditions=source` resolves every workspace package to its TypeScript source, the way ward's own
// checks do. It goes on node itself, beside `--import`, because tsx's CLI would start a second
// process that does not inherit it.
const cliArgs = [
  '--conditions=source',
  '--import',
  tsxLoaderUrl(),
  join(__dirname, '..', '..', 'bin', 'assayer.ts'),
];

export const assayerCliHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  writeConfig: ({ json }: { json: string }) => void;
  writeSource: ({ relPath, source }: { relPath: string; source: string }) => void;
  writeCacheFile: ({ relPath, contents }: { relPath: string; contents: string }) => void;
  run: ({ argv }: { argv: readonly string[] }) => Promise<CliRunResult>;
  exists: ({ relPath }: { relPath: string }) => boolean;
  read: ({ relPath }: { relPath: string }) => string;
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
      ensureDirSync(dirname(target));
      writeFileSync(target, source);
    },
    writeCacheFile: ({ relPath, contents }: { relPath: string; contents: string }): void => {
      const target = join(dir, relPath);
      ensureDirSync(dirname(target));
      writeFileSync(target, contents);
    },
    run: async ({ argv }: { argv: readonly string[] }): Promise<CliRunResult> =>
      new Promise((resolve: (result: CliRunResult) => void, reject: (error: Error) => void) => {
        const child = spawn(execPath, [...cliArgs, ...argv], {
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
    read: ({ relPath }: { relPath: string }): string =>
      readFileSync(join(dir, relPath)),
  };
};
