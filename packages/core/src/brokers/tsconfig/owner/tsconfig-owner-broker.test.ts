import { tsconfigOwnerBroker } from './tsconfig-owner-broker';
import { tsconfigOwnerBrokerProxy } from './tsconfig-owner-broker.proxy';

describe('tsconfigOwnerBroker', () => {
  it('VALID: {the nearest config lists the file} => returns that config and its options', () => {
    const proxy = tsconfigOwnerBrokerProxy();
    proxy.filesOwnedBy({
      absPaths: ['/repo/packages/app/src/main.ts'],
      configFilePath: '/repo/packages/app/tsconfig.json',
      options: { strict: true, target: 9 },
    });

    expect(tsconfigOwnerBroker({ absPath: '/repo/packages/app/src/main.ts' })).toStrictEqual({
      configFilePath: '/repo/packages/app/tsconfig.json',
      options: { strict: true, target: 9 },
    });
  });

  it('EMPTY: {no tsconfig above the file} => returns TypeScript defaults, with no config path', () => {
    const proxy = tsconfigOwnerBrokerProxy();
    proxy.filesWithoutOwner({ absPaths: ['/loose/script.ts'] });

    expect(tsconfigOwnerBroker({ absPath: '/loose/script.ts' })).toStrictEqual({ options: {} });
  });

  it('VALID: {the nearest config is a solution config} => follows its references to the project that lists the file', () => {
    const proxy = tsconfigOwnerBrokerProxy();
    proxy.tsconfigAt({
      searchPath: '/repo/packages/tools/scripts',
      configFilePath: '/repo/packages/tools/tsconfig.json',
      fileNames: [],
      references: ['/repo/packages/tools/tsconfig.scripts.json'],
    });
    proxy.referencedTsconfig({
      configFilePath: '/repo/packages/tools/tsconfig.scripts.json',
      fileNames: ['/repo/packages/tools/scripts/gen.ts'],
      options: { target: 9, module: 199 },
    });

    expect(tsconfigOwnerBroker({ absPath: '/repo/packages/tools/scripts/gen.ts' })).toStrictEqual({
      configFilePath: '/repo/packages/tools/tsconfig.scripts.json',
      options: { target: 9, module: 199 },
    });
  });

  it('VALID: {a nested config that does not list the file} => climbs past it to the config above that does', () => {
    const proxy = tsconfigOwnerBrokerProxy();
    proxy.tsconfigAt({
      searchPath: '/repo/app/src/legacy',
      configFilePath: '/repo/app/src/legacy/tsconfig.json',
      fileNames: ['/repo/app/src/legacy/old.ts'],
      options: { target: 1 },
    });
    proxy.tsconfigAt({
      searchPath: '/repo/app/src',
      configFilePath: '/repo/app/tsconfig.json',
      fileNames: ['/repo/app/src/legacy/new.ts', '/repo/app/src/legacy/old.ts'],
      options: { target: 7 },
    });

    expect(tsconfigOwnerBroker({ absPath: '/repo/app/src/legacy/new.ts' })).toStrictEqual({
      configFilePath: '/repo/app/tsconfig.json',
      options: { target: 7 },
    });
  });

  it('EMPTY: {a test file its package config excludes, under a solution whose projects also skip it} => returns TypeScript defaults', () => {
    const proxy = tsconfigOwnerBrokerProxy();
    proxy.tsconfigAt({
      searchPath: '/repo/packages/app/src',
      configFilePath: '/repo/packages/app/tsconfig.json',
      fileNames: ['/repo/packages/app/src/main.ts'],
    });
    proxy.tsconfigAt({
      searchPath: '/repo/packages',
      configFilePath: '/repo/tsconfig.json',
      fileNames: [],
      references: ['/repo/packages/app/tsconfig.json'],
    });
    proxy.noTsconfigAbove({ searchPath: '/' });

    expect(tsconfigOwnerBroker({ absPath: '/repo/packages/app/src/main.test.ts' })).toStrictEqual({ options: {} });
  });
});
