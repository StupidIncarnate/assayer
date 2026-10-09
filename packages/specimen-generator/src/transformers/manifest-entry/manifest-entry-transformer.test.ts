import { ManifestEntryStub } from '../../contracts/manifest-entry/manifest-entry.stub';
import { manifestEntryTransformer } from './manifest-entry-transformer';

describe('manifestEntryTransformer', () => {
  it('VALID: {a settable leaf} => returns a driven entry with the path joined by arrows', () => {
    const { folder, relPath } = ManifestEntryStub();

    const result = manifestEntryTransformer({
      folder,
      relPath,
      focusName: 'if',
      containerName: 'function-declaration',
      slotName: 'body',
      path: ['cond', 'gt-number', 'value'],
      provenance: 'param',
      uses: ['if', 'gt'],
      provenances: ['param', 'literal'],
    });

    expect(result).toStrictEqual({
      folder: 'if-number-function-declaration-body-cond-gt-number-value-param',
      relPath:
        'packages/syntax-repository/src/if/function-declaration/if-number-function-declaration-body-cond-gt-number-value-param/if-number-function-declaration-body-cond-gt-number-value-param.ts',
      focus: 'if',
      container: 'function-declaration',
      slot: 'body',
      path: 'cond › gt-number › value',
      provenance: 'param',
      uses: ['if', 'gt'],
      verdict: 'driven',
    });
  });

  it('VALID: {every leaf known} => returns a locked entry', () => {
    const { folder, relPath } = ManifestEntryStub();

    const result = manifestEntryTransformer({
      folder,
      relPath,
      focusName: 'ternary',
      containerName: 'arrow-function',
      slotName: 'return',
      path: ['cond'],
      provenance: 'const',
      uses: ['ternary'],
      provenances: ['const', 'literal'],
    });

    expect(result.verdict).toBe('locked');
  });

  it('VALID: {a leaf from outside the program} => returns an undriven entry', () => {
    const { folder, relPath } = ManifestEntryStub();

    const result = manifestEntryTransformer({
      folder,
      relPath,
      focusName: 'if',
      containerName: 'module',
      slotName: 'top',
      path: ['cond'],
      provenance: 'external',
      uses: ['if'],
      provenances: ['external'],
    });

    expect(result.verdict).toBe('undriven');
  });

  it('EMPTY: {path: []} => returns an empty path', () => {
    const { folder, relPath } = ManifestEntryStub();

    const result = manifestEntryTransformer({
      folder,
      relPath,
      focusName: 'if',
      containerName: 'module',
      slotName: 'top',
      path: [],
      provenance: 'param',
      uses: ['if'],
      provenances: ['param'],
    });

    expect(result.path).toBe('');
  });

  it('ERROR: {a pinned provenance} => throws from the verdict rule', () => {
    const { folder, relPath } = ManifestEntryStub();

    expect(() =>
      manifestEntryTransformer({
        folder,
        relPath,
        focusName: 'if',
        containerName: 'module',
        slotName: 'top',
        path: ['cond'],
        provenance: 'random',
        uses: ['if'],
        provenances: ['random'],
      }),
    ).toThrow(/^specimen verdict: a leaf has a pinned provenance \(random\)/u);
  });
});
