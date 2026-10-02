import { climbOwnerLayerBroker } from './climb-owner-layer-broker';
import { climbOwnerLayerBrokerProxy } from './climb-owner-layer-broker.proxy';

describe('climbOwnerLayerBroker', () => {
  it('EMPTY: {no tsconfig above the search path} => returns undefined', () => {
    const proxy = climbOwnerLayerBrokerProxy();
    proxy.noTsconfigAbove({ searchPath: '/loose' });

    expect(climbOwnerLayerBroker({ absPath: '/loose/a.ts', searchPath: '/loose' })).toBe(undefined);
  });

  it('VALID: {the first config found lists the file} => returns it without searching higher', () => {
    const proxy = climbOwnerLayerBrokerProxy();
    proxy.tsconfigAt({
      searchPath: '/repo/src',
      configFilePath: '/repo/tsconfig.json',
      fileNames: ['/repo/src/a.ts'],
      options: { strict: true },
    });

    expect(climbOwnerLayerBroker({ absPath: '/repo/src/a.ts', searchPath: '/repo/src' })).toStrictEqual({
      configFilePath: '/repo/tsconfig.json',
      options: { strict: true },
    });
  });

  it('VALID: {the first config does not list the file} => searches again from the folder above that config', () => {
    const proxy = climbOwnerLayerBrokerProxy();
    proxy.tsconfigAt({ searchPath: '/repo/pkg/src', configFilePath: '/repo/pkg/tsconfig.json', fileNames: [] });
    proxy.tsconfigAt({
      searchPath: '/repo',
      configFilePath: '/repo/tsconfig.json',
      fileNames: ['/repo/pkg/src/a.ts'],
      options: { target: 9 },
    });

    expect(climbOwnerLayerBroker({ absPath: '/repo/pkg/src/a.ts', searchPath: '/repo/pkg/src' })).toStrictEqual({
      configFilePath: '/repo/tsconfig.json',
      options: { target: 9 },
    });
  });

  it('EMPTY: {a config at the file system root that does not list the file} => stops there and returns undefined', () => {
    const proxy = climbOwnerLayerBrokerProxy();
    proxy.tsconfigAt({ searchPath: '/src', configFilePath: '/tsconfig.json', fileNames: [] });

    expect(climbOwnerLayerBroker({ absPath: '/src/a.ts', searchPath: '/src' })).toBe(undefined);
  });
});
