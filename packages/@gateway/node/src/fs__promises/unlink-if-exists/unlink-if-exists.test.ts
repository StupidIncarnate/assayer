import { unlinkIfExists } from './unlink-if-exists';
import { unlinkIfExistsProxy } from './unlink-if-exists.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('unlinkIfExists', () => {
  it('VALID: {path exists} => removes it and resolves', async () => {
    const proxy = unlinkIfExistsProxy();
    proxy.succeeds({ path: '/repo/.ls-lockdown-kit/boot.lock' });

    await expect(unlinkIfExists('/repo/.ls-lockdown-kit/boot.lock')).resolves.toBe(undefined);
  });

  it('EMPTY: {path already gone} => resolves without rejecting', async () => {
    const proxy = unlinkIfExistsProxy();
    proxy.missing({ path: '/repo/.ls-lockdown-kit/boot.lock' });

    await expect(unlinkIfExists('/repo/.ls-lockdown-kit/boot.lock')).resolves.toBe(undefined);
  });

  it('ERROR: {no permission to remove} => rejects with the raw EACCES error', async () => {
    const proxy = unlinkIfExistsProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/boot.lock' });
    proxy.rejects({ path: '/readonly/boot.lock', error });

    await expect(unlinkIfExists('/readonly/boot.lock')).rejects.toBe(error);
  });

  it('ERROR: {path is a directory} => rejects with the raw EISDIR error', async () => {
    const proxy = unlinkIfExistsProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/.ls-lockdown-kit' });
    proxy.rejects({ path: '/repo/.ls-lockdown-kit', error });

    await expect(unlinkIfExists('/repo/.ls-lockdown-kit')).rejects.toBe(error);
  });

  it('VALID: {two calls to the same path} => getCallsFor reads back each unlink call in order', async () => {
    const proxy = unlinkIfExistsProxy();
    proxy.succeeds({ path: '/repo/.ls-lockdown-kit/boot.lock' });

    await unlinkIfExists('/repo/.ls-lockdown-kit/boot.lock');
    await unlinkIfExists('/repo/.ls-lockdown-kit/boot.lock');

    expect(proxy.getCallsFor({ path: '/repo/.ls-lockdown-kit/boot.lock' })).toStrictEqual([
      ['/repo/.ls-lockdown-kit/boot.lock'],
      ['/repo/.ls-lockdown-kit/boot.lock'],
    ]);
  });
});
