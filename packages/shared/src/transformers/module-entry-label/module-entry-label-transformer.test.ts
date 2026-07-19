import { moduleEntryLabelTransformer } from './module-entry-label-transformer';
import { SymbolNameStub } from '../../contracts/symbol-name/symbol-name.stub';

describe('moduleEntryLabelTransformer', () => {
  describe('a module with one exported binding', () => {
    it('VALID: {exportName: message} => the export name, never the file', () => {
      const result = moduleEntryLabelTransformer({
        exportName: SymbolNameStub({ value: 'message' }),
        relPath: 'src/happy-path/import-local/uses-greeting/uses-greeting.ts',
      });

      expect(String(result)).toBe('message');
    });
  });

  describe('a module with no exported binding', () => {
    it('VALID: {no exportName} => the file basename with extension', () => {
      const result = moduleEntryLabelTransformer({ relPath: 'src/happy-path/node-global/uses-console/uses-console.ts' });

      expect(String(result)).toBe('uses-console.ts');
    });

    it('VALID: {a nested relPath} => only the last path segment', () => {
      const result = moduleEntryLabelTransformer({
        relPath: 'packages/syntax-repository/src/sad-path/undriven/welded-const/welded-const.ts',
      });

      expect(String(result)).toBe('welded-const.ts');
    });

    it('EDGE: {a bare filename} => the filename itself', () => {
      const result = moduleEntryLabelTransformer({ relPath: 'index.ts' });

      expect(String(result)).toBe('index.ts');
    });
  });
});
