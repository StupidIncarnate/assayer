/**
 * PURPOSE: Gives every entry parameter the type its DECLARATION says, where the hermetic walk could
 *   only see `any` — the consume-time overlay that stops Assayer refusing an input it can plainly
 *   build. The walk parses one file with no `node_modules` and no siblings (§5.10), so an IMPORTED type
 *   is opaque there and `fill-param` refuses the parameter: a reader of `Config` is invoiced for "a type
 *   carrying nothing but its name" while the file one over constructs a `Config` happily. This resolves
 *   the reference the signature spelled against the in-repo declaration and hands the derivation the
 *   real shape.
 *
 *   It is the SAME per-run sibling read `stub-realize` and `compose` do, generalized off the question of
 *   how the entry happens to BRANCH: a reader that merely uses the value gets its shape exactly as one
 *   that reads a member does. What comes back is a scalar, a union, an array or an object — whatever the
 *   declaration denotes — so the existing derivation does the rest with nothing added: `derive-cases`
 *   fills the parameter, `array-arrange` fans an array out over cardinality, and `stub-realize` still
 *   drives an object-member branch from the merged stub view.
 *
 *   An OVERLAY, applied where a run is consumed, never baked into the per-file blob: the persisted blob
 *   stays child-independent, and a file whose parameters name no resolvable reference is a
 *   same-reference pass-through that touches no disk. What the overlay does NOT move is the file's own
 *   `declaredTypes` — a sibling's shape is not a shape this file declares, and letting one in would key
 *   its stub on the reader instead of the definition.
 *
 *   Resolution feeds the ONE derivation path rather than a second one: the walk's parameters are
 *   rewritten and `analyze-file-broker` re-projects the file from them, so every downstream fact — the
 *   cases, the gaps, the undriven admissions, the funnels, the enrichment — is what analysis would have
 *   produced had the walk been able to see the type. There is no reconciliation to drift.
 *
 * USAGE:
 * paramTypeResolveBroker({ analysis, walked, root: '/repo', relPath: 'src/reader.ts' });
 * // Returns the FileAnalysis with each opaque parameter typed by its declaration, cases re-derived,
 * // and the input gap it was invoiced for gone
 */
import type { FileAnalysis, TypeDescriptor } from '@assayer/shared/contracts';

import { walkFileResultContract } from '../../../contracts/walk-file-result/walk-file-result-contract';
import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { tsconfigReadBroker } from '../../tsconfig/read/tsconfig-read-broker';
import { collectTypeRefsTransformer } from '../../../transformers/collect-type-refs/collect-type-refs-transformer';
import { substituteConditionTypesTransformer } from '../../../transformers/substitute-condition-types/substitute-condition-types-transformer';
import { substituteTypeRefsTransformer } from '../../../transformers/substitute-type-refs/substitute-type-refs-transformer';
import { typeRefKeyTransformer } from '../../../transformers/type-ref-key/type-ref-key-transformer';
import { analyzeFileBroker } from '../../analyze/file/analyze-file-broker';
import { resolveTypeRefLayerBroker } from './resolve-type-ref-layer-broker';

export const paramTypeResolveBroker = ({
  analysis,
  walked,
  root,
  relPath,
}: {
  analysis: FileAnalysis;
  walked: WalkFileResult;
  root: string;
  relPath: string;
}): FileAnalysis => {
  if (!walked.success) {
    return analysis;
  }

  // Every reference any parameter of any scope names, deduplicated on the reference's declared
  // RENDERING — `Box<string>` and `Box<number>` are two demands under one name, and a name-keyed map
  // would answer one of them with the other's shape. Asked of the WALK's scopes rather than the
  // analysis's entries, because a private the follower drives has parameters too and its refusal is
  // invoiced against the entry that reaches it.
  const refs = [
    ...new Map(
      walked.scopes
        .flatMap((scope) => scope.params)
        .flatMap((param) => collectTypeRefsTransformer({ type: param.type }))
        .map((reference) => [String(typeRefKeyTransformer({ type: reference })), reference] as const),
    ).values(),
  ];

  if (refs.length === 0) {
    return analysis;
  }

  const { options } = tsconfigReadBroker({ searchPath: root });
  const resolved = new Map(
    refs.flatMap((reference) => {
      const type: TypeDescriptor | undefined = resolveTypeRefLayerBroker({
        reference,
        walked,
        relPath,
        root,
        options,
        seen: new Set(),
      });

      return type === undefined ? [] : [[String(typeRefKeyTransformer({ type: reference })), type] as const];
    }),
  );

  if (resolved.size === 0) {
    return analysis;
  }

  // The walk with its INPUT types retyped — the same model, one field deeper. Two things move and they
  // move together: a parameter's declared type, which decides what value can be built for it, and each
  // branch leaf's OPERAND type, which decides what values the arms enumerate. Retype only the first and
  // `level === 'low'` fills both arms with `'low'`, because an opaque operand knows the point to avoid
  // and no member to choose instead — a case predicting one exit while its input reaches the other.
  //
  // A scope's RETURN type stays as the walk read it: it is what the file publishes rather than what a
  // case supplies, and moving it would put a sibling's shape into this file's declared surface.
  const retyped = walkFileResultContract.parse({
    ...walked,
    scopes: walked.scopes.map((scope) => ({
      ...scope,
      params: scope.params.map((param) => ({
        ...param,
        type: substituteTypeRefsTransformer({ type: param.type, resolved }),
      })),
      branches: scope.branches.map((branch) => ({
        ...branch,
        condition: substituteConditionTypesTransformer({ condition: branch.condition, resolved }),
      })),
      ...(scope.predicateSignature === undefined
        ? {}
        : { predicateSignature: substituteConditionTypesTransformer({ condition: scope.predicateSignature, resolved }) }),
    })),
  });

  return {
    ...analyzeFileBroker({ walked: retyped, relPath }),
    // A resolved sibling shape now appears on this file's parameters, and `declared-types-projection`
    // would read it as a shape this file DECLARES — keying its stub on the reader rather than on the
    // definition, so the committed correction beside the definition would no longer match. The file's
    // own declarations are a per-file fact the overlay never touches.
    declaredTypes: analysis.declaredTypes,
  };
};
