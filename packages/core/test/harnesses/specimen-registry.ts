/**
 * PURPOSE: Declares WHAT each catalogue specimen is — the ground truth the matrix runs its checks
 *   from, and the independent half of the declared-vs-observed cross-check.
 *
 *   Authored by READING each specimen, never generated from the analyzer's output. That independence
 *   is the entire value: this project already refuses to derive an expected value by running the
 *   implementation, because such a value cannot disagree with it. The same holds one level up — were
 *   the matrix to ask the analyzer what is in a file, a broken analyzer would agree with itself, run
 *   fewer checks, and go green. Declarations trigger the checks; the analyzer only audits them.
 *
 *   A specimen missing from here fails the catalogue check, so new syntax cannot arrive untested. A
 *   trait here the analyzer cannot see, or a fact it sees that is not here, fails the cross-check —
 *   which is what a forgotten trait looks like.
 *
 * USAGE:
 * specimenRegistry.get(relPathContract.parse('packages/syntax-repository/src/happy-path/boolean/and/and.ts'));
 * // ['access:named', 'branch:if']
 */
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

import type { SyntaxTrait } from './syntax-traits';

const CATALOGUE = 'packages/syntax-repository/src';

// `as const` keeps every trait a literal, so assigning into the branded Map below checks each one
// against the closed vocabulary — a typo fails to typecheck rather than silently matching nothing.
// A specimen's BUCKET is declared by its path: `happy-path/` if running its root file comes out
// clean (≥1 case, all passed, no admission), `sad-path/` if it is meant to come out unclean (a
// failing case, or a dark spot / gap / undriven / lint admission). The bucket is the run verdict a
// human authored; `run-unit-broker.integration.test.ts` checks the real run against it. So a ratchet
// that flips — the loop dark spot the day a handler lands — MOVES buckets here, from sad-path to
// happy-path; it does not just lose a trait. Category folders group examples within a bucket, and
// every example is its own eponymous folder (`<name>/<name>.ts`) so a multi-file rung keeps its
// helper children beside its root.
const DECLARATIONS = {
  // ========================= happy-path/ — root runs fully clean =========================

  // boolean: exported functions guarding a single `if`. Params are number/boolean, so no union
  // fan-out is owed.
  [`${CATALOGUE}/happy-path/boolean/and/and.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/boolean/mixed/mixed.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/boolean/not/not.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/boolean/or/or.ts`]: ['access:named', 'branch:if'],

  // composition: both constructs in one file, which is the point of these rungs.
  [`${CATALOGUE}/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts`]: ['access:named', 'branch:if', 'branch:switch'],
  [`${CATALOGUE}/happy-path/composition/if-in-switch/if-in-switch.ts`]: ['access:named', 'branch:if', 'branch:switch', 'param:union'],
  // `outer` (named) plus `inner` DRIVEN through it (`access:through-caller`), carrying the `branch:if`
  // that is `inner`'s own. `inner` is unexported, so nothing calls it directly — but `outer` passes
  // its own `value` straight in, so the follower drives `inner`'s branch by driving `outer`. The
  // branch belongs to `inner` and is reported on `inner`'s entry, never leaked into `outer`. No
  // `undriven`: following the call graph reaches it, which is the whole point of this rung.
  [`${CATALOGUE}/happy-path/composition/nested-function/nested-function.ts`]: ['access:named', 'access:through-caller', 'branch:if'],
  // `classify` (named) guards on `tooBig(x)`, a same-file boolean predicate whose body is `return
  // n > 50`. The walk reads that guard as a lone opaque `truthy` leaf over the call; compose swaps it
  // for `tooBig`'s own comparison rebased onto `x`, so `classify`'s one `branch:if` derives the sound
  // pair. `tooBig` is a branchless private, projected as no entry of its own — the file has exactly one
  // `access:named` entry and admits nothing.
  [`${CATALOGUE}/happy-path/composition/same-file-predicate/same-file-predicate.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/composition/switch-in-if/switch-in-if.ts`]: ['access:named', 'branch:if', 'branch:switch', 'param:union'],

  // if-else. A class method is reached through an INSTANCE, not as a module property.
  [`${CATALOGUE}/happy-path/if-else/in-class/in-class.ts`]: ['access:method', 'branch:if'],
  [`${CATALOGUE}/happy-path/if-else/in-function/in-function.ts`]: ['access:named', 'branch:if'],
  // The module-scope rung, and it is DRIVEN: `value` is read from the environment, so the environment
  // is its input and each arm is a case that sets it. `operand:env` gates that check, and the absence
  // of `undriven` is the other half — a file Assayer drives must not also admit it cannot. It also
  // reaches ambient globals (`process.env`, `console.log`), so it owes `callee:node-global`.
  [`${CATALOGUE}/happy-path/if-else/pure-statement/pure-statement.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'operand:env'],

  // Branchless callables — a plain function and a branchless class method — each DRIVEN with one case.
  // A branchless callable reaches its single return, so `derive-cases` emits exactly one case per its
  // one exit; there is nothing to admit. `add` is a plain named entry; `greet` is reached through an
  // instance, and its class has no explicit constructor, so the runner can build one and the method is
  // `constructable` (DRIVEN, not a gap). Neither consumes anything external, so no callee trait.
  [`${CATALOGUE}/happy-path/function/function.ts`]: ['access:named'],
  [`${CATALOGUE}/happy-path/class/class.ts`]: ['access:method'],

  // The cross-file example rungs — one per classification the resolver must make, so the catalogue
  // proves each import shape has a specimen. Analyzed single-file here (the stitch that resolves them
  // to definitions is exercised by the resolve-graph harnesses); the trait names WHICH shape.
  //   - `greeting.ts` is the imported definition — a plain exported function, nothing cross-file of its
  //     own, so it owes only `access:named`. It is a CHILD of `uses-greeting/`, not its own example.
  //   - `uses-greeting.ts` CALLS it through a RELATIVE specifier (`./greeting`) ⇒ `callee:import-local`.
  //     Calling an import is a CONSUMPTION site, so its module scope is a DRIVEN entry with one
  //     happy-path case ⇒ `access:module` (importing it runs the call and reaches the module's exit).
  //   - `uses-package.ts` CALLS a BARE-specifier import (`vendored-fixture`) ⇒ `callee:package` — a
  //     consumption site too, so `access:module`.
  //   - `uses-builtin.ts` imports a NODE BUILTIN (`node:path`). It USES the binding as a value rather
  //     than calling it (`const separator = sep`): a called builtin with no ambient types is a resolver
  //     build error, so the compiled surface uses the value — the import edge owes `callee:node-builtin`.
  //     Binding an import as a value is a DATA FLOW into external code, a consumption site, so its module
  //     scope is a DRIVEN entry with one happy-path case ⇒ `access:module`.
  [`${CATALOGUE}/happy-path/import-local/uses-greeting/greeting.ts`]: ['access:named'],
  [`${CATALOGUE}/happy-path/import-local/uses-greeting/uses-greeting.ts`]: ['access:module', 'callee:import-local'],
  [`${CATALOGUE}/happy-path/npm-package/uses-package/uses-package.ts`]: ['access:module', 'callee:package'],
  [`${CATALOGUE}/happy-path/node-builtin/uses-builtin/uses-builtin.ts`]: ['access:module', 'callee:node-builtin'],
  //   - `calls-join.ts` CALLS the builtin (`join(a, b)`) rather than using it as a value: with
  //     `@types/node` in the reader the stitch pulls its signature instead of raising no-usable-types.
  //     Single-file it is still an import edge into a node builtin ⇒ `callee:node-builtin`, and calling
  //     it is a consumption site ⇒ `access:module`.
  [`${CATALOGUE}/happy-path/node-builtin/calls-join/calls-join.ts`]: ['access:module', 'callee:node-builtin'],

  // Ambient node globals used WITHOUT any import — the walk records each as a global use it cannot
  // resolve, for the stitch to type against `@types/node`. Both CALL an ambient global, which is a
  // consumption site, so each module scope is a DRIVEN entry with one happy-path case ⇒ `access:module`
  // alongside the ambient-global callee trait.
  //   - `uses-console.ts` calls `console.log`;
  //   - `uses-process.ts` reads `process.env` and calls `process.cwd()`.
  [`${CATALOGUE}/happy-path/node-global/uses-console/uses-console.ts`]: ['access:module', 'callee:node-global'],
  [`${CATALOGUE}/happy-path/node-global/uses-process/uses-process.ts`]: ['access:module', 'callee:node-global'],

  // ternary in EXIT position — the condition is a real branch, each arm a guarded exit of the return's
  // own kind. `return-basic` is the plainest block return; `return-nested` nests a ternary in the else
  // arm, proving the per-arm recursion fans out to one exit per leaf; `arrow-basic` is the concise
  // arrow whose body IS the ternary, exercising the `handle-function` exit-owning site that never
  // reaches `handle-exit`. All three read their operand from a param, so each is DRIVEN.
  [`${CATALOGUE}/happy-path/ternary/return-basic/return-basic.ts`]: ['access:named', 'branch:ternary'],
  [`${CATALOGUE}/happy-path/ternary/return-nested/return-nested.ts`]: ['access:named', 'branch:ternary'],
  [`${CATALOGUE}/happy-path/ternary/arrow-basic/arrow-basic.ts`]: ['access:named', 'branch:ternary'],
  // VALUE position, driven: `const label = n > 5 ? 'big' : 'small'; return label` IS `return n > 5 ? …`
  // because `label` flows straight to the return. The block seam collapses the tail pair to the same
  // per-arm split an exit ternary gets, so it reads as a plain `branch:ternary` DRIVEN by `n` — no dark
  // spot, one case per arm.
  [`${CATALOGUE}/happy-path/ternary/value-basic/value-basic.ts`]: ['access:named', 'branch:ternary'],

  // ASSUMED ternaries in EXIT position — a short-circuit `&&`/`||` chain, split per operand. Each
  // controlling operand becomes a `ternary` branch on its truthiness and each operand a guarded exit,
  // so a chain of N operands owes N-1 branches and N exits. Both use ≥3 operands, proving the
  // left-associative spine flattens rather than reading only the outermost binary. `or-chain` returns
  // the first truthy operand (falling through to a literal default); `and-chain` is the `&&` mirror,
  // returning the first falsy operand (its last operand the free fall-through). Each operand is a param,
  // so both are DRIVEN.
  [`${CATALOGUE}/happy-path/short-circuit/or-chain/or-chain.ts`]: ['access:named', 'branch:ternary'],
  [`${CATALOGUE}/happy-path/short-circuit/and-chain/and-chain.ts`]: ['access:named', 'branch:ternary'],
  // `??` in exit position — the controlling operand is read as a `non-nullish` leaf (not truthy), so
  // `a ?? b` fans out to the first non-null operand's exit and the null fall-through's. The else arm
  // arranges the operand to `null`, a value the `??` operator inherently admits.
  [`${CATALOGUE}/happy-path/short-circuit/nullish/nullish.ts`]: ['access:named', 'branch:ternary'],
  // A SINGLE-LEVEL optional property access `a?.b` in exit position — an assumed ternary on the
  // receiver's non-nullishness, reusing the same `non-nullish` leaf `??` reads. `s` non-null returns
  // `s.length` (the then exit), `s` null short-circuits to `undefined` (the else exit). Its ONE
  // `optional` probe site observes both, so the null path — which has no expression to wrap — is still
  // driven: `s: string` reuses the B2 string+null machinery, no object representative-value needed.
  [`${CATALOGUE}/happy-path/optional-chain/basic/basic.ts`]: ['access:named', 'branch:ternary'],

  // switch.
  [`${CATALOGUE}/happy-path/switch/in-class/in-class.ts`]: ['access:method', 'branch:switch', 'param:union'],
  [`${CATALOGUE}/happy-path/switch/in-function/in-function.ts`]: ['access:named', 'branch:switch', 'param:union'],
  // The module-scope switch rung, DRIVEN the same way if-else/pure-statement is: `code` comes from
  // `Number(process.env.CODE)`, so the environment is its input and each case writes CODE and imports
  // the module fresh. `operand:env` gates that check; the absence of `undriven` is the other half — a
  // switch reads its discriminant's env source exactly as an `if` reads its operand's.
  [`${CATALOGUE}/happy-path/switch/pure-statement/pure-statement.ts`]: ['access:module', 'branch:switch', 'callee:node-global', 'operand:env'],

  // The NEGATIVE controls, one per contradiction axis — ordinary code every exit reaches, so both run
  // clean and live in happy-path. A solver that flags either has learned to condemn correct code.
  //   - `compatible-guards`: descending numeric thresholds, every exit reachable.
  //   - `bounded-name`: one operand bounded from both sides (`.length >= 2 && .length <= 5`), jointly
  //     satisfiable, so one string satisfies both bounds and NO unreachable-exit lint fires.
  [`${CATALOGUE}/happy-path/unreachable/compatible-guards/compatible-guards.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/length/bounded-name/bounded-name.ts`]: ['access:named', 'branch:if'],

  // ========================= sad-path/ — root is meant to run UNCLEAN =========================

  // A dark spot: no loop handler exists yet, so the for-of is ADMITTED rather than skipped. This is the
  // RATCHET that migrates buckets — the day a loop handler lands it runs clean and moves to happy-path.
  [`${CATALOGUE}/sad-path/loop/in-function/in-function.ts`]: ['access:named', 'darkspot:ForOfStatement'],

  // A ternary in ARGUMENT position (`return label(n > 5 ? 'big' : 'small')`). v1 value-flow reaches only
  // the adjacent `const`+`return` tail, so a ternary consumed by a call arg has no exit to split and
  // stays an admitted `darkspot:ConditionalExpression`. The BOUNDARY ratchet: the day the reverse-map
  // rung lands it moves sad-path → happy-path. `label` is a branchless private consumed by `pick`, so it
  // projects as no entry of its own; the file's one entry is `pick` (access:named).
  [`${CATALOGUE}/sad-path/ternary/arg-position/arg-position.ts`]: ['access:named', 'darkspot:ConditionalExpression'],

  // A run GAP. A class whose constructor needs arguments cannot be instantiated, so both the
  // constructor (reached through `new`, which the runner never models) and its method are named GAPS by
  // case-set-projection — understood perfectly, but the CALLER owes a harness. `tally` is a plain driven
  // `access:named` beside them, so the file keeps a runnable entry; `find`'s own `branch:if` rides its
  // (non-constructable) method entry. This is the ONLY specimen exercising `access:constructor`, which is
  // why it drops off the uncatalogued list below.
  [`${CATALOGUE}/sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.ts`]: ['access:constructor', 'access:method', 'access:named', 'branch:if'],

  // The REPO's debt: a private with real branching that nothing in the file calls, so nothing ever
  // will (an unexported symbol is reachable only from its own file). Rides the LINT channel — "change
  // the code", not "Assayer cannot drive it".
  [`${CATALOGUE}/sad-path/dead-surface/dead-surface.ts`]: ['access:named', 'lint:dead-surface'],

  // UNDRIVEN, the two "welded value, one outcome" shapes at different sites — logic Assayer reads
  // perfectly and no case can steer, because the deciding operand is welded into the source. Distinct
  // from a gap (no harness closes them) and from a dark spot (the syntax is understood). Each file's
  // colocated test pins its verbatim reason.
  //   - `welded-const`: a value welded into a module const;
  //   - `welded-arg`: a private reached only through a caller that welds its argument.
  [`${CATALOGUE}/sad-path/undriven/welded-const/welded-const.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'undriven'],
  [`${CATALOGUE}/sad-path/undriven/welded-arg/welded-arg.ts`]: ['access:named', 'undriven'],
  // UNDRIVEN at the BRANCH, not the whole scope — the deciding value is neither a param nor an env
  // operand, so no case can steer which arm runs. Uniform across branch shapes: the ONLY difference
  // between the two is `if` vs `ternary`. `opaqueIf` guards on a same-file call `decide()`; the
  // derivation cannot arrange a call's result, so its exits derive no case and the branch is admitted
  // undriven at its own line. `opaqueTernary` proves the exact same admission for a ternary condition,
  // one rung of the derivation, not two. `decide` is a branchless private the file calls, projected as
  // no entry of its own — the file's one entry is the named export.
  [`${CATALOGUE}/sad-path/undriven/opaque-if/opaque-if.ts`]: ['access:named', 'branch:if', 'undriven'],
  [`${CATALOGUE}/sad-path/undriven/opaque-ternary/opaque-ternary.ts`]: ['access:named', 'branch:ternary', 'undriven'],

  // UNREACHABLE — guards that contradict, whose finding is a BUILD ERROR (an unreachable-exit lint)
  // rather than a case. An exit behind guards that cannot all hold is dead in the source, so no input
  // reaches it. The rung adds arithmetic over the guard path, not syntax, so the traits look ordinary.
  //   - `sequential-guards` is the whole rung in one function: `>= 1` then `<= 1 || === 0`, so the
  //     fall-through exit needs a value both under 1 and over 1.
  //   - `cross-file-guards` + its two predicate helpers are the CROSS-FILE rung. The contradiction
  //     (`> 50` returns first, so `> 100` can never hold) exists in no single file, which is the point.
  //     The consume-time compose overlay follows each `if`-condition call to its sibling predicate and
  //     rebases the callee's threshold onto `size`, so both guards reach the branch model: the two
  //     reachable exits get sound cases and the dead middle exit rides a `lint:unreachable-exit`, which
  //     keeps the root in sad-path (a lint is an unclean run). Each helper (`exceeds-limit`,
  //     `within-budget`) is a CHILD, `access:named` alone; the root adds the relative imports whose
  //     predicates it composes and the unreachable-exit lint their contradiction yields.
  [`${CATALOGUE}/sad-path/unreachable/sequential-guards/sequential-guards.ts`]: ['access:named', 'branch:if', 'lint:unreachable-exit'],
  [`${CATALOGUE}/sad-path/unreachable/cross-file-guards/cross-file-guards.ts`]: [
    'access:named',
    'branch:if',
    'callee:import-local',
    'lint:unreachable-exit',
  ],
  [`${CATALOGUE}/sad-path/unreachable/cross-file-guards/exceeds-limit.ts`]: ['access:named'],
  [`${CATALOGUE}/sad-path/unreachable/cross-file-guards/within-budget.ts`]: ['access:named'],

  // `contradictory-bounds` nests `.length > 1` inside `.length < 1`, which no string satisfies — the
  // length axis is read over the integers, so this is provably dead where the same bounds on a plain
  // number are not. Second specimen owing `lint:unreachable-exit`, on a different axis from
  // `sad-path/unreachable/sequential-guards`.
  [`${CATALOGUE}/sad-path/length/contradictory-bounds/contradictory-bounds.ts`]: ['access:named', 'branch:if', 'lint:unreachable-exit'],
} as const;

export const specimenRegistry = new Map<RelPath, readonly SyntaxTrait[]>(
  Object.entries(DECLARATIONS).map(([relPath, traits]): [RelPath, readonly SyntaxTrait[]] => [
    relPathContract.parse(relPath),
    traits,
  ]),
);

// The constructs the CONTRACTS declare that no specimen exercises — the catalogue's own blind spots,
// each carrying why. Written down rather than discovered, so shrinking this is a deliberate act and
// growing it is impossible by accident: the coverage check fails the moment a contract gains a member
// nobody catalogued. Otherwise "the catalogue covers every syntax we model" is a claim with nothing
// behind it.
export const uncataloguedTraits = {
  'access:default': 'no specimen uses `export default`',
  'access:unreachable':
    'no ENTRY carries it. An unreachable scope is an unexported helper; the analysis makes it an ' +
    'entry only when a caller drives it, and then the access is `through-caller`, not `unreachable`. ' +
    'A helper no caller drives is reported on `undriven`, which carries no access kind. So the ' +
    'unreachable access the walk records is real but never reaches the access field of an entry — ' +
    '`happy-path/composition/nested-function` is the driven case, `sad-path/undriven/welded-arg` the ' +
    'admitted one.',
} as const;
