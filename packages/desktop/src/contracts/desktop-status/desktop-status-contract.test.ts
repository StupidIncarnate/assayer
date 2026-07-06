import { desktopStatusContract } from './desktop-status-contract';
import { DesktopStatusStub } from './desktop-status.stub';

describe('desktopStatusContract', () => {
  describe('valid desktop status', () => {
    it('VALID: {version, message, repoPath} => parses successfully', () => {
      const status = DesktopStatusStub();

      const result = desktopStatusContract.parse(status);

      expect(result).toStrictEqual({
        version: '1.0.0',
        message: 'Assayer core online',
        repoPath: '/home/user/project',
      });
    });
  });

  describe('invalid desktop status', () => {
    it('INVALID: {missing repoPath} => throws validation error', () => {
      expect(() => {
        return desktopStatusContract.parse({ version: '1.0.0', message: 'Assayer core online' });
      }).toThrow(/Required/u);
    });
  });
});
