import { gitExecAdapter } from './git-exec-adapter';
import { gitExecAdapterProxy } from './git-exec-adapter.proxy';

describe('gitExecAdapter', () => {
  describe('successful exec', () => {
    it('VALID: {args: ["rev-parse","HEAD"], cwd: "/repo"} => returns exit code 0 with captured stdout', async () => {
      const proxy = gitExecAdapterProxy();

      proxy.succeeds({ stdout: '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2\n' });

      const result = await gitExecAdapter({ args: ['rev-parse', 'HEAD'], cwd: '/repo' });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2\n',
        stderr: '',
      });
    });
  });

  describe('non-zero git exit', () => {
    it('ERROR: {args: ["status"], cwd: "/nope"} => resolves non-zero exit code with git error text on stderr instead of throwing', async () => {
      const proxy = gitExecAdapterProxy();

      proxy.fails({ exitCode: 128, stderr: 'fatal: not a git repository\n' });

      const result = await gitExecAdapter({ args: ['status'], cwd: '/nope' });

      expect(result).toStrictEqual({
        exitCode: 128,
        stdout: '',
        stderr: 'fatal: not a git repository\n',
      });
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {git binary missing, error.code: "ENOENT"} => resolves exit code 1 with empty stdout and stderr instead of throwing', async () => {
      const proxy = gitExecAdapterProxy();

      proxy.spawnFails();

      const result = await gitExecAdapter({ args: ['rev-parse', 'HEAD'], cwd: '/repo' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: '',
      });
    });
  });
});
