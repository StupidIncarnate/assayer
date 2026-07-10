/**
 * PURPOSE: Sorts file index entries into a deterministic ascending order by relPath. Uses a
 *   plain lexicographic string comparison ('<' / '>'), never localeCompare, which is
 *   locale-dependent and can produce different orderings across environments -- determinism here
 *   is load-bearing (same input must always produce the same byte-identical order).
 *
 * USAGE:
 * sortFileIndexTransformer({ entries: [FileIndexEntryStub({ relPath: 'b.ts' }), FileIndexEntryStub({ relPath: 'a.ts' })] });
 * // Returns [{ relPath: 'a.ts' }, { relPath: 'b.ts' }] -- a NEW array; the input is not mutated
 */
import type { FileIndexEntry } from '../../contracts/file-index-entry/file-index-entry-contract';

export const sortFileIndexTransformer = ({
  entries,
}: {
  entries: readonly FileIndexEntry[];
}): readonly FileIndexEntry[] =>
  [...entries].sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));
