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

import { nodeModuleBuiltinsAdapter } from '../../src/adapters/node-module/builtins/node-module-builtins-adapter';
import { tsMorphWalkFileAdapter } from '../../src/adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { analyzeFileBroker } from '../../src/brokers/analyze/file/analyze-file-broker';
import { conditionLeavesTransformer } from '../../src/transformers/condition-leaves/condition-leaves-transformer';
import { moduleGraphProjectionTransformer } from '../../src/transformers/module-graph-projection/module-graph-projection-transformer';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'smoke-repo');

// The authoritative node-builtin name set, so a specifier like `path` (no `node:` prefix) still
// classifies as a builtin exactly as the resolver's own builtin check does — never as a package.
const BUILTINS = new Set(nodeModuleBuiltinsAdapter().map(String));

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
  | 'access:through-caller'
  | 'branch:if'
  | 'branch:switch'
  | 'param:union'
  | 'operand:env'
  // A call target the single-file walk records as an IMPORT and cannot itself resolve — classified by
  // the module specifier's LITERAL VALUE (a relative path, a node builtin, or a bare package), which is
  // the same fork TypeScript's own module resolution takes. The stitch (compile-resolve-graph-broker)
  // turns each into a real definition edge; here the trait only names WHICH of the three an import site
  // exercises, so the catalogue proves every classification the resolver must handle has a specimen.
  | 'callee:import-local'
  | 'callee:package'
  | 'callee:node-builtin'
  // An AMBIENT-EXTERNAL identifier the file uses without importing (`console`, `process`) — recorded by
  // the walk as a global use it cannot itself resolve (the lib resolves `Number`; it does not resolve
  // `process`), for the stitch to type against `@types/node`'s global scope. Named off the module
  // graph's `globalUses`, so a specimen that reaches an ambient global cannot go undeclared.
  | 'callee:node-global'
  | 'undriven'
  | 'lint:dead-surface'
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
      // The admission a file owes about itself, and the reason the `sad-path/` specimens can be
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
      // The repo's debt, on its own channel: a dead-surface lint names a private nothing consumes.
      // Like `undriven`, it gates a check and separates a specimen that quietly became consumed from
      // one that stayed dead — so the catalogue cannot lose the feature's coverage in silence.
      const lints = analysis.lints.map((lint) => `lint:${lint.rule}` as SyntaxTrait);
      const darkSpots = analysis.darkSpots.map((darkSpot) => `darkspot:${darkSpot.kind}` as SyntaxTrait);

      // The cross-file half: an IMPORT the single-file walk recorded but cannot follow. Classified off
      // the module graph rather than the FileAnalysis (which carries only in-file entries), by the
      // specifier's LITERAL VALUE — relative ⇒ local, `node:`/known-builtin ⇒ builtin, else ⇒ package.
      // Reads the EDGES (import declarations), not the references, so an imported binding used as a
      // value (`const s = sep`) is classified the same as one that is called — a node builtin whose
      // ambient types are absent must not be CALLED in the compiled surface, so its specimen imports a
      // value, and the trait still has to name it.
      const graph = moduleGraphProjectionTransformer({
        walked: tsMorphWalkFileAdapter({ source: readFileSync(join(SMOKE_REPO, relPath), 'utf8'), relPath }),
      });
      const callees = graph.edges.flatMap((edge): SyntaxTrait[] => {
        const specifier = edge.specifier === undefined ? undefined : String(edge.specifier);
        if (edge.kind !== 'import' || specifier === undefined) {
          return [];
        }
        return specifier.startsWith('.') || specifier.startsWith('/')
          ? ['callee:import-local']
          : specifier.startsWith('node:') || BUILTINS.has(specifier)
            ? ['callee:node-builtin']
            : ['callee:package'];
      });
      // An ambient global the file reaches without importing — yes/no, like the import callee traits.
      // Named off the SAME graph's `globalUses`, so `console.log`/`process.env` earns the trait no
      // matter which scope uses it, and a specimen that quietly stopped touching an ambient global
      // loses the trait rather than silently keeping the feature's coverage.
      const globals = graph.globalUses.length > 0 ? (['callee:node-global'] as SyntaxTrait[]) : [];

      return [
        ...new Set([...access, ...branches, ...unions, ...envOperands, ...callees, ...globals, ...undriven, ...lints, ...darkSpots]),
      ].sort();
    },
  };
};
