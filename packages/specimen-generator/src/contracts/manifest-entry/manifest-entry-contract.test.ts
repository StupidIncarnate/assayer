import { manifestEntryContract } from './manifest-entry-contract';
import { ManifestEntryStub } from './manifest-entry.stub';

describe('manifestEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {stub default} => parses a driven specimen with its tree of syntaxes', () => {
      const entry = ManifestEntryStub();

      const result = manifestEntryContract.parse(entry);

      expect(result).toStrictEqual({
        folder: 'if-number-function-declaration-body-cond-gt-number-value-param',
        relPath:
          'packages/syntax-repository/src/if/function-declaration/if-number-function-declaration-body-cond-gt-number-value-param/if-number-function-declaration-body-cond-gt-number-value-param.ts',
        focus: 'if',
        container: 'function-declaration',
        slot: 'body',
        path: 'cond.value',
        provenance: 'param',
        uses: ['if', 'gt'],
        verdict: 'driven',
      });
    });

    it('EMPTY: {path: "", uses: []} => parses, since the focus can be the varying leaf itself', () => {
      const entry = ManifestEntryStub({ path: '' as never, uses: [] });

      const result = manifestEntryContract.parse(entry);

      expect(result).toStrictEqual({
        folder: 'if-number-function-declaration-body-cond-gt-number-value-param',
        relPath:
          'packages/syntax-repository/src/if/function-declaration/if-number-function-declaration-body-cond-gt-number-value-param/if-number-function-declaration-body-cond-gt-number-value-param.ts',
        focus: 'if',
        container: 'function-declaration',
        slot: 'body',
        path: '',
        provenance: 'param',
        uses: [],
        verdict: 'driven',
      });
    });
  });

  describe('invalid entries', () => {
    it.each(['folder', 'relPath', 'focus', 'container', 'slot'])(
      'INVALID: {%s: ""} => throws, since the field is required and non-empty',
      (field) => {
        expect(() => {
          return manifestEntryContract.parse({ ...ManifestEntryStub(), [field]: '' });
        }).toThrow(/Too small: expected string to have >=1 characters/u);
      },
    );

    it('INVALID: {path: missing} => throws, since the path may be empty but must exist', () => {
      const { path: _path, ...rest } = ManifestEntryStub();

      expect(() => {
        return manifestEntryContract.parse(rest);
      }).toThrow(/expected string, received undefined/u);
    });

    it('INVALID: {provenance: "magic"} => throws, since only declared provenances exist', () => {
      expect(() => {
        return manifestEntryContract.parse({ ...ManifestEntryStub(), provenance: 'magic' });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {uses: [""]} => throws, since every use is named', () => {
      expect(() => {
        return manifestEntryContract.parse({ ...ManifestEntryStub(), uses: [''] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {verdict: "passed"} => throws, since only driven, locked and undriven exist', () => {
      expect(() => {
        return manifestEntryContract.parse({ ...ManifestEntryStub(), verdict: 'passed' });
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});
