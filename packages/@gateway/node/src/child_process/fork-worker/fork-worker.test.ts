import { forkWorker } from './fork-worker';
import { forkWorkerProxy } from './fork-worker.proxy';

describe('forkWorker()', () => {
  describe('request()', () => {
    it('VALID: {worker replies} => resolves with the reply and sends the message wrapped with its id', async () => {
      const proxy = forkWorkerProxy();
      proxy.repliesWith({ modulePath: '/core/replies.js', reply: { success: true } });

      const reply = await forkWorker({ modulePath: '/core/replies.js', execArgv: ['--flag'] }).request({
        message: { config: '{}' },
      });

      expect(reply).toStrictEqual({ success: true });
      expect(proxy.getSentMessages({ modulePath: '/core/replies.js' })).toStrictEqual([{ config: '{}' }]);
    });

    it('VALID: {fork call} => forks the module once with its flags, stdout ignored and stderr kept', async () => {
      const proxy = forkWorkerProxy();
      proxy.repliesWith({ modulePath: '/core/flags.js', reply: 'done' });

      await forkWorker({ modulePath: '/core/flags.js', execArgv: ['--experimental-vm-modules'] }).request({
        message: 'go',
      });

      expect(proxy.getForkCalls({ modulePath: '/core/flags.js' })).toStrictEqual([
        [
          '/core/flags.js',
          [],
          { execArgv: ['--experimental-vm-modules'], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] },
        ],
      ]);
    });

    it('VALID: {same module and flags asked for twice} => reuses the one live worker', async () => {
      const proxy = forkWorkerProxy();
      proxy.repliesWith({ modulePath: '/core/reused.js', reply: 'ok' });

      await forkWorker({ modulePath: '/core/reused.js', execArgv: [] }).request({ message: 'first' });
      await forkWorker({ modulePath: '/core/reused.js', execArgv: [] }).request({ message: 'second' });

      expect(proxy.getForkCalls({ modulePath: '/core/reused.js' })).toStrictEqual([
        ['/core/reused.js', [], { execArgv: [], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }],
      ]);
      expect(proxy.getSentMessages({ modulePath: '/core/reused.js' })).toStrictEqual(['first', 'second']);
    });

    it('VALID: {one request answered} => holds the caller only while the reply is owed', async () => {
      const proxy = forkWorkerProxy();
      proxy.repliesWith({ modulePath: '/core/held.js', reply: 'ok' });

      await forkWorker({ modulePath: '/core/held.js', execArgv: [] }).request({ message: 'go' });

      // Released once at fork, held once for the request, and released again when the reply lands. The
      // process handle and its IPC channel each count once.
      expect(proxy.getRefCount({ modulePath: '/core/held.js' })).toStrictEqual({ ref: 2, unref: 4 });
    });

    it('VALID: {worker answers each message and then exits} => each request gets its own answer from a fresh worker', async () => {
      const proxy = forkWorkerProxy();
      proxy.answersThenExits({ modulePath: '/core/answers.js', answer: (message) => ({ echoed: message }) });

      const first = await forkWorker({ modulePath: '/core/answers.js', execArgv: [] }).request({ message: 'one' });
      const second = await forkWorker({ modulePath: '/core/answers.js', execArgv: [] }).request({ message: 'two' });

      expect({ first, second, forks: proxy.getForkCalls({ modulePath: '/core/answers.js' }).length }).toStrictEqual({
        first: { echoed: 'one' },
        second: { echoed: 'two' },
        forks: 2,
      });
    });

    it('ERROR: {worker exits before replying} => rejects with its exit code, signal and stderr', async () => {
      const proxy = forkWorkerProxy();
      proxy.exitsBeforeReplying({
        modulePath: '/core/dies.js',
        code: 1,
        signal: null,
        stderr: 'Error: Cannot find module @jest/core\n',
      });

      await expect(forkWorker({ modulePath: '/core/dies.js', execArgv: [] }).request({ message: 'go' })).rejects.toThrow(
        /^\[child_process\/forkWorker\] the worker \/core\/dies\.js exited with code 1 and signal null before it replied\.\nIts stderr:\nError: Cannot find module @jest\/core$/u,
      );
    });

    it('ERROR: {worker died} => the next call forks a fresh worker', async () => {
      const proxy = forkWorkerProxy();
      proxy.exitsBeforeReplying({ modulePath: '/core/again.js', code: null, signal: 'SIGKILL', stderr: '' });

      await expect(forkWorker({ modulePath: '/core/again.js', execArgv: [] }).request({ message: 'one' })).rejects.toThrow(
        /^\[child_process\/forkWorker\] the worker \/core\/again\.js exited with code null and signal SIGKILL before it replied\.$/u,
      );
      await expect(forkWorker({ modulePath: '/core/again.js', execArgv: [] }).request({ message: 'two' })).rejects.toThrow(
        /^\[child_process\/forkWorker\] the worker \/core\/again\.js exited with code null and signal SIGKILL before it replied\.$/u,
      );

      expect(proxy.getForkCalls({ modulePath: '/core/again.js' })).toStrictEqual([
        ['/core/again.js', [], { execArgv: [], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }],
        ['/core/again.js', [], { execArgv: [], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] }],
      ]);
    });
  });
});
