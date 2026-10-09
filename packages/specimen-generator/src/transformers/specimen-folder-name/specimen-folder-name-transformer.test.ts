import { specimenFolderNameTransformer } from './specimen-folder-name-transformer';

describe('specimenFolderNameTransformer', () => {
  describe('folder', () => {
    it('VALID: {container with one slot, path: [cond], provenance: param} => joins focus, container, path and provenance, with no slot', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'if-number',
        containerName: 'function-declaration',
        slotName: 'body',
        multiSlot: false,
        path: ['cond'],
        provenance: 'param',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'if-number-function-declaration-cond-param',
        entryName: 'ifNumberFunctionDeclarationCondParam',
      });
    });

    it('VALID: {container with several slots} => the slot name follows the container name', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'ternary-number',
        containerName: 'object-literal',
        slotName: 'getter',
        multiSlot: true,
        path: ['cond'],
        provenance: 'env',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'ternary-number-object-literal-getter-cond-env',
        entryName: 'ternaryNumberObjectLiteralGetterCondEnv',
      });
    });

    it('VALID: {path: [cond, gt-number, value]} => every path part is joined in order', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'if-number',
        containerName: 'module',
        slotName: 'body',
        multiSlot: false,
        path: ['cond', 'gt-number', 'value'],
        provenance: 'literal',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'if-number-module-cond-gt-number-value-literal',
        entryName: 'ifNumberModuleCondGtNumberValueLiteral',
      });
    });

    it('VALID: {path part in camelCase: lowerLimit} => the part is written in kebab case', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'if-number',
        containerName: 'module',
        slotName: 'body',
        multiSlot: false,
        path: ['lowerLimit'],
        provenance: 'const',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'if-number-module-lower-limit-const',
        entryName: 'ifNumberModuleLowerLimitConst',
      });
    });

    it('EMPTY: {path: []} => the provenance follows the container directly', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'seven',
        containerName: 'module',
        slotName: 'body',
        multiSlot: false,
        path: [],
        provenance: 'external',
        isClass: false,
      });

      expect(result).toStrictEqual({
        folder: 'seven-module-external',
        entryName: 'sevenModuleExternal',
      });
    });
  });

  describe('entry name', () => {
    it('VALID: {isClass: true} => the entry name is PascalCase', () => {
      const result = specimenFolderNameTransformer({
        focusLabel: 'if-number',
        containerName: 'class',
        slotName: 'method',
        multiSlot: true,
        path: ['cond'],
        provenance: 'param',
        isClass: true,
      });

      expect(result).toStrictEqual({
        folder: 'if-number-class-method-cond-param',
        entryName: 'IfNumberClassMethodCondParam',
      });
    });
  });
});
