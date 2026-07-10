import { cliCommandNormalizeTransformer } from './cli-command-normalize-transformer';

describe('cliCommandNormalizeTransformer', () => {
  describe('help aliases', () => {
    it('VALID: {arg: "help"} => returns "help"', () => {
      const result = cliCommandNormalizeTransformer({ arg: 'help' });

      expect(result).toBe('help');
    });

    it('VALID: {arg: "--help"} => returns "help"', () => {
      const result = cliCommandNormalizeTransformer({ arg: '--help' });

      expect(result).toBe('help');
    });

    it('VALID: {arg: "-h"} => returns "help"', () => {
      const result = cliCommandNormalizeTransformer({ arg: '-h' });

      expect(result).toBe('help');
    });
  });

  describe('version aliases', () => {
    it('VALID: {arg: "version"} => returns "version"', () => {
      const result = cliCommandNormalizeTransformer({ arg: 'version' });

      expect(result).toBe('version');
    });

    it('VALID: {arg: "--version"} => returns "version"', () => {
      const result = cliCommandNormalizeTransformer({ arg: '--version' });

      expect(result).toBe('version');
    });

    it('VALID: {arg: "-v"} => returns "version"', () => {
      const result = cliCommandNormalizeTransformer({ arg: '-v' });

      expect(result).toBe('version');
    });
  });

  describe('other recognized commands', () => {
    it('VALID: {arg: "docs"} => returns "docs"', () => {
      const result = cliCommandNormalizeTransformer({ arg: 'docs' });

      expect(result).toBe('docs');
    });

    it('VALID: {arg: "status"} => returns "status"', () => {
      const result = cliCommandNormalizeTransformer({ arg: 'status' });

      expect(result).toBe('status');
    });
  });

  describe('bare invocation', () => {
    it('EMPTY: {} => returns "bare"', () => {
      const result = cliCommandNormalizeTransformer({});

      expect(result).toBe('bare');
    });
  });

  describe('unrecognized argument', () => {
    it('VALID: {arg: "frobnicate"} => returns "unknown"', () => {
      const result = cliCommandNormalizeTransformer({ arg: 'frobnicate' });

      expect(result).toBe('unknown');
    });
  });
});
