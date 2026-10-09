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
 * syntaxTraits().observed({ relPath: 'packages/syntax-repository/src/happy-path/boolean/and/and.ts' });
 * // ['access:named', 'branch:if'] — sorted, deduped
 */
import { readFileSync } from '#gateway/node/fs';
import { resolve, join } from '#gateway/node/path';

import { entryAccessContract, branchNodeContract } from '@assayer/shared/contracts';
import type { FileAnalysis } from '@assayer/shared/contracts';

import { fileWalkBroker } from '../../src/brokers/file/walk/file-walk-broker';
import { analyzeFileBroker } from '../../src/brokers/analyze/file/analyze-file-broker';
import { composeCrossFileMapBroker } from '../../src/brokers/compose/cross-file-map/compose-cross-file-map-broker';
import { composeCrossFilePredicatesBroker } from '../../src/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker';
import { harnessRealizeBroker } from '../../src/brokers/harness/realize/harness-realize-broker';
import { paramTypeResolveBroker } from '../../src/brokers/param-type/resolve/param-type-resolve-broker';
import { stubRealizeBroker } from '../../src/brokers/stub/realize/stub-realize-broker';
import { conditionLeavesTransformer } from '../../src/transformers/condition-leaves/condition-leaves-transformer';
import { moduleGraphProjectionTransformer } from '../../src/transformers/module-graph-projection/module-graph-projection-transformer';
import { builtinModules } from '#gateway/node/module';

const CORE_ROOT = resolve(__dirname, '..', '..');
const SMOKE_REPO = resolve(CORE_ROOT, '..', '..', 'manual-smoke-repo');

// The authoritative node-builtin name set, so a specifier like `path` (no `node:` prefix) still
// classifies as a builtin exactly as the resolver's own builtin check does — never as a package.
const BUILTINS = new Set(builtinModules.map((name) => name).map(String));

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
  | 'branch:ternary'
  | 'param:union'
  | 'param:array'
  | 'param:object'
  // A parameter whose type carries CALL SIGNATURES (`report: (message: string) => string`). Its own
  // trait because a callable is its own descriptor kind: read as an object it would be a property-less
  // shape, so the callback specimen would be indistinguishable from one taking an empty interface and
  // the catalogue could lose the callable reader's coverage in silence.
  | 'param:callable'
  // A fixed-length, HETEROGENEOUS tuple (`readonly [string, number]`). Its own trait for the same
  // reason `param:callable` is: read generically as an object it would enumerate every inherited
  // `ReadonlyArray` method plus undeclared numeric-index properties, so a tuple specimen losing its own
  // descriptor kind would look identical to one Assayer never learned to read at all.
  | 'param:tuple'
  // A template literal type (`` `id-${string}` ``) whose substitutions are not a closed set of literals
  // — one that survives as its OWN descriptor kind rather than collapsing to a plain union of literal
  // strings. Its own trait so a specimen that stopped reading the template structurally would look like
  // an ordinary opaque `unknown` param instead.
  | 'param:template'
  | 'operand:env'
  // A branch whose operand is an OBJECT-MEMBER read (`if (config.mode === 'a')`) — the walk records the
  // property path and the root's type-reference on the leaf, so the branch is admitted UNDRIVEN in the
  // per-file blob and DRIVEN here, where `analyze` applies the same `stub-realize` overlay a run does.
  // Gated so a specimen that quietly stopped capturing the property fact loses the trait rather than
  // keeping the feature's coverage in silence.
  | 'operand:property'
  // A branch that reads a `process.env.<X>` property directly as its operand and compares it against a
  // literal (`process.env.MODE === 'production'`) — the env-object capture the stub stitch guesses from.
  // Distinct from `operand:env`, which is the DRIVABLE `Number(process.env.X)` discriminant: a bare
  // env-member comparison is UNDRIVEN (§5.10 — it types as `any`), yet its literal is a real stub demand.
  // Named off the module graph's `envReads`, so a specimen that stopped capturing the env property loses
  // the trait rather than keeping the feature's coverage in silence.
  | 'env:property'
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
  // The CALLER's debt, and the only admission a harness can pay: a parameter the fill seam refused, so
  // the entry derives no case and is invoiced. It earns a trait for the same reason `undriven` does —
  // an entry whose refusal quietly became fillable keeps every other trait it declares, so without this
  // the matrix could not see a gap appear or vanish. Read off `FileAnalysis.gaps`, which carries the
  // INPUT-shaped gaps alone; the access-shaped ones (a class no instance can be built for) are the run
  // artifact's own producer and never reach the analysis.
  | 'gap:input'
  // The other side of the same channel: a case whose parameter is bound to a harness key path rather
  // than a derived value. Observed off the ARRANGE bindings, so a specimen that quietly lost its
  // colocated harness loses the trait rather than keeping the feature's coverage in silence — its cases
  // would go with it, and a file with no cases and no trait looks nothing like one a harness drives.
  | 'harness:supplied'
  | 'lint:dead-surface'
  // The repo's OTHER debt: an exit whose guards cannot all hold, so no value reaches it. Named off the
  // same lint channel as dead surface, and gating a check for the same reason — a specimen whose dead
  // branch quietly became reachable would keep every other trait it declares, and the catalogue would
  // lose the feature's coverage without a single test turning red.
  | 'lint:unreachable-exit'
  | 'darkspot:ForOfStatement'
  // A ternary the walk understands but cannot yet split into cases where it sits — v1 value-flow reaches
  // only the adjacent `const x = cond ? y : z; return x` tail, so a ternary in ARGUMENT position stays an
  // admitted dark spot. A ratchet: the day the reverse-map rung lands, its specimen moves sad-path → happy.
  | 'darkspot:ConditionalExpression';

export const syntaxTraits = (): {
  analyze: (params: { relPath: string }) => FileAnalysis;
  observed: (params: { relPath: string }) => SyntaxTrait[];
  declaredByContracts: () => SyntaxTrait[];
} => {
  // Imported-type resolution, cross-file predicate composition, object-arrange (stub-realize) AND the
  // colocated harness are CONSUME-TIME overlays, not part of the per-file blob — so the harness applies
  // all of them exactly as a run does, giving `observed()` the real parameter types, the composed guards,
  // the driven object-member branches, the inputs a harness supplies, and any admission the run reports.
  // Each is a
  // same-reference no-op for a specimen it does not touch. Stub overlays are EMPTY here: the catalogue
  // drives from the DERIVED demands, so an object-member branch flips its `undriven` trait without any
  // committed correction — a human correction only changes the arrange VALUES, proven separately by a real
  // run. The harness overlay is not stubbed at all: a specimen's harness is a committed file beside it, so
  // it is read off disk exactly as a run reads it.
  const analyze = ({ relPath }: { relPath: string }): FileAnalysis => {
    const walked = fileWalkBroker({ source: readFileSync(join(SMOKE_REPO, relPath)), relPath, absPath: join(SMOKE_REPO, relPath) });

    const typed = paramTypeResolveBroker({
      analysis: analyzeFileBroker({ walked, relPath }),
      walked,
      root: SMOKE_REPO,
      relPath,
    });

    const composed = composeCrossFilePredicatesBroker({
      analysis: typed,
      walked,
      root: SMOKE_REPO,
      relPath,
    });

    const realized = stubRealizeBroker({ analysis: composed, walked, root: SMOKE_REPO, relPath, overlays: [] });

    const mapped = composeCrossFileMapBroker({ analysis: realized, walked, root: SMOKE_REPO, relPath });

    return harnessRealizeBroker({ analysis: mapped, root: SMOKE_REPO, relPath, walked });
  };

  return {
    analyze,

    // READ OFF THE CONTRACTS, never written down here. The catalogue is meant to represent every
    // construct Assayer models, and only the contracts know what that is — so a kind added to either
    // union appears here the moment it is declared, with no second list to remember to update.
    declaredByContracts: (): SyntaxTrait[] => [
      ...entryAccessContract.options.map((option) => `access:${option.shape.kind.value}` as SyntaxTrait),
      ...branchNodeContract.shape.kind.options.map((kind) => `branch:${kind}` as SyntaxTrait),
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
      // Same yes/no shape as `param:union`, and each gates its own check: an ARRAY param proves the
      // walk reads element types, an OBJECT param proves it enumerates a local shape's properties.
      // Without them the array/object specimens would look like plain branchless functions and the
      // catalogue could lose the type-reading feature's coverage in silence.
      const arrays = analysis.functions
        .flatMap((fn) => fn.entry.params)
        .filter((param) => param.type.kind === 'array')
        .map((): SyntaxTrait => 'param:array');
      const objects = analysis.functions
        .flatMap((fn) => fn.entry.params)
        .filter((param) => param.type.kind === 'object')
        .map((): SyntaxTrait => 'param:object');
      // Same yes/no shape, gating its own check: a CALLABLE param proves the walk reads call signatures
      // ahead of the object branch, which is the only thing separating a callback from an empty shape.
      const callables = analysis.functions
        .flatMap((fn) => fn.entry.params)
        .filter((param) => param.type.kind === 'callable')
        .map((): SyntaxTrait => 'param:callable');
      // Same yes/no shape, gating its own check: a TUPLE param proves the walk reads it as its own
      // fixed-length, heterogeneous kind rather than an anonymous object dump.
      const tuples = analysis.functions
        .flatMap((fn) => fn.entry.params)
        .filter((param) => param.type.kind === 'tuple')
        .map((): SyntaxTrait => 'param:tuple');
      // Same yes/no shape, gating its own check: a TEMPLATE LITERAL param proves the walk reads its
      // literal segments and substitutions structurally rather than dropping it into an opaque unknown.
      const templates = analysis.functions
        .flatMap((fn) => fn.entry.params)
        .filter((param) => param.type.kind === 'template')
        .map((): SyntaxTrait => 'param:template');
      // Same yes/no shape, and it earns a trait for the same reason `param:union` does: a check is
      // gated on it. It is what separates the two identically-shaped module-scope specimens — one
      // reads its operand from the environment and is driven, one does not and is admitted undriven
      // — so without it the matrix could not tell them apart or notice either flipping.
      const envOperands = analysis.functions
        .flatMap((fn) => fn.branches)
        .flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }))
        .filter((leaf) => leaf.operandEnvVarName !== undefined)
        .map((): SyntaxTrait => 'operand:env');
      // Same yes/no shape as `operand:env`, gating its own check: a branch leaf reading an object member
      // (`config.mode`) carries an `operandPropertyPath`, which the walk records for the stub stitch.
      // Without it the object-member specimen would look like a plain opaque undriven branch and the
      // catalogue could lose the property-capture feature's coverage in silence.
      // A TYPED object member (`config.mode`, root type-ref `Config`) carries both `operandPropertyPath`
      // and `operandTypeRef` — the join key the stub stitch keys the object stub on. A `process.env.<X>`
      // read carries a property path but NO type-ref (the ambient `process` is no typed param), so the
      // type-ref requirement is what keeps env reads off this object-member trait and on `env:property`.
      const propertyOperands = analysis.functions
        .flatMap((fn) => fn.branches)
        .flatMap((branch) => conditionLeavesTransformer({ condition: branch.condition }))
        .filter((leaf) => leaf.operandPropertyPath !== undefined && leaf.operandTypeRef !== undefined)
        .map((): SyntaxTrait => 'operand:property');
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
      // The caller's debt, on its own channel, for the same reason `undriven` earns one: a refusal that
      // quietly became fillable moves no access kind and no branch kind, so nothing else here would
      // notice. WHICH parameter is refused, and the invoice's exact wording, are pinned by each
      // specimen's colocated test — this trait only says the entry owes one.
      const gaps = analysis.gaps.map((): SyntaxTrait => 'gap:input');
      // Its counterpart, read off the ARRANGE bindings the overlay produced rather than off a file on
      // disk. A harness proves itself by the case it buys: the binding names the key path the run
      // resolves, so a specimen whose harness stopped being read has no binding to show for it.
      const harnessed = analysis.functions
        .flatMap((fn) => fn.cases)
        .flatMap((testCase) => testCase.arrange)
        .filter((binding) => binding.kind === 'harness')
        .map((): SyntaxTrait => 'harness:supplied');
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
        walked: fileWalkBroker({ source: readFileSync(join(SMOKE_REPO, relPath)), relPath, absPath: join(SMOKE_REPO, relPath) }),
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
      // A `process.env.<X>` read compared directly against a literal — the env-object capture. Named off
      // the same graph's `envReads`, restricted to reads that carry a compared literal so a bare read
      // inside `Number(...)` (the drivable path, already `operand:env`) does not also claim it.
      const envProperties = graph.envReads.some((read) => read.literals.length > 0)
        ? (['env:property'] as SyntaxTrait[])
        : [];

      return [
        ...new Set([
          ...access,
          ...branches,
          ...unions,
          ...arrays,
          ...objects,
          ...callables,
          ...tuples,
          ...templates,
          ...envOperands,
          ...propertyOperands,
          ...callees,
          ...globals,
          ...envProperties,
          ...undriven,
          ...gaps,
          ...harnessed,
          ...lints,
          ...darkSpots,
        ]),
      ].sort();
    },
  };
};
