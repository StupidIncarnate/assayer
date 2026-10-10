import { clearTsconfigCache, readTsconfig } from './read-tsconfig';
import { readTsconfigProxy } from './read-tsconfig.proxy';

describe('readTsconfig', () => {
  it('VALID: {a config with files and options} => returns its path, file list, no references and options', () => {
    const proxy = readTsconfigProxy();
    proxy.tsconfigAt({
      configFilePath: '/repo/packages/app/tsconfig.json',
      fileNames: ['/repo/packages/app/src/main.ts'],
      options: { strict: true },
    });

    expect(readTsconfig({ configFilePath: '/repo/packages/app/tsconfig.json' })).toStrictEqual({
      configFilePath: '/repo/packages/app/tsconfig.json',
      fileNames: ['/repo/packages/app/src/main.ts'],
      references: [],
      options: { strict: true },
    });
  });

  it('VALID: {a solution config} => returns no files and each reference as a config file path', () => {
    const proxy = readTsconfigProxy();
    proxy.tsconfigAt({
      configFilePath: '/repo/tsconfig.json',
      fileNames: [],
      references: ['/repo/packages/app/tsconfig.json', '/repo/packages/tools/tsconfig.scripts.json'],
    });

    expect(readTsconfig({ configFilePath: '/repo/tsconfig.json' })).toStrictEqual({
      configFilePath: '/repo/tsconfig.json',
      fileNames: [],
      references: ['/repo/packages/app/tsconfig.json', '/repo/packages/tools/tsconfig.scripts.json'],
      options: {},
    });
  });

  it('EMPTY: {a config TypeScript cannot read} => returns undefined', () => {
    const proxy = readTsconfigProxy();
    proxy.unreadable({ configFilePath: '/repo/tsconfig.json' });

    expect(readTsconfig({ configFilePath: '/repo/tsconfig.json' })).toBe(undefined);
  });

  it('VALID: {a read already made} => getCallsFor reads back the config path', () => {
    const proxy = readTsconfigProxy();
    proxy.unreadable({ configFilePath: '/repo/tsconfig.json' });

    readTsconfig({ configFilePath: '/repo/tsconfig.json' });

    expect(proxy.getCallsFor({ configFilePath: '/repo/tsconfig.json' }).map((call) => [call[0], call[1]])).toStrictEqual([
      ['/repo/tsconfig.json', undefined],
    ]);
  });

  it('VALID: {read called multiple times for the same config} => returns memoized result and only parses once', () => {
    const proxy = readTsconfigProxy();
    proxy.tsconfigAt({
      configFilePath: '/repo/packages/app/tsconfig.json',
      fileNames: ['/repo/packages/app/src/main.ts'],
      options: { strict: true },
    });

    const first = readTsconfig({ configFilePath: '/repo/packages/app/tsconfig.json' });
    const second = readTsconfig({ configFilePath: '/repo/packages/app/tsconfig.json' });

    expect(second).toStrictEqual(first);
    expect(
      proxy.getCallsFor({ configFilePath: '/repo/packages/app/tsconfig.json' }).map((call) => [call[0], call[1]]),
    ).toStrictEqual([['/repo/packages/app/tsconfig.json', undefined]]);
  });

  it('VALID: {clearTsconfigCache called} => next read re-parses from disk', () => {
    const proxy = readTsconfigProxy();
    proxy.tsconfigAt({
      configFilePath: '/repo/packages/app/tsconfig.json',
      fileNames: ['/repo/packages/app/src/main.ts'],
      options: { strict: true },
    });

    readTsconfig({ configFilePath: '/repo/packages/app/tsconfig.json' });
    clearTsconfigCache();
    readTsconfig({ configFilePath: '/repo/packages/app/tsconfig.json' });

    expect(
      proxy.getCallsFor({ configFilePath: '/repo/packages/app/tsconfig.json' }).map((call) => [call[0], call[1]]),
    ).toStrictEqual([
      ['/repo/packages/app/tsconfig.json', undefined],
      ['/repo/packages/app/tsconfig.json', undefined],
    ]);
  });

  it('ERROR: {no stage for the config path} => the unstaged parse throws', () => {
    readTsconfigProxy();

    expect(() => readTsconfig({ configFilePath: '/unstaged/tsconfig.json' })).toThrow(
      /^registerMock: nothing set up for the call/u,
    );
  });
});
