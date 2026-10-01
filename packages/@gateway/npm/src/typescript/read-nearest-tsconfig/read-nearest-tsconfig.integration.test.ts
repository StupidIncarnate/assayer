import { readNearestTsconfig } from './read-nearest-tsconfig';

// Real reads over the real disk, with no proxy: the nearest tsconfig above this folder is the npm
// gateway package's own, whose `typeRoots` resolve against the package folder.
const PACKAGE_ROOT = __dirname.replace(/\/src\/typescript\/read-nearest-tsconfig$/u, '');
const REPO_ROOT = PACKAGE_ROOT.replace(/\/packages\/@gateway\/npm$/u, '');

describe('readNearestTsconfig against the real disk', () => {
  it('VALID: {search path inside the npm gateway} => finds the package tsconfig and parses its options', () => {
    const result = readNearestTsconfig({ searchPath: __dirname });

    expect([result?.configFilePath, result?.options.typeRoots]).toStrictEqual([
      `${PACKAGE_ROOT}/tsconfig.json`,
      [`${REPO_ROOT}/node_modules/@types`, `${REPO_ROOT}/@types`, `${PACKAGE_ROOT}/@types`],
    ]);
  });
});
