import { spawnFireAndForget } from './spawn-fire-and-forget';
import { spawnFireAndForgetProxy } from './spawn-fire-and-forget.proxy';
import { SpawnNotFoundRecordedErrorStub } from './spawn-not-found-recorded-error.stub';

describe('spawnFireAndForget()', () => {
  describe('a program that starts', () => {
    it('VALID: {command, args} => spawns detached with every stdio stream ignored', () => {
      const proxy = spawnFireAndForgetProxy();
      proxy.setupLaunch({ command: '/usr/bin/electron', args: ['main.js', '--repo', '/repo'] });

      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js', '--repo', '/repo'],
        onStartFailure: () => undefined,
      });

      expect(proxy.getCallsFor({ command: '/usr/bin/electron' })).toStrictEqual([
        ['/usr/bin/electron', ['main.js', '--repo', '/repo'], { detached: true, stdio: 'ignore' }],
      ]);
    });

    it('VALID: {command, args} => unrefs the child once, so the parent can exit while it runs', () => {
      const proxy = spawnFireAndForgetProxy();
      proxy.setupLaunch({ command: '/usr/bin/electron', args: ['main.js'] });

      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js'],
        onStartFailure: () => undefined,
      });

      expect(proxy.getUnrefCountFor({ command: '/usr/bin/electron' })).toBe(1);
    });

    it('VALID: {a program that starts} => onStartFailure never fires', async () => {
      const proxy = spawnFireAndForgetProxy();
      proxy.setupLaunch({ command: '/usr/bin/electron', args: ['main.js'] });
      const failures: Error[] = [];

      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js'],
        onStartFailure: (error) => {
          failures.push(error);
        },
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {one command, two arg lists} => each launch answers its own stage and reads back apart', () => {
      const proxy = spawnFireAndForgetProxy();
      proxy.setupLaunch({ command: '/usr/bin/electron', args: ['main.js', '--repo', '/repo-a'] });
      proxy.setupLaunch({ command: '/usr/bin/electron', args: ['main.js', '--repo', '/repo-b'] });

      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js', '--repo', '/repo-a'],
        onStartFailure: () => undefined,
      });
      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js', '--repo', '/repo-b'],
        onStartFailure: () => undefined,
      });

      expect(proxy.getCallsFor({ command: '/usr/bin/electron' }).map((call) => call[1])).toStrictEqual(
        [
          ['main.js', '--repo', '/repo-a'],
          ['main.js', '--repo', '/repo-b'],
        ],
      );
    });
  });

  describe('a program that never starts', () => {
    it("ERROR: {missing program} => hands Node's ENOENT error to onStartFailure instead of crashing", async () => {
      const proxy = spawnFireAndForgetProxy();
      proxy.setupNotFound({ command: '/usr/bin/electron', args: ['main.js'] });
      const failures: Error[] = [];

      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js'],
        onStartFailure: (error) => {
          failures.push(error);
        },
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(failures).toStrictEqual([
        SpawnNotFoundRecordedErrorStub({ command: '/usr/bin/electron', args: ['main.js'] }),
      ]);
      expect(failures.map((error) => error.message)).toStrictEqual([
        'spawn /usr/bin/electron ENOENT',
      ]);
    });

    it('ERROR: {missing program} => still unrefs the child', () => {
      const proxy = spawnFireAndForgetProxy();
      proxy.setupNotFound({ command: '/usr/bin/electron', args: ['main.js'] });

      spawnFireAndForget({
        command: '/usr/bin/electron',
        args: ['main.js'],
        onStartFailure: () => undefined,
      });

      expect(proxy.getUnrefCountFor({ command: '/usr/bin/electron' })).toBe(1);
    });
  });

  describe('reading back', () => {
    it('EMPTY: {nothing launched} => getCallsFor and getUnrefCountFor read back nothing', () => {
      const proxy = spawnFireAndForgetProxy();

      expect({
        calls: proxy.getCallsFor({ command: '/usr/bin/electron' }),
        unrefs: proxy.getUnrefCountFor({ command: '/usr/bin/electron' }),
      }).toStrictEqual({ calls: [], unrefs: 0 });
    });
  });
});
