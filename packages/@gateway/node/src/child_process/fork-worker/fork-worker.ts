/**
 * PURPOSE: Hands back the one live worker process for a Node module and its flags, forking it on first
 * use, and lets a caller send it requests and await each reply. Reach for this over `run` when many
 * requests should share one warm process, so its start-up cost and its in-memory caches are paid once
 * per process instead of once per request.
 *
 * The worker is forked with `process.execPath`, so it runs on the same Node the caller runs on. Under
 * Electron with `ELECTRON_RUN_AS_NODE`, that is Electron's Node, and the inherited environment keeps
 * the worker in Node mode too. `execArgv` carries Node flags, such as `--experimental-vm-modules`, that
 * only a process's own command line can turn on.
 *
 * The wire format is `{ id, message }` out and `{ id, reply }` back. The id pairs each reply with its
 * request, so concurrent requests cannot swap answers. The worker module must answer in that shape.
 *
 * `closeForkWorkers` stops every pooled worker, for a caller that must leave none running.
 *
 * The worker never keeps the caller's process alive on its own. It holds the caller's event loop only
 * while a request is waiting for its reply, and the worker exits when the caller's process ends and
 * its IPC channel disconnects.
 *
 * Its stdout is ignored and its stderr is kept, so a worker that dies mid-request rejects every
 * waiting request with its exit code, its signal and what it printed to stderr. The dead worker leaves
 * the pool, and the next call forks a fresh one.
 *
 * USAGE:
 * const worker = forkWorker({ modulePath: '/core/run-jest.js', execArgv: ['--experimental-vm-modules'] });
 * await worker.request({ message: { config: '{}' } });
 * // Returns the worker's reply to that one message
 */

import { fork } from 'child_process';
import { Socket } from 'net';

import { forkWorkerPool } from './fork-worker-pool';

export const forkWorker = ({
  modulePath,
  execArgv,
}: {
  modulePath: string;
  execArgv: string[];
}): { request: (params: { message: unknown }) => Promise<unknown>; close: () => Promise<void> } => {
  const key = JSON.stringify([modulePath, execArgv]);
  const live = forkWorkerPool.get(key);

  if (live !== undefined) {
    return live;
  }

  const child = fork(modulePath, [], { execArgv, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  const waiting = new Map<number, { resolve: (reply: unknown) => void; reject: (error: Error) => void }>();
  const stderrChunks: Buffer[] = [];
  const ids = { next: 0 };

  child.stderr?.on('data', (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });

  child.on('message', (envelope: { id: number; reply: unknown }) => {
    const entry = waiting.get(envelope.id);
    waiting.delete(envelope.id);
    // Held only while a reply is owed, so an idle worker never stops the caller's process from exiting.
    // The stderr pipe is a handle of its own, so it is released too.
    if (waiting.size === 0) {
      child.unref();
      child.channel?.unref();
      if (child.stderr instanceof Socket) {
        child.stderr.unref();
      }
    }
    entry?.resolve(envelope.reply);
  });

  // `exit` and `error` both end the worker. Each rejects whatever is still waiting, and drops the worker
  // from the pool so the next call forks a fresh one.
  child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
    forkWorkerPool.delete(key);
    const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
    const error = new Error(
      `[child_process/forkWorker] the worker ${modulePath} exited with code ${String(code)} and signal ` +
        `${String(signal)} before it replied.${stderr === '' ? '' : `\nIts stderr:\n${stderr}`}`,
    );
    const owed = [...waiting.values()];
    waiting.clear();
    owed.forEach((entry) => {
      entry.reject(error);
    });
  });

  child.on('error', (failure: Error) => {
    forkWorkerPool.delete(key);
    const error = new Error(`[child_process/forkWorker] the worker ${modulePath} failed: ${failure.message}`);
    const owed = [...waiting.values()];
    waiting.clear();
    owed.forEach((entry) => {
      entry.reject(error);
    });
  });

  child.unref();
  child.channel?.unref();
  if (child.stderr instanceof Socket) {
    child.stderr.unref();
  }

  const worker = {
    request: async ({ message }: { message: unknown }): Promise<unknown> =>
      new Promise((resolve, reject) => {
        ids.next += 1;
        waiting.set(ids.next, { resolve, reject });
        child.ref();
        child.channel?.ref();
        if (child.stderr instanceof Socket) {
          child.stderr.ref();
        }
        child.send({ id: ids.next, message });
      }),
    // SIGKILL, because the worker holds nothing that needs a clean shutdown. The promise settles on
    // the `exit` event, which also drops the worker from the pool.
    close: async (): Promise<void> =>
      new Promise((resolve) => {
        child.once('exit', () => {
          resolve();
        });
        child.kill('SIGKILL');
      }),
  };

  forkWorkerPool.set(key, worker);

  return worker;
};
