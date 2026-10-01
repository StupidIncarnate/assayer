import { runFindBrokerProxy } from '@assayer/core/brokers/run/find/run-find-broker.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { join } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';
import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';
import type { RunResult } from '@assayer/shared/contracts';

export const runExecuteBrokerProxy = (): {
  savedRun: (params: { repoPath: string; relPath: string; harnessPath: string; runId: string; run: RunResult }) => void;
  noArtifact: (params: { repoPath: string; relPath: string; harnessPath: string; runId: string; stderr: string }) => void;
  cliNotBuilt: () => void;
  runSucceeds: (params: { repoPath: string; relPath: string; harnessPath: string; runId: string }) => void;
  getSpawnArgs: () => readonly string[][];
  getSpawnOptions: () => readonly { cwd: string; env: Record<string, string>; stdio: readonly unknown[] }[];
} => {
  execPathProxy();
  const findProxy = runFindBrokerProxy();
  const findUp = findUpSyncProxy();
  const runGateway = runProxy();

  const entry = join('packages', 'cli', 'dist', 'bin', 'assayer.js');
  const cliEntry = join(__dirname, entry);
  const segments = __dirname.split('/').filter((segment) => segment !== '');
  // The run lookup reads this source and then looks for its colocated harness at harnessPath.
  const source = 'export const a = 1;\n';

  return {
    savedRun: ({ repoPath, relPath, harnessPath, runId, run }): void => {
      findProxy.savedRun({
        sourcePath: `${repoPath}/${relPath}`,
        harnessPath,
        source,
        configDir: repoPath,
        runId,
        run,
      });
      // This directory sits inside the monorepo, so the CLI entry is found on the walk's first step.
      findUp.foundAt({ path: cliEntry });
      runGateway.setupSuccess({
        command: execPath,
        args: [cliEntry, 'unit', relPath],
        cwd: repoPath,
        exitCode: 0,
        stdout: 'src/a.ts  1/1 passed',
        stderr: '',
      });
    },
    noArtifact: ({ repoPath, relPath, harnessPath, runId, stderr }): void => {
      findProxy.neverRun({
        sourcePath: `${repoPath}/${relPath}`,
        harnessPath,
        source,
        configDir: repoPath,
        runId,
      });
      // This directory sits inside the monorepo, so the CLI entry is found on the walk's first step.
      findUp.foundAt({ path: cliEntry });
      runGateway.setupSuccess({
        command: execPath,
        args: [cliEntry, 'unit', relPath],
        cwd: repoPath,
        exitCode: 1,
        stdout: '',
        stderr,
      });
    },
    cliNotBuilt: (): void => {
      // The walk visits every ancestor of this directory, root included, so each candidate is staged.
      Array.from({ length: segments.length + 1 }, (_, depth) =>
        join('/', ...segments.slice(0, depth), entry),
      ).forEach((path) => {
        findUp.notFound({ path });
      });
    },
    runSucceeds: ({ repoPath, relPath, harnessPath, runId }): void => {
      findProxy.savedRun({
        sourcePath: `${repoPath}/${relPath}`,
        harnessPath,
        source,
        configDir: repoPath,
        runId,
        run: RunResultStub(),
      });
      // This directory sits inside the monorepo, so the CLI entry is found on the walk's first step.
      findUp.foundAt({ path: cliEntry });
      runGateway.setupSuccess({
        command: execPath,
        args: [cliEntry, 'unit', relPath],
        cwd: repoPath,
        exitCode: 0,
        stdout: 'src/a.ts  1/1 passed',
        stderr: '',
      });
    },
    getSpawnArgs: (): readonly string[][] => runGateway.getCallsFor({ command: execPath }),
    getSpawnOptions: () => runGateway.getOptionsFor({ command: execPath }),
  };
};
