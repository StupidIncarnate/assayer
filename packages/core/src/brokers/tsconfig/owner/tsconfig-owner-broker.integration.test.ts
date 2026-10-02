import { tsconfigOwnerHarness } from '../../../../test/harnesses/tsconfig-owner.harness';

describe('tsconfigOwnerBroker over a real monorepo layout', () => {
  const layout = tsconfigOwnerHarness();

  it('VALID: {solution, exclude, nested files list, extends chain, reference by file name} => each file gets the owner TypeScript names', () => {
    expect(layout.ownersInMonorepo()).toStrictEqual([
      // The nearest config lists it; its options merge tsconfig.base.json through `extends`.
      { file: 'packages/app/src/main.ts', owner: 'packages/app/tsconfig.json', target: 7, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], strict: true },
      // app's `exclude` drops it, the root solution's projects skip it too, and nothing above the temp dir lists
      // it, so it keeps TypeScript's defaults.
      { file: 'packages/app/src/main.test.ts', owner: undefined, target: undefined, lib: undefined, strict: undefined },
      // The nested config's `files` names it.
      { file: 'packages/app/src/legacy/old.ts', owner: 'packages/app/src/legacy/tsconfig.json', target: 1, lib: undefined, strict: undefined },
      // The nested config skips it, so the search climbs to app's config.
      { file: 'packages/app/src/legacy/new.ts', owner: 'packages/app/tsconfig.json', target: 7, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], strict: true },
      // Two levels of `extends`: lib from the middle config, strict and target from the base.
      { file: 'packages/lib/src/util.ts', owner: 'packages/lib/tsconfig.json', target: 7, lib: ['lib.es2020.d.ts'], strict: true },
      // The nearest config is a solution; its reference names a config file directly.
      { file: 'packages/tools/scripts/gen.ts', owner: 'packages/tools/tsconfig.scripts.json', target: 9, lib: undefined, strict: undefined },
    ]);
  });
});
