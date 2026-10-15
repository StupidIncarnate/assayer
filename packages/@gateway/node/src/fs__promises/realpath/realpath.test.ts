import { realpath } from './realpath';
import { realpathProxy } from './realpath.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('realpath', () => {
  describe('successful reads', () => {
    it('VALID: {path: a chain of symlinks} => returns the fully resolved path', async () => {
      const proxy = realpathProxy();
      proxy.returns({
        path: '/repo/.pokayoke-assets/siegelense-assets',
        resolved: '/home/user/.ls-pokayoke/siegelense',
      });

      const result = await realpath('/repo/.pokayoke-assets/siegelense-assets');

      expect(result).toBe('/home/user/.ls-pokayoke/siegelense');
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = realpathProxy();
      proxy.missing({ path: '/repo/missing' });

      await expect(realpath('/repo/missing')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = realpathProxy();
      proxy.denied({ path: '/repo/locked' });

      await expect(realpath('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = realpathProxy();
      proxy.notADirectory({ path: '/repo/.pokayoke.json/nested' });

      await expect(realpath('/repo/.pokayoke.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.pokayoke.json/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = realpathProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('siegelense-assets'),
        resolved: '/home/user/.ls-pokayoke/siegelense',
      });

      const result = await realpath('/resolved/at/runtime/siegelense-assets');

      expect(result).toBe('/home/user/.ls-pokayoke/siegelense');
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = realpathProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      await expect(realpath('/resolved/at/runtime/missing')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = realpathProxy();
      proxy.returns({
        path: '/repo/.pokayoke-assets/siegelense-assets',
        resolved: '/home/user/.ls-pokayoke/siegelense',
      });

      await realpath('/repo/.pokayoke-assets/siegelense-assets');

      expect(
        proxy.getCallsFor({ path: '/repo/.pokayoke-assets/siegelense-assets' }),
      ).toStrictEqual([['/repo/.pokayoke-assets/siegelense-assets']]);
    });
  });
});
