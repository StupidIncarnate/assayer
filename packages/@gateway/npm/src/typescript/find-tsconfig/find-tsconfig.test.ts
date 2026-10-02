import { findTsconfig } from './find-tsconfig';
import { findTsconfigProxy } from './find-tsconfig.proxy';

describe('findTsconfig', () => {
  it('EMPTY: {no tsconfig above the folder} => returns undefined', () => {
    const proxy = findTsconfigProxy();
    proxy.noTsconfig({ searchPath: '/repo/src' });

    expect(findTsconfig({ searchPath: '/repo/src' })).toBe(undefined);
  });

  it('VALID: {a tsconfig above the folder} => returns its path', () => {
    const proxy = findTsconfigProxy();
    proxy.tsconfigAt({ searchPath: '/repo/src', configFilePath: '/repo/tsconfig.json' });

    expect(findTsconfig({ searchPath: '/repo/src' })).toBe('/repo/tsconfig.json');
  });

  it('VALID: {a search already made} => getCallsFor reads back the search path and the config name', () => {
    const proxy = findTsconfigProxy();
    proxy.noTsconfig({ searchPath: '/repo' });

    findTsconfig({ searchPath: '/repo' });

    expect(proxy.getCallsFor({ searchPath: '/repo' }).map((call) => [call[0], call[2]])).toStrictEqual([
      ['/repo', 'tsconfig.json'],
    ]);
  });

  it('ERROR: {no stage for the search path} => the unstaged search throws', () => {
    findTsconfigProxy();

    expect(() => findTsconfig({ searchPath: '/unstaged' })).toThrow(/^registerMock: nothing set up for the call/u);
  });
});
