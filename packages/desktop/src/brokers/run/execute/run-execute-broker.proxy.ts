import { registerMock } from '@dungeonmaster/testing/register-mock';
import { runFindBroker } from '@assayer/core/brokers';
import { runFindBrokerProxy } from '@assayer/core/testing';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { findUpSyncProxy } from '#gateway/node/fs/find-up-sync/find-up-sync.proxy';
import { join } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';
import { execPathProxy } from '#gateway/node/process/exec-path/exec-path.proxy';
import { RunResultStub } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';

export const runExecuteBrokerProxy = (): {
  savedRun: (params: { repoPath: string; relPath: string; run: RunResult }) => void;
  noArtifact: (params: { repoPath: string; relPath: string; stderr: string }) => void;
  cliNotBuilt: () => void;
  runSucceeds: (params: { repoPath: string; relPath: string }) => void;
  getSpawnArgs: () => readonly string[][];
  getSpawnOptions: () => readonly { cwd: string; env: Record<string, string>; stdio: readonly unknown[] }[];
} => {
  // Bare-called for enforce-proxy-child-creation; the cross-package chain cannot intercept core's
  // I/O from here, so the direct registerMock is what drives it.
  runFindBrokerProxy();
  execPathProxy();
  const findUp = findUpSyncProxy();
  const runGateway = runProxy();
  const findHandle = registerMock({ fn: runFindBroker });

  const entry = join('packages', 'cli', 'dist', 'bin', 'assayer.js');
  const cliEntry = join(__dirname, entry);
  const segments = __dirname.split('/').filter((segment) => segment !== '');

  // Each broker call finds the run's artifact at most once, so there is no second real call either
  // handle could confuse it with — `calledWith([])` is a blanket match on purpose.
  findHandle.calledWith([]).resolves(RunResultStub());

  return {
    savedRun: ({ repoPath, relPath, run }): void => {
      findHandle.calledWith([]).resolves(run);
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
    noArtifact: ({ repoPath, relPath, stderr }): void => {
      findHandle.calledWith([]).resolves(undefined);
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
    runSucceeds: ({ repoPath, relPath }): void => {
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
