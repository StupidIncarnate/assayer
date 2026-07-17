/**
 * PURPOSE: Names what the analyzer FOUND in a specimen, in the same closed vocabulary the registry
 *   declares — the observed half of the declared-vs-observed cross-check — and exposes the raw
 *   analysis for checks that need the model itself.
 *
 *   The vocabulary mirrors the contracts: `access:*` is `entryAccessContract`'s discriminated union,
 *   `branch:*` is `branchNodeContract`'s enum, `darkspot:*` names each syntax kind the walk admits it
 *   cannot follow. The trait strings are BUILT from what the analysis reports rather than matched
 *   against a hardcoded list, so a new contract member cannot be mapped to nothing and vanish. It
 *   surfaces as a trait no specimen declares, which fails the cross-check; declaring it then fails to
 *   typecheck until it is added to `SyntaxTrait` and a check is gated on it. That chain is the point:
 *   an analyzer fact no trait names is a construct nobody tests, and the walk already refuses to drop
 *   what it does not recognize — this refuses on the same terms.
 *
 *   Not a `.harness.ts`: it owns no lifecycle, so `it.each` can call it while Jest is still
 *   collecting cases.
 *
 * USAGE:
 * syntaxTraits().observed({ relPath: 'packages/syntax-repository/src/boolean/and.ts' });
 * // ['access:named', 'branch:if'] — sorted, deduped
 */
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { entryAccessContract, branchNodeContract } from '@assayer/shared/contracts';
import type { FileAnalysis } from '@assayer/shared/contracts';

import { tsMorphWalkFileAdapter } from '../../src/adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { analyzeFileBroker } from '../../src/brokers/analyze/file/analyze-file-broker';
import { conditionLeavesTransformer } from '../../src/transformers/condition-leaves/condition-leaves-transformer';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'smoke-repo');

// Closed and literal, so a specimen declaring a trait that does not exist fails to typecheck rather
// than silently never matching. `darkspot:*` is enumerated rather than open for the same reason: a
// newly-unhandled syntax kind should force a decision, not slip in as free-form text.
export type SyntaxTrait =
  | 'access:named'
  | 'access:default'
  | 'access:method'
  | 'access:constructor'
  | 'access:module'
  | 'access:unreachable'
  | 'branch:if'
  | 'branch:switch'
  | 'param:union'
  | 'operand:env'
  | 'undriven'
  | 'darkspot:ForOfStatement';

export const syntaxTraits = (): {
  analyze: (params: { relPath: string }) => FileAnalysis;
  observed: (params: { relPath: string }) => SyntaxTrait[];
  declaredByContracts: () => SyntaxTrait[];
} => {
  const analyze = ({ relPath }: { relPath: string }): FileAnalysis =>
    analyzeFileBroker({
      walked: tsMorphWalkFileAdapter({ source: readFileSync(join(SMOKE_REPO, relPath), 'utf8'), relPath }),
    });

  return {
    analyze,

    // READ OFF THE CONTRACTS, never written down here. The catalogue is meant to represent every
    // construct Assayer models, and only the contracts know what that is — so a kind added to either
    // union appears here the moment it is declared, with no second list to remember to update.
    declaredByContracts: (): SyntaxTrait[] => [
      ...entryAccessContract.options.map((option) => `access:${option.shape.kind.value}` as SyntaxTrait),
      ...branchNodeContract.shape.kind.unwrap().options.map((kind) => `branch:${kind}` as SyntaxTrait),
    ],

    observed: ({ relPath }: { relPath: string }): SyntaxTrait[] => {
      const analysis = analyze({ relPath });

      const access = analysis.functions.map((fn) => `access:${fn.entry.access.kind}` as SyntaxTrait);
      const branches = analysis.functions.flatMap((fn) =>
        fn.branches.map((branch) => `branch:${branch.kind}` as SyntaxTrait),
      );
      // Union-ness is a yes/no question, so only the affirmative earns a trait — the other param
      // kinds gate no check and would be decoration.
      const unions = analysis.functions
        .flatMap((fn) => fn.entry.params)
        .filter((param) => param.type.kind === 'union')
        .map((): SyntaxTrait => 'param:union');
      // Same yes/no shape, and it earns a trait for the same reason `param:union` does: a check is
      // gated on it. It is what separates the two identically-shaped module-scope specimens — one
      // reads its operand from the environment and is driven, one does not and is admitted undriven
      // — so without it the matrix could not tell them apart or notice either flipping.
      const envOperands = analysis.functions
        .flatMap((fn) => fn.branches)
        .flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }))
        .filter((leaf) => leaf.operandEnvVarName !== undefined)
        .map((): SyntaxTrait => 'operand:env');
      // The admission a file owes about itself, and the reason the `undriven/` specimens can be
      // trusted to still prove the feature tomorrow. Without it, a specimen that quietly became
      // drivable would keep every trait it declares — its access and its branch kind do not move —
      // and the catalogue would lose the feature's coverage in silence. That is the exact failure
      // this cross-check exists to make impossible, so the admission has to be declarable.
      //
      // Yes/no, like `param:union`: WHICH of the two reasons is owed is pinned by each specimen's
      // colocated test against the analyzer's actual sentence. A trait per reason cannot be observed
      // honestly anyway — an UndrivenEntry carries no access kind, so splitting it here would mean
      // re-deriving from the reason text a second opinion this model already holds.
      const undriven = analysis.undriven.map((): SyntaxTrait => 'undriven');
      const darkSpots = analysis.darkSpots.map((darkSpot) => `darkspot:${darkSpot.kind}` as SyntaxTrait);

      return [...new Set([...access, ...branches, ...unions, ...envOperands, ...undriven, ...darkSpots])].sort();
    },
  };
};
