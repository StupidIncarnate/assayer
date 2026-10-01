import { readNearestTsconfig } from './read-nearest-tsconfig';
import { readNearestTsconfigProxy } from './read-nearest-tsconfig.proxy';

describe('readNearestTsconfig', () => {
  it('EMPTY: {no tsconfig above the search path} => returns undefined', () => {
    const proxy = readNearestTsconfigProxy();
    proxy.noTsconfig({ searchPath: '/repo' });

    const result = readNearestTsconfig({ searchPath: '/repo' });

    expect(result).toBe(undefined);
  });

  it('VALID: {a tsconfig with compiler options} => returns its path, raw text and parsed options', () => {
    const proxy = readNearestTsconfigProxy();
    const text = '{ "compilerOptions": { "strict": true, "esModuleInterop": true } }';
    proxy.tsconfigAt({ searchPath: '/repo/src', configFilePath: '/repo/tsconfig.json', text });

    const result = readNearestTsconfig({ searchPath: '/repo/src' });

    expect(result).toStrictEqual({
      configFilePath: '/repo/tsconfig.json',
      text,
      // TypeScript's own parse sets `configFilePath` on the options, to undefined when it is given no config
      // file name.
      options: { strict: true, esModuleInterop: true, configFilePath: undefined },
    });
  });

  it('VALID: {a tsconfig with comments and no compiler options} => parses to options holding only the unset config path', () => {
    const proxy = readNearestTsconfigProxy();
    const text = '// a project with defaults\n{}\n';
    proxy.tsconfigAt({ searchPath: '/repo', configFilePath: '/repo/tsconfig.json', text });

    const result = readNearestTsconfig({ searchPath: '/repo' });

    expect(result).toStrictEqual({ configFilePath: '/repo/tsconfig.json', text, options: { configFilePath: undefined } });
  });

  it('ERROR: {no stage for the search path} => the unstaged search throws', () => {
    readNearestTsconfigProxy();

    expect(() => readNearestTsconfig({ searchPath: '/unstaged' })).toThrow(
      /^registerMock: nothing set up for the call/u,
    );
  });

  it('VALID: {a search already made} => getCallsFor reads back the search path and config name', () => {
    const proxy = readNearestTsconfigProxy();
    proxy.noTsconfig({ searchPath: '/repo' });

    readNearestTsconfig({ searchPath: '/repo' });

    expect(proxy.getCallsFor({ searchPath: '/repo' }).map((call) => [call[0], call[2]])).toStrictEqual([
      ['/repo', 'tsconfig.json'],
    ]);
  });
});
