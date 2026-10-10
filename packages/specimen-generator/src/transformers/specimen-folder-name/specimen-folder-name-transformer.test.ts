import { specimenFolderNameTransformer } from './specimen-folder-name-transformer';

describe('specimenFolderNameTransformer', () => {
  describe('folder', () => {
    it('VALID: {container with one slot, path: [cond], provenance: param, typeArgument: number} => joins type argument, path and provenance, with no slot', () => {
      const result = specimenFolderNameTransformer({
        typeArgument: 'number',
        slotName: 'body',
        multiSlot: false,
        path: ['cond'],
        provenance: 'param',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'number-cond-param',
        entryName: 'numberCondParam',
      });
    });

    it('VALID: {non-generic syntax with no type argument} => joins path and provenance, with no slot or type argument', () => {
      const result = specimenFolderNameTransformer({
        slotName: 'body',
        multiSlot: false,
        path: ['cond'],
        provenance: 'param',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'cond-param',
        entryName: 'condParam',
      });
    });

    it('VALID: {focusLabel: if-number, syntaxName: if} => strips syntax prefix keeping type argument', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'if-number',
        syntaxName: 'if',
        slotName: 'body',
        multiSlot: false,
        path: ['cond'],
        provenance: 'param',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'number-cond-param',
        entryName: 'numberCondParam',
      });
    });

    it('VALID: {container with several slots} => the slot name is included', () => {
      const result = specimenFolderNameTransformer({
        typeArgument: 'number',
        slotName: 'getter',
        multiSlot: true,
        path: ['cond'],
        provenance: 'env',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'number-getter-cond-env',
        entryName: 'numberGetterCondEnv',
      });
    });

    it('VALID: {path: [cond, gt-number, value]} => every path part is joined in order', () => {
      const result = specimenFolderNameTransformer({
        typeArgument: 'number',
        slotName: 'body',
        multiSlot: false,
        path: ['cond', 'gt-number', 'value'],
        provenance: 'literal',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'number-cond-gt-number-value-literal',
        entryName: 'numberCondGtNumberValueLiteral',
      });
    });

    it('VALID: {path part in camelCase: lowerLimit} => the part is written in kebab case', () => {
      const result = specimenFolderNameTransformer({
        typeArgument: 'number',
        slotName: 'body',
        multiSlot: false,
        path: ['lowerLimit'],
        provenance: 'const',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'number-lower-limit-const',
        entryName: 'numberLowerLimitConst',
      });
    });

    it('EMPTY: {path: []} => the provenance is used directly', () => {
      const result = specimenFolderNameTransformer({
        slotName: 'body',
        multiSlot: false,
        path: [],
        provenance: 'external',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'external',
        entryName: 'external',
      });
    });
  });

  describe('entry name', () => {
    it('VALID: {isClass: true} => the entry name is PascalCase', () => {
      const result = specimenFolderNameTransformer({
        typeArgument: 'number',
        slotName: 'method',
        multiSlot: true,
        path: ['cond'],
        provenance: 'param',
        isClass: true,
      });

      expect(result).toStrictEqual({
        folder: 'number-method-cond-param',
        entryName: 'NumberMethodCondParam',
      });
    });
  });
});
