import { statusViewContract } from './status-view-contract';
import { StatusViewStub } from './status-view.stub';

describe('statusViewContract', () => {
  describe('valid status views', () => {
    it('VALID: {version, message, repoPath} => parses successfully', () => {
      const view = StatusViewStub();

      const result = statusViewContract.parse(view);

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/home/user/project',
        runMode: 'thorough',
      });
    });

    it('VALID: {repoPath override} => parses with custom repo path', () => {
      const view = StatusViewStub({ repoPath: '/tmp/other-repo' });

      const result = statusViewContract.parse(view);

      expect(result.repoPath).toBe('/tmp/other-repo');
    });

    it('VALID: {runMode: "intelligent"} => carries the display-only run mode through', () => {
      const view = StatusViewStub({ runMode: 'intelligent' });

      const result = statusViewContract.parse(view);

      expect(result.runMode).toBe('intelligent');
    });
  });

  describe('invalid status views', () => {
    it('INVALID: {missing repoPath} => throws validation error', () => {
      expect(() => {
        return statusViewContract.parse({ version: '1.0.0', message: 'Assayer core online' });
      }).toThrow(/Required/u);
    });
  });
});
