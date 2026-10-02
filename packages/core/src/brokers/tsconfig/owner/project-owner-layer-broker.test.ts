import { projectOwnerLayerBroker } from './project-owner-layer-broker';
import { projectOwnerLayerBrokerProxy } from './project-owner-layer-broker.proxy';

describe('projectOwnerLayerBroker', () => {
  it('VALID: {the config lists the file} => returns the config and its options', () => {
    const proxy = projectOwnerLayerBrokerProxy();
    proxy.tsconfigAt({ configFilePath: '/repo/tsconfig.json', fileNames: ['/repo/src/a.ts'], options: { strict: true } });

    expect(projectOwnerLayerBroker({ absPath: '/repo/src/a.ts', configFilePath: '/repo/tsconfig.json', seen: [] })).toStrictEqual(
      { configFilePath: '/repo/tsconfig.json', options: { strict: true } },
    );
  });

  it('EMPTY: {the config does not list the file and has no references} => returns undefined', () => {
    const proxy = projectOwnerLayerBrokerProxy();
    proxy.tsconfigAt({ configFilePath: '/repo/tsconfig.json', fileNames: ['/repo/src/b.ts'] });

    expect(projectOwnerLayerBroker({ absPath: '/repo/src/a.ts', configFilePath: '/repo/tsconfig.json', seen: [] })).toBe(
      undefined,
    );
  });

  it('VALID: {a solution config} => returns the first referenced project that lists the file', () => {
    const proxy = projectOwnerLayerBrokerProxy();
    proxy.tsconfigAt({
      configFilePath: '/repo/tsconfig.json',
      fileNames: [],
      references: ['/repo/a/tsconfig.json', '/repo/b/tsconfig.json'],
    });
    proxy.tsconfigAt({ configFilePath: '/repo/a/tsconfig.json', fileNames: ['/repo/a/x.ts'] });
    proxy.tsconfigAt({ configFilePath: '/repo/b/tsconfig.json', fileNames: ['/repo/b/y.ts'], options: { target: 9 } });

    expect(projectOwnerLayerBroker({ absPath: '/repo/b/y.ts', configFilePath: '/repo/tsconfig.json', seen: [] })).toStrictEqual(
      { configFilePath: '/repo/b/tsconfig.json', options: { target: 9 } },
    );
  });

  it('EDGE: {two configs that reference each other} => stops at the cycle and returns undefined', () => {
    const proxy = projectOwnerLayerBrokerProxy();
    proxy.tsconfigAt({ configFilePath: '/repo/a.json', fileNames: [], references: ['/repo/b.json'] });
    proxy.tsconfigAt({ configFilePath: '/repo/b.json', fileNames: [], references: ['/repo/a.json'] });

    expect(projectOwnerLayerBroker({ absPath: '/repo/src/a.ts', configFilePath: '/repo/a.json', seen: [] })).toBe(undefined);
  });

  it('EMPTY: {a config TypeScript cannot read} => returns undefined', () => {
    const proxy = projectOwnerLayerBrokerProxy();
    proxy.unreadable({ configFilePath: '/repo/tsconfig.json' });

    expect(projectOwnerLayerBroker({ absPath: '/repo/src/a.ts', configFilePath: '/repo/tsconfig.json', seen: [] })).toBe(
      undefined,
    );
  });
});
