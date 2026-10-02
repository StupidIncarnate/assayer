import { resolutionOptionsKeyTransformer } from './resolution-options-key-transformer';

describe('resolutionOptionsKeyTransformer', () => {
  it('EMPTY: {no options} => returns an empty JSON list', () => {
    expect(resolutionOptionsKeyTransformer({ options: {}, root: '/repo' })).toBe('[]');
  });

  it('VALID: {resolution and emit options} => keeps only the resolution options, sorted by name', () => {
    expect(
      resolutionOptionsKeyTransformer({
        options: { moduleResolution: 2, module: 1, outDir: '/repo/dist', strict: true },
        root: '/repo',
      }),
    ).toBe('[["module",1],["moduleResolution",2]]');
  });

  it('VALID: {paths under the root} => writes them relative to the root, singly and in lists', () => {
    expect(
      resolutionOptionsKeyTransformer({
        options: { baseUrl: '/repo/src', typeRoots: ['/repo/node_modules/@types', '/usr/lib/types'] },
        root: '/repo',
      }),
    ).toBe('[["baseUrl","src"],["typeRoots",["node_modules/@types","/usr/lib/types"]]]');
  });

  it('VALID: {the same configs checked out in two places} => both give one key', () => {
    expect(
      resolutionOptionsKeyTransformer({ options: { baseUrl: '/home/a/repo', paths: { '@app/*': ['src/*'] } }, root: '/home/a/repo' }),
    ).toBe(
      resolutionOptionsKeyTransformer({ options: { baseUrl: '/ci/build/repo', paths: { '@app/*': ['src/*'] } }, root: '/ci/build/repo' }),
    );
  });

  it('EDGE: {a path that only starts with the root spelling} => keeps it absolute', () => {
    expect(resolutionOptionsKeyTransformer({ options: { baseUrl: '/repo-other/src' }, root: '/repo' })).toBe(
      '[["baseUrl","/repo-other/src"]]',
    );
  });
});
