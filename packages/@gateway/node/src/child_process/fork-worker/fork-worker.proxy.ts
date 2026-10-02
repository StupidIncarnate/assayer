import { fork, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// `ChildProcess.channel` and `ChildProcess.stderr` are declared readonly, so the fake keeps its own
// writable members and is cast to `ChildProcess` only on the way out.
interface MockWorker extends EventEmitter {
  stderr: Readable | null;
  channel?: { ref: () => void; unref: () => void } | null;
  ref: () => void;
  unref: () => void;
  send: ChildProcess['send'];
}

// `fork(modulePath, args, options)` is the real call, addressed by the module path. A staged worker
// answers each `{ id, message }` it is sent the way the scenario says. The pool inside `forkWorker`
// lives for the whole test file, so each test forks its own module path.
export const forkWorkerProxy = (): {
  repliesWith: (params: { modulePath: string; reply: unknown }) => void;
  // Each forked worker answers its one request with `answer(message)` and then exits cleanly, so the
  // pool holds no worker between requests and every request reaches this test's own staging. A caller's
  // proxy uses it when one test file runs many tests against one module path.
  answersThenExits: (params: { modulePath: string; answer: (message: unknown) => unknown }) => void;
  exitsBeforeReplying: (params: {
    modulePath: string;
    code: number | null;
    signal: NodeJS.Signals | null;
    stderr: string;
  }) => void;
  getForkCalls: (params: { modulePath: string }) => RecordedCalls;
  getSentMessages: (params: { modulePath: string }) => readonly unknown[];
  getRefCount: (params: { modulePath: string }) => { ref: number; unref: number };
} => {
  const handle = registerMock({ fn: fork });
  const sentByModule = new Map<string, unknown[]>();
  const refsByModule = new Map<string, { ref: number; unref: number }>();

  const buildWorker = ({
    modulePath,
    answer,
  }: {
    modulePath: string;
    answer: (params: { worker: MockWorker; id: number; message: unknown }) => void;
  }): ChildProcess => {
    const sent: unknown[] = [];
    const refs = { ref: 0, unref: 0 };
    sentByModule.set(modulePath, sent);
    refsByModule.set(modulePath, refs);
    const worker = new EventEmitter() as MockWorker;
    worker.stderr = new Readable({
      read(): void {
        /* noop */
      },
    });
    worker.channel = {
      ref: (): void => {
        refs.ref += 1;
      },
      unref: (): void => {
        refs.unref += 1;
      },
    };
    worker.ref = (): void => {
      refs.ref += 1;
    };
    worker.unref = (): void => {
      refs.unref += 1;
    };
    worker.send = ((envelope: { id: number; message: unknown }): boolean => {
      sent.push(envelope.message);
      setImmediate(() => {
        answer({ worker, id: envelope.id, message: envelope.message });
      });
      return true;
    }) as ChildProcess['send'];
    return worker as ChildProcess;
  };

  return {
    repliesWith: ({ modulePath, reply }): void => {
      handle.calledWith([modulePath]).implement(() =>
        buildWorker({
          modulePath,
          answer: ({ worker, id }): void => {
            worker.emit('message', { id, reply });
          },
        }),
      );
    },
    answersThenExits: ({ modulePath, answer }): void => {
      handle.calledWith([modulePath]).implement(() =>
        buildWorker({
          modulePath,
          answer: ({ worker, id, message }): void => {
            worker.emit('message', { id, reply: answer(message) });
            worker.emit('exit', 0, null);
          },
        }),
      );
    },
    exitsBeforeReplying: ({ modulePath, code, signal, stderr }): void => {
      handle.calledWith([modulePath]).implement(() =>
        buildWorker({
          modulePath,
          answer: ({ worker }): void => {
            worker.stderr?.emit('data', Buffer.from(stderr));
            worker.emit('exit', code, signal);
          },
        }),
      );
    },
    getForkCalls: ({ modulePath }): RecordedCalls => handle.callsMatching([modulePath]),
    getSentMessages: ({ modulePath }): readonly unknown[] => sentByModule.get(modulePath) ?? [],
    getRefCount: ({ modulePath }): { ref: number; unref: number } =>
      refsByModule.get(modulePath) ?? { ref: 0, unref: 0 },
  };
};
