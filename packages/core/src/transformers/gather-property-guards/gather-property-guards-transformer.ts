/**
 * PURPOSE: Gathers every object-member branch GUARD across a namespace's finished blobs — the seam the
 *   pre-run contradiction check reads, the guard twin of `gather-type-reads`. For each branch that reads
 *   a single-level object member (`if (config.mode === 'a')`) it records the stubbed type's key, the
 *   property, the reader file and the branch LINE, the predicate, and the property's declared type — one
 *   record per guard, so a corrected value that no guard can satisfy is a P1 contradiction naming the
 *   reader:line.
 *
 *   The reader→definition reconciliation is the SAME inversion `gather-type-reads` runs: a same-file
 *   type resolves to the reader; a cross-file type resolves through the resolved index's `local` import
 *   edge. Only a type some blob DECLARES is a guard subject — an unresolvable read contributes nothing,
 *   never a spurious guard. A nested read (`obj.user.role`) is a later rung, so only single-level
 *   reads are gathered. Iterated in sorted reader order for byte-identical output.
 *
 * USAGE:
 * gatherPropertyGuardsTransformer({ blobs, resolvedIndex });
 * // Returns [{ key: 'src/config/config.ts#Config', property: 'mode', reader: 'src/decide.ts', line: 6,
 * //   predicate: { kind: 'eq', literal: 'a' }, operandType: { kind: 'string' } }, …]
 */
import { stubKeyContract } from '@assayer/shared/contracts';
import type { CompiledFileBlob, ResolvedIndex } from '@assayer/shared/contracts';

import { propertyGuardContract } from '../../contracts/property-guard/property-guard-contract';
import type { PropertyGuard } from '../../contracts/property-guard/property-guard-contract';
import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';

export const gatherPropertyGuardsTransformer = ({
  blobs,
  resolvedIndex,
}: {
  blobs: CompiledFileBlob[];
  resolvedIndex: ResolvedIndex;
}): PropertyGuard[] => {
  // Every object type any blob DECLARES, keyed by its definition site — the only guard subjects; a read
  // of a type no blob declares reconciles to nothing and is dropped, never a spurious guard.
  const declaredKeys = new Set(
    blobs.flatMap((blob) => (blob.analysis?.declaredTypes ?? []).map((declared) => `${String(blob.relPath)}#${String(declared.name)}`)),
  );

  // The names each file declares itself — the SAME-FILE resolution: a type-reference the reader declares
  // resolves to the reader, never through an import edge.
  const declaredNamesByFile = new Map(
    blobs.map((blob) => [String(blob.relPath), new Set((blob.analysis?.declaredTypes ?? []).map((declared) => String(declared.name)))]),
  );

  // A reader's imported name resolves to its canonical definition through the resolved index's `local`
  // edges: `(from, importedName) → definitionRelPath`.
  const localEdgeByReaderName = new Map(
    resolvedIndex.edges.flatMap((edge) =>
      edge.target.kind === 'local' && edge.importedName !== undefined
        ? [[`${String(edge.from)}#${String(edge.importedName)}`, String(edge.target.relPath)]]
        : [],
    ),
  );

  return [...blobs]
    .sort((a, b) => (String(a.relPath) < String(b.relPath) ? -1 : 1))
    .flatMap((blob) =>
      (blob.analysis?.functions ?? []).flatMap((fn) =>
        fn.branches.flatMap((branch) =>
          conditionLeavesTransformer({ condition: branch.condition }).flatMap((leaf) => {
            if (
              leaf.operandTypeRef === undefined ||
              leaf.operandPropertyPath === undefined ||
              leaf.operandPropertyPath.length !== 1
            ) {
              return [];
            }

            const typeName = String(leaf.operandTypeRef);
            const definitionRelPath =
              declaredNamesByFile.get(String(blob.relPath))?.has(typeName) === true
                ? String(blob.relPath)
                : localEdgeByReaderName.get(`${String(blob.relPath)}#${typeName}`);

            return definitionRelPath === undefined || !declaredKeys.has(`${definitionRelPath}#${typeName}`)
              ? []
              : [
                  propertyGuardContract.parse({
                    key: stubKeyContract.parse(`${definitionRelPath}#${typeName}`),
                    property: leaf.operandPropertyPath[0],
                    reader: blob.relPath,
                    line: branch.startLine,
                    predicate: leaf.predicate,
                    operandType: leaf.operandType,
                  }),
                ];
          }),
        ),
      ),
    );
};
