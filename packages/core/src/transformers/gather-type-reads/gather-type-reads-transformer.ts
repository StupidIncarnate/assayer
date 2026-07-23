/**
 * PURPOSE: Groups the object-member read facts feeding each stubbed object type — the SEAM the stub
 *   stitch collects demands over, and the ONE place "which read facts feed type T, and which files read
 *   it" is decided. Every object type any blob DECLARES is a stubbable group, keyed by its definition
 *   site `(definitionRelPath, typeName)`; the declaring file's own `declaredType` carries the FULL
 *   property list demands are later spliced onto.
 *
 *   It then INVERTS the resolved index to unite every reader's leaves onto that definition. For each
 *   branch-condition leaf whose root type-reference names a type, the reader that read it is reconciled
 *   to the type's canonical definition: a SAME-FILE type (the reader declares it itself) resolves to the
 *   reader; a cross-file type resolves through the resolved index's `local` import edge from that reader
 *   for that imported name. The leaf and its reader are attached to that definition's group. A type no
 *   file reads is still a group, with no readers and no leaves, so every property degrades to `unknown`.
 *   The cross-file union swaps only this grouping; the per-property value math stays downstream.
 *
 * USAGE:
 * gatherTypeReadsTransformer({ blobs, resolvedIndex });
 * // Returns [{ definitionRelPath, typeName, declaredType, readers: [relPath], leaves: [modeLeaf] }, …]
 */
import type {
  CompiledFileBlob,
  ConditionLeaf,
  DeclaredType,
  RelPath,
  ResolvedIndex,
  SymbolName,
} from '@assayer/shared/contracts';

import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';

export const gatherTypeReadsTransformer = ({
  blobs,
  resolvedIndex,
}: {
  blobs: CompiledFileBlob[];
  resolvedIndex: ResolvedIndex;
}): { definitionRelPath: RelPath; typeName: SymbolName; declaredType: DeclaredType; readers: RelPath[]; leaves: ConditionLeaf[] }[] => {
  // Every declared object type is a stubbable group, keyed by its definition site. The declaring file's
  // own descriptor is the source of the FULL property list; a type no file reads still yields a group.
  const groups = blobs.flatMap((blob) =>
    (blob.analysis?.declaredTypes ?? []).map((declaredType) => ({
      key: `${String(blob.relPath)}#${String(declaredType.name)}`,
      definitionRelPath: blob.relPath,
      typeName: declaredType.name,
      declaredType,
    })),
  );
  const groupKeys = new Set(groups.map((group) => group.key));

  // A reader's imported name resolves to its canonical definition through the resolved index's `local`
  // edges: `(from, importedName) → definitionRelPath`. A same-file type is resolved directly below.
  const localEdgeByReaderName = new Map(
    resolvedIndex.edges.flatMap((edge) =>
      edge.target.kind === 'local' && edge.importedName !== undefined
        ? [[`${String(edge.from)}#${String(edge.importedName)}`, String(edge.target.relPath)]]
        : [],
    ),
  );

  // The names each file declares itself — the SAME-FILE resolution: a type-reference the reader declares
  // resolves to the reader, never through an import edge.
  const declaredNamesByFile = new Map(
    blobs.map((blob) => [String(blob.relPath), new Set((blob.analysis?.declaredTypes ?? []).map((declared) => String(declared.name)))]),
  );

  // One read fact per object-member leaf in every reader, reconciled to the group it feeds. Iterated in
  // sorted reader order so the collected leaves are byte-identical regardless of blob input order.
  const reads = [...blobs]
    .sort((a, b) => (String(a.relPath) < String(b.relPath) ? -1 : 1))
    .flatMap((blob) => {
      const leaves = (blob.analysis?.functions ?? []).flatMap((fn) =>
        fn.branches.flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition })),
      );

      return leaves.flatMap((leaf) => {
        if (leaf.operandTypeRef === undefined) {
          return [];
        }

        const typeName = String(leaf.operandTypeRef);
        const definitionRelPath =
          declaredNamesByFile.get(String(blob.relPath))?.has(typeName) === true
            ? String(blob.relPath)
            : localEdgeByReaderName.get(`${String(blob.relPath)}#${typeName}`);

        return definitionRelPath === undefined || !groupKeys.has(`${definitionRelPath}#${typeName}`)
          ? []
          : [{ key: `${definitionRelPath}#${typeName}`, reader: blob.relPath, leaf }];
      });
    });

  return groups.map((group) => {
    const matching = reads.filter((read) => read.key === group.key);

    return {
      definitionRelPath: group.definitionRelPath,
      typeName: group.typeName,
      declaredType: group.declaredType,
      readers: matching.map((read) => read.reader),
      leaves: matching.map((read) => read.leaf),
    };
  });
};
