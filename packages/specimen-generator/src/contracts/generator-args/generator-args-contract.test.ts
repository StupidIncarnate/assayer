import { generatorArgsContract } from './generator-args-contract';
import { GeneratorArgsStub } from './generator-args.stub';

describe('generatorArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {stub default} => parses write mode with no filters', () => {
      const args = GeneratorArgsStub();

      const result = generatorArgsContract.parse(args);

      expect(result).toStrictEqual({ mode: 'write' });
    });

    it('VALID: {every option set} => parses every filter', () => {
      const args = GeneratorArgsStub({
        mode: 'check',
        focus: ['if'] as never,
        container: ['class'] as never,
        depth: 2 as never,
      });

      const result = generatorArgsContract.parse(args);

      expect(result).toStrictEqual({ mode: 'check', focus: ['if'], container: ['class'], depth: 2 });
    });

    it('EDGE: {depth: 0} => parses, since zero is the smallest depth', () => {
      const args = GeneratorArgsStub({ depth: 0 as never });

      const result = generatorArgsContract.parse(args);

      expect(result).toStrictEqual({ mode: 'write', depth: 0 });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {mode: "dry-run"} => throws, since only write and check exist', () => {
      expect(() => {
        return generatorArgsContract.parse({ mode: 'dry-run' });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {mode: missing} => throws, since a mode is required', () => {
      expect(() => {
        return generatorArgsContract.parse({});
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {focus: [""]} => throws, since each focus is named', () => {
      expect(() => {
        return generatorArgsContract.parse({ mode: 'write', focus: [''] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {container: [""]} => throws, since each container is named', () => {
      expect(() => {
        return generatorArgsContract.parse({ mode: 'write', container: [''] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {depth: -1} => throws, since depth cannot be negative', () => {
      expect(() => {
        return generatorArgsContract.parse({ mode: 'write', depth: -1 });
      }).toThrow(/Too small: expected number to be >=0/u);
    });

    it('INVALID: {depth: 1.5} => throws, since depth is a whole number', () => {
      expect(() => {
        return generatorArgsContract.parse({ mode: 'write', depth: 1.5 });
      }).toThrow(/Invalid input: expected int, received number/u);
    });
  });
});
