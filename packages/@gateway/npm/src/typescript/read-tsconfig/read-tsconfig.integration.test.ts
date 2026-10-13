import { readTsconfig } from './read-tsconfig';

// Real parses over the real disk, with no proxy. Every package tsconfig extends the repo root's
// tsconfig and the published package base, and the repo root extends the published root base: a real
// multi-level `extends` chain.
const PACKAGE_ROOT = __dirname.replace(/\/src\/typescript\/read-tsconfig$/u, '');
const REPO_ROOT = PACKAGE_ROOT.replace(/\/packages\/@gateway\/npm$/u, '');
const THIS_WRAPPER = `${__dirname}/read-tsconfig.ts`;
const A_CORE_FILE = `${REPO_ROOT}/packages/core/src/transformers/walk-file/walk-file-transformer.ts`;

describe('readTsconfig against the real disk', () => {
  it('VALID: {the npm gateway tsconfig} => its file list holds this wrapper, and its options come from the repo root and the package base', () => {
    const result = readTsconfig({ configFilePath: `${PACKAGE_ROOT}/tsconfig.json` });

    expect({
      ownsThisWrapper: result?.fileNames.filter((fileName) => fileName === THIS_WRAPPER),
      references: result?.references,
      typeRoots: result?.options.typeRoots,
      lib: result?.options.lib,
      strict: result?.options.strict,
    }).toStrictEqual({
      ownsThisWrapper: [THIS_WRAPPER],
      references: [],
      typeRoots: [`${REPO_ROOT}/node_modules/@types`],
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      strict: true,
    });
  });

  it('VALID: {the shared package tsconfig} => its options merge the whole extends chain', () => {
    const result = readTsconfig({ configFilePath: `${REPO_ROOT}/packages/shared/tsconfig.json` });

    expect({
      references: result?.references,
      // From the repo root's config.
      typeRoots: result?.options.typeRoots,
      // From the repo root's config, which replaces the published base's `lib`.
      lib: result?.options.lib,
      // From the published root base, two levels up the chain.
      strict: result?.options.strict,
    }).toStrictEqual({
      references: [],
      typeRoots: [`${REPO_ROOT}/node_modules/@types`],
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      strict: true,
    });
  });

  it('VALID: {the repo root tsconfig} => its include holds core source but not the npm gateway', () => {
    const result = readTsconfig({ configFilePath: `${REPO_ROOT}/tsconfig.json` });

    expect({
      ownsThisWrapper: result?.fileNames.filter((fileName) => fileName === THIS_WRAPPER),
      ownsACoreFile: result?.fileNames.filter((fileName) => fileName === A_CORE_FILE),
    }).toStrictEqual({ ownsThisWrapper: [], ownsACoreFile: [A_CORE_FILE] });
  });

  it('EMPTY: {a config path with no file} => returns undefined', () => {
    expect(readTsconfig({ configFilePath: `${PACKAGE_ROOT}/no-such-tsconfig.json` })).toBe(undefined);
  });
});
