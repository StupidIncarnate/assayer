/**
 * PURPOSE: Projects a walked file's locally-declared object shapes into its `declaredTypes` — the
 *   name → full property list every later phase splices per-property value demands onto. It reads the
 *   WALK result (never re-parses) from two channels, and needs both: the walk records each
 *   `interface`/`type` DECLARATION as a declared shape, and it enumerates each same-file object type
 *   into the object descriptors on every scope's params and return type (§5.10 — an imported type is
 *   `any` in the hermetic walk and never enumerated). The declarations alone would miss a shape only a
 *   signature spells inline; the signatures alone would miss every shape this file declares and only a
 *   SIBLING'S reader ever names — which is the whole surface of a types-only module.
 *
 *   Gathering the NAMED objects out of those descriptors is the rest of the projection. Anonymous
 *   shapes carry no name and are omitted; a name seen more than once keeps the fullest property list,
 *   and the set is sorted by name so the blob stays byte-identical.
 *
 * USAGE:
 * declaredTypesProjectionTransformer({ walked: walkFileTransformer({ source, relPath }) });
 * // Returns [{ name: 'Config', properties: [{ name: 'mode', type: {...} }, ...] }]
 */
import type { DeclaredType } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { collectNamedObjectTypesTransformer } from '../collect-named-object-types/collect-named-object-types-transformer';

export const declaredTypesProjectionTransformer = ({ walked }: { walked: WalkFileResult }): DeclaredType[] => {
  if (!walked.success) {
    return [];
  }

  const found = [
    ...walked.declaredShapes.map((declared) => declared.type),
    ...walked.scopes.flatMap((scope) => [...scope.params.map((param) => param.type), scope.returnType]),
  ].flatMap((descriptor) => collectNamedObjectTypesTransformer({ descriptor }));

  // One entry per distinct type name, keeping the fullest property list — a recursive type appears
  // both fully (from the param) and truncated (from its own back-reference), and the full one wins.
  const names = [...new Set(found.map((declared) => String(declared.name)))].sort();

  return names.map((name) =>
    found
      .filter((declared) => String(declared.name) === name)
      .reduce((best, declared) => (declared.properties.length > best.properties.length ? declared : best)),
  );
};
