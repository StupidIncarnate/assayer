import { sortFileIndexTransformer } from './sort-file-index-transformer';
import { FileIndexEntryStub } from '../../contracts/file-index-entry/file-index-entry.stub';

describe('sortFileIndexTransformer', () => {
  describe('unsorted input', () => {
    it('VALID: {entries: [b.ts, a.ts]} => returns entries sorted ascending by relPath', () => {
      const result = sortFileIndexTransformer({
        entries: [FileIndexEntryStub({ relPath: 'b.ts' }), FileIndexEntryStub({ relPath: 'a.ts' })],
      });

      expect(result).toStrictEqual([FileIndexEntryStub({ relPath: 'a.ts' }), FileIndexEntryStub({ relPath: 'b.ts' })]);
    });
  });

  describe('already-sorted input', () => {
    it('VALID: {entries: [a.ts, b.ts, c.ts]} => returns entries in the same ascending order', () => {
      const result = sortFileIndexTransformer({
        entries: [
          FileIndexEntryStub({ relPath: 'a.ts' }),
          FileIndexEntryStub({ relPath: 'b.ts' }),
          FileIndexEntryStub({ relPath: 'c.ts' }),
        ],
      });

      expect(result).toStrictEqual([
        FileIndexEntryStub({ relPath: 'a.ts' }),
        FileIndexEntryStub({ relPath: 'b.ts' }),
        FileIndexEntryStub({ relPath: 'c.ts' }),
      ]);
    });
  });

  describe('reverse-sorted input', () => {
    it('VALID: {entries: [c.ts, b.ts, a.ts]} => returns entries sorted ascending by relPath', () => {
      const result = sortFileIndexTransformer({
        entries: [
          FileIndexEntryStub({ relPath: 'c.ts' }),
          FileIndexEntryStub({ relPath: 'b.ts' }),
          FileIndexEntryStub({ relPath: 'a.ts' }),
        ],
      });

      expect(result).toStrictEqual([
        FileIndexEntryStub({ relPath: 'a.ts' }),
        FileIndexEntryStub({ relPath: 'b.ts' }),
        FileIndexEntryStub({ relPath: 'c.ts' }),
      ]);
    });
  });

  describe('entries with equal relPath', () => {
    it('EDGE: {entries: [a.ts, a.ts]} => returns both entries, comparator treats them as equal', () => {
      const result = sortFileIndexTransformer({
        entries: [FileIndexEntryStub({ relPath: 'a.ts' }), FileIndexEntryStub({ relPath: 'a.ts' })],
      });

      expect(result).toStrictEqual([FileIndexEntryStub({ relPath: 'a.ts' }), FileIndexEntryStub({ relPath: 'a.ts' })]);
    });
  });

  describe('input array mutation', () => {
    it('EDGE: {entries: [b.ts, a.ts]} => does not mutate the original input array', () => {
      const original = [FileIndexEntryStub({ relPath: 'b.ts' }), FileIndexEntryStub({ relPath: 'a.ts' })];

      sortFileIndexTransformer({ entries: original });

      expect(original).toStrictEqual([FileIndexEntryStub({ relPath: 'b.ts' }), FileIndexEntryStub({ relPath: 'a.ts' })]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entries: []} => returns []', () => {
      expect(sortFileIndexTransformer({ entries: [] })).toStrictEqual([]);
    });
  });
});
