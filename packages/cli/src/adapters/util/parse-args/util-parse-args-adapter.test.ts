import { CliPositionalStub } from '../../../contracts/cli-positional/cli-positional.stub';
import { utilParseArgsAdapter } from './util-parse-args-adapter';
import { utilParseArgsAdapterProxy } from './util-parse-args-adapter.proxy';

describe('utilParseArgsAdapter', () => {
  describe('positionals', () => {
    it('VALID: {one path} => that path', () => {
      utilParseArgsAdapterProxy();

      expect(utilParseArgsAdapter({ argv: ['src/a.ts'] })).toStrictEqual([CliPositionalStub({ value: 'src/a.ts' })]);
    });

    it('VALID: {several paths} => all of them, in order', () => {
      utilParseArgsAdapterProxy();

      expect(utilParseArgsAdapter({ argv: ['src/a.ts', 'src/b.ts'] })).toStrictEqual([
        CliPositionalStub({ value: 'src/a.ts' }),
        CliPositionalStub({ value: 'src/b.ts' }),
      ]);
    });

    it('EMPTY: {no argv} => no positionals', () => {
      utilParseArgsAdapterProxy();

      expect(utilParseArgsAdapter({ argv: [] })).toStrictEqual([]);
    });
  });

  describe('unrecognized flags', () => {
    // Refused, never ignored: swallowing a flag runs something other than what was asked and then
    // reports success, which is worse than not supporting the flag.
    it('ERROR: {an unknown flag} => throws rather than ignoring it', () => {
      utilParseArgsAdapterProxy();

      expect(() => {
        return utilParseArgsAdapter({ argv: ['--only-failures', 'src/a.ts'] });
      }).toThrow(/Unknown option/u);
    });
  });
});
