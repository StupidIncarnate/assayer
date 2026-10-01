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
 * specimenRegistry.get('packages/syntax-repository/src/happy-path/boolean/and/and.ts');
 * // ['access:named', 'branch:if']
 */

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
  // A boolean is a closed two-value enumeration: `active === false`'s violating arm is `active`'s only
  // OTHER value, `true` — read off `type.kind === 'boolean'` the same way a union's `!== member` is read
  // off its members. Before that complement, the violating arm named no value distinct from the
  // satisfying one — the seam's own fallback fill for an unconstrained boolean IS `false` — so the else
  // case arranged `active: false` too and failed against correct code.
  [`${CATALOGUE}/happy-path/boolean/eq-false/eq-false.ts`]: ['access:named', 'branch:if'],

  // null: `v === null` reads `NullKeyword` as the literal value `null`, a first-class RepresentativeValue,
  // exactly as `active === false` reads `FalseKeyword`. The hermetic walk parses with strict-null-checks
  // on, so `string | null` arrives as a real two-member union — `v`'s own `operandType` carries both
  // members, which is why the file also owes `param:union`. Before the reader knew `NullKeyword`, this
  // branch read `unrecognized` and was admitted UNDRIVEN — 0 cases, a silent false success.
  [`${CATALOGUE}/happy-path/null/eq-null/eq-null.ts`]: ['access:named', 'branch:if', 'param:union'],

  // composition: both constructs in one file, which is the point of these rungs.
  [`${CATALOGUE}/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts`]: ['access:named', 'branch:if', 'branch:switch'],
  [`${CATALOGUE}/happy-path/composition/if-in-switch/if-in-switch.ts`]: ['access:named', 'branch:if', 'branch:switch', 'param:union'],
  // `classify` (named) guards on `tooBig(x)`, a same-file boolean predicate whose body is `return
  // n > 50`. The walk reads that guard as a lone opaque `truthy` leaf over the call; compose swaps it
  // for `tooBig`'s own comparison rebased onto `x`, so `classify`'s one `branch:if` derives the sound
  // pair. `tooBig` is a branchless private, projected as no entry of its own — the file has exactly one
  // `access:named` entry and admits nothing.
  [`${CATALOGUE}/happy-path/composition/same-file-predicate/same-file-predicate.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/composition/switch-in-if/switch-in-if.ts`]: ['access:named', 'branch:if', 'branch:switch', 'param:union'],
  // The `function/nested` funnel in the dominant function style of modern TypeScript: `classify` is a
  // private declared as a CONST-BOUND ARROW and `report` calls it by NAME. Resolving that callee off the
  // declaration's KIND is what makes it a local link at all — read as unresolvable it is reached by
  // nothing, so a private the exported entry calls four lines below is invoiced as dead surface and its
  // driving route never runs. Driven instead: `report`'s only exit returns the call, so `classify`'s arms
  // FUNNEL into it and `report` is the SOLE entry. Like every funnel, the private's `if` drives the
  // funnel rather than surfacing on the entry, so the file owes only `access:named` and admits nothing;
  // the two funnel cases are pinned by the colocated test.
  [`${CATALOGUE}/happy-path/composition/const-arrow-callee/const-arrow-callee.ts`]: ['access:named'],
  // The `through-caller` twin of `const-arrow-callee`, one folder over: `report` calls `classify(n)`
  // UNCONDITIONALLY but its own exit does not RETURN the call — it discards the result — so `classify`
  // cannot fold into `report`'s case set the way a funnel does. The follower instead promotes it to its
  // OWN entry, access `through-caller`, driven with `report`'s own `n` threaded straight through. This
  // is the only shape that puts `access:through-caller` on an entry at all: a private FUNNELS whenever
  // its caller's exit returns the call, so a private a caller reaches but does not return is what is
  // left over.
  [`${CATALOGUE}/happy-path/composition/through-caller/through-caller.ts`]: ['access:named', 'access:through-caller', 'branch:if'],

  // if. A bare `if` with NO else, in TAIL position, whose only arm does not itself terminate. With no
  // else the `then` arm's fallthrough and the missing else converge on the exact same physical
  // continuation — the enclosing scope's own unaccounted-for exit — so `handle-if` mints NO completion
  // of its own here; both buckets (condition true, condition false) predict that ONE exit, the first
  // salient and the second the grayed twin. Before the fix `handle-if` minted a SECOND, always-firing
  // completion for the `then` arm, so a real run observed both probes and the `then` case failed
  // against correct code — this is the specimen that pins the defect stays fixed.
  [`${CATALOGUE}/happy-path/if/no-else/no-else.ts`]: ['access:named', 'branch:if'],

  // if-else. A class method is reached through an INSTANCE, not as a module property.
  [`${CATALOGUE}/happy-path/if-else/in-class/in-class.ts`]: ['access:method', 'branch:if'],
  [`${CATALOGUE}/happy-path/if-else/in-function/in-function.ts`]: ['access:named', 'branch:if'],
  // The module-scope rung, and it is DRIVEN: `value` is read from the environment, so the environment
  // is its input and each arm is a case that sets it. `operand:env` gates that check, and the absence
  // of `undriven` is the other half — a file Assayer drives must not also admit it cannot. It also
  // reaches ambient globals (`process.env`, `console.log`), so it owes `callee:node-global`.
  [`${CATALOGUE}/happy-path/if-else/pure-statement/pure-statement.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'operand:env'],

  // The function/ category — one rung per function DEFINITION shape, each DRIVEN. A branchless callable
  // reaches its single return, so `derive-cases` emits one case per exit; a branching one derives the
  // sound pair from its `if`.
  //   - `declaration` is a plain named function declaration (`add`, branchless, one case).
  //   - `expression` and `arrow` are UNNAMED functions bound to an exported const — a function
  //     expression and a block-bodied arrow. The const supplies the entry name, so each is analysed
  //     exactly as a declaration and its `if` drives; the arrow syntax changes nothing.
  //   - `nested` is a nested function FUNNELLED into the surface that returns it: `outer`'s only exit is
  //     `return inner(value)`, so `inner` cannot be reached without calling `outer` — its steering values
  //     fold into `outer`'s own two cases (each pathing through inner's exit then outer's return), and
  //     `outer` is the SOLE entry. `inner`'s `if` drives the funnel rather than riding a `through-caller`
  //     entry, so the file surfaces only `access:named`; no `undriven` — the call graph reaches it.
  //   - `deep-nested` is the TRANSITIVE twin — `outer` returns `middle(value)` and `middle` returns
  //     `inner(m)` — so BOTH hops funnel into `outer`, its three cases each predicting the full path
  //     through inner's exit, then middle's, then outer's return. Still only `access:named`, still nothing
  //     admitted: a function in a function in a function, driven entirely through the surface.
  //   - `iife` is an immediately-invoked function expression driven at MODULE LOAD: it runs when the file
  //     is imported, so its env-BODY read (`const n = Number(process.env.SIZE)`) makes the environment an
  //     input and each arm is a case that sets the variable, exactly like the module-scope env branch one
  //     scope deeper. Its entry ACCESS is `module` (the surface renders it by the file's label); it owes
  //     `operand:env` and `callee:node-global` (`process.env`). (A welded-ARGUMENT IIFE runs UNCLEAN — one
  //     arm a case, the other an unreachable-exit — so it lives under sad-path/unreachable/iife. A callback,
  //     a returned closure, or an uncalled nested function is admitted, so those live under sad-path/ too.)
  [`${CATALOGUE}/happy-path/function/declaration/declaration.ts`]: ['access:named'],
  [`${CATALOGUE}/happy-path/function/expression/expression.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/function/arrow/arrow.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/function/nested/nested.ts`]: ['access:named'],
  [`${CATALOGUE}/happy-path/function/deep-nested/deep-nested.ts`]: ['access:named'],
  [`${CATALOGUE}/happy-path/function/iife/iife.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'operand:env'],
  // A branchless class method — reached through an instance; its class has no explicit constructor, so
  // the runner builds one and the method is `constructable` (DRIVEN, not a gap).
  [`${CATALOGUE}/happy-path/class/class.ts`]: ['access:method'],

  // export-default: the export forms whose keyword is NOT on the declaration. `const decide = …;
  // export default decide;` exports exactly what `export default function decide` does, and only the
  // module's resolved export table says so — the statement is three lines further down. Read off the
  // keyword instead, the const is private, its entry vanishes, and the file's only surface is reported
  // as dead code the repo should delete. So the trait to watch is `access:default` on a CONST, and the
  // absence of `lint:dead-surface` beside it.
  [`${CATALOGUE}/happy-path/export-default/const-default/const-default.ts`]: ['access:default', 'branch:if'],

  // Type-reading rungs — branchless functions whose whole point is the PARAM shape the walk reads.
  //   - `element-length` takes `number[]`: the walk reads the ARRAY's element type structurally rather
  //     than dropping it into an opaque `unknown`. `param:array` gates that check. Branchless, but an
  //     array param FANS OUT over cardinality, so it derives THREE cases (empty/one/many); no object
  //     shape, so no declaredTypes.
  //   - `local-shape` takes a locally-declared `interface Config`: the walk ENUMERATES the same-file
  //     object type's full property list (§5.10 — only local declarations resolve in the hermetic walk),
  //     and it is projected into the file's `declaredTypes`. `param:object` gates that. Branchless and
  //     DRIVEN with one case.
  [`${CATALOGUE}/happy-path/array/element-length/element-length.ts`]: ['access:named', 'param:array'],
  // Array-OPERATION rungs — the same `number[]` param read structurally, consumed by every everyday
  // array operation. Each is branchless, and an array param FANS OUT over cardinality (empty/one/many),
  // so each derives THREE cases reaching one exit — the salient `[7]` plus the grayed `[]`/`[7,7]` twins;
  // a two-param op fixes its scalar across the three. A builtin method or index op is not a reportable
  // callee and no object shape is declared, so each owes only `access:named` + `param:array` and admits
  // nothing. `pop`/`shift`/`at` annotate `number | undefined`; the walk reads that as a real two-member
  // union on the RETURN type. `param:union` tracks entry PARAMS only, so it is not owed here — each
  // param stays `number[]`. `nested` takes `number[][]`, arranged as real nested arrays (`[[7]]`, and
  // `many` is `[[7],[7]]` since only the top param fans out). The `const-*` rungs bind an array to a
  // const: `const-alias` aliases the param (still driven, 3 cases), while `const-literal` reads a LOCAL
  // literal array with no array PARAM — one case, `access:named` alone. `map`'s `(n) => n*2` callback is
  // an anonymous scope the walk descends without promoting to an entry, so it stays a clean 3-case rung.
  // Adding a new array operation is a folder here plus one line; the cardinality matrix is free.
  [`${CATALOGUE}/happy-path/array/pop/pop.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/shift/shift.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/unshift/unshift.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/at/at.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/index-access/index-access.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/element-assign/element-assign.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/spread/spread.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/slice/slice.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/map/map.ts`]: ['access:named', 'param:array'],
  // `map-conditional`'s callback BRANCHES on the element (`items.map((n) => { if (n > 100) … })`). The
  // callback cannot be reached without calling `rescale` — calling it runs `.map`, which runs the
  // callback per element — so it is NO separate entry: its branches FUNNEL into rescale's own case set.
  // rescale (branchless, single-exit) is the sole entry, its cases the array shapes that drive each arm
  // (`[]`, `[101]`, `[-1]`, `[100]`, and the arm-crossing `[101, -1]`), each predicting the callback's
  // exit path then rescale's return. So the file surfaces only `access:named` + `param:array`: the
  // callback's `branch:if` drives the funnel rather than riding a `through-caller` entry, and the exact
  // five funnel cases are pinned by the colocated test. Clean run — no admission — hence happy-path.
  [`${CATALOGUE}/happy-path/array/map-conditional/map-conditional.ts`]: ['access:named', 'param:array'],
  // `string-element` is the STRING twin of map-conditional: `labelTags`'s callback branches on STRING
  // operands (`tag === 'urgent'`, `tag.length > 8`), so the funnelled single element values are STRINGS,
  // never a hardcoded number — proof the funnel reads each operand's TYPE. Same shape otherwise: the
  // callback is no separate entry, its arms funnel into labelTags's own five cases, clean run.
  [`${CATALOGUE}/happy-path/array/string-element/string-element.ts`]: ['access:named', 'param:array'],
  // `two-maps` maps TWO branching callbacks over TWO distinct array params (`xs.map((n) => …)` and
  // `ys.map((m) => …)`). Neither callback can be reached without calling `pipeline`, so BOTH funnel into
  // its own case set — and because the callbacks fire over INDEPENDENT arrays, the funnel is the
  // CARTESIAN of each callback's per-element funnel: each array param fans over its four shapes (empty,
  // the `then`-element, the `else`-element, the arm-crossing pair), and every pairing is a distinct
  // input, so pipeline is a single entry with 4 × 4 = 16 cases, each arranging BOTH arrays (never a
  // scalar fill) and threading A's exits, then B's, then pipeline's return. So the file surfaces only
  // `access:named` + `param:array`: both callbacks' `branch:if` drive the one funnel rather than riding
  // separate `through-caller` entries, and the exact sixteen cases are pinned by the colocated test.
  // Clean run — no admission — hence happy-path.
  [`${CATALOGUE}/happy-path/array/two-maps/two-maps.ts`]: ['access:named', 'param:array'],
  // `sibling-fill` maps ONE branching callback over `values` while a SECOND array param `extra` is used
  // PASSIVELY (`scaled.concat(extra)`, never mapped). Only `values` funnels — its four shapes (`[]`,
  // `[101]`, `[100]`, the arm-crossing `[101, 100]`) drive scaleAndAppend's own cases — while `extra` is
  // FILLED with a real one-element array `[7]` in every case, never a scalar `'abc123'` string that
  // `.concat` would throw on. That fill is the point this pins; otherwise a clean funnel, hence
  // happy-path, so the file surfaces only `access:named` + `param:array`.
  [`${CATALOGUE}/happy-path/array/sibling-fill/sibling-fill.ts`]: ['access:named', 'param:array'],
  // `stub-sibling-array` is sibling-fill's OTHER half: the array param `extra` sits beside an OBJECT param
  // whose `config.mode` branch is driven at consume time by stub-realize, not by a funnel. Both sites route
  // through `fill-param`, so `extra` gets the same real `[7]` either way — which is what one fill authority
  // buys. Two cases, both passing, nothing admitted, hence happy-path. It declares `Config` locally and
  // reads a member of it, so it owes `param:object` + `operand:property` on top of `param:array`.
  [`${CATALOGUE}/happy-path/array/stub-sibling-array/stub-sibling-array.ts`]: [
    'access:named',
    'branch:if',
    'operand:property',
    'param:array',
    'param:object',
  ],
  // `cross-file-map` maps an IMPORTED function over its array param (`items.map(bandReading)`, `bandReading`
  // from `./band-reading`). The imported callee cannot be reached without calling `bandReadings`, so its
  // branches FUNNEL into bandReadings' own case set CROSS-FILE — the same fold as map-conditional's inline
  // callback, except the callback scope comes from the SIBLING file, so its exits keep the sibling's own
  // coverage ids. bandReadings (branchless, single-exit) is the sole entry, its five cases the array shapes
  // that drive each of the callee's three bands (`[]`, `[80]`, `[19]`, `[79]`, and the arm-crossing
  // `[80, 19]`), each pathing through the sibling's band exit then bandReadings' return. A consume-time
  // overlay resolves the import to its sibling on disk, and the run writes the sibling's probe plan so its
  // exits fire — a clean run, hence happy-path. It imports a relative specifier (`callee:import-local`) and
  // reads an array param (`param:array`). A MULTI-FILE rung: its helper child `band-reading.ts` — a plain
  // 3-arm function with thresholds 80/20 (deliberately unlike map-conditional's 100/0) — sits beside it and
  // is driven on its own as `access:named` + `branch:if`.
  [`${CATALOGUE}/happy-path/array/cross-file-map/cross-file-map.ts`]: ['access:named', 'callee:import-local', 'param:array'],
  [`${CATALOGUE}/happy-path/array/cross-file-map/band-reading.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/array/nested/nested.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/const-alias/const-alias.ts`]: ['access:named', 'param:array'],
  [`${CATALOGUE}/happy-path/array/const-literal/const-literal.ts`]: ['access:named'],
  [`${CATALOGUE}/happy-path/object/local-shape/local-shape.ts`]: ['access:named', 'param:object'],

  // An INTERSECTION of two same-file interfaces (`v: Ay & Bee`). Not `isObject()` to the checker, but
  // `getProperties()` on the intersection already returns the MERGED members, so it reads through the
  // exact same branch a plain object does — `param:object`, not a trait of its own. Branchless and
  // DRIVEN with one case, its arrange the merged shape both interfaces declare.
  [`${CATALOGUE}/happy-path/object/intersection/intersection.ts`]: ['access:named', 'param:object'],

  // Object-member branches, DRIVEN at consume time by stub-realize: it arranges the object param from the
  // merged stub view (derived per-property demands + the committed `assayer/stubs/` overlay), so each arm
  // becomes a driven case and the per-file `undriven` admission drops — a clean run, hence happy-path.
  // These DRIVE via stub-realize; they still capture the operand:property fact the stub view keys on.
  //   - `branch-local` declares `Config` and reads `config.mode` in one file (`param:object`), and a
  //     committed correction (`assayer/stubs/.../Config.json`) proves a human value flows into a real case.
  //   - `cross-file-shape` (ROOT) + `reader-b` each import `Config` (`callee:import-local`) and guard on a
  //     member of it. Their param IS an object (`param:object`) — the hermetic walk cannot see that, so
  //     `param-type-resolve` reads the declaration off `types.ts` at consume time, and stub-realize then
  //     arranges each arm from the merged stub view.
  //   - `types.ts` (CHILD) declares the interface and a branchless `withDefaults(config: Config)` that
  //     enumerates its full shape (`param:object`) — the definition stub-realize reads, not a reader.
  [`${CATALOGUE}/happy-path/object/branch-local/branch-local.ts`]: ['access:named', 'branch:if', 'operand:property', 'param:object'],
  [`${CATALOGUE}/happy-path/object/cross-file-shape/cross-file-shape.ts`]: ['access:named', 'branch:if', 'callee:import-local', 'operand:property', 'param:object'],
  [`${CATALOGUE}/happy-path/object/cross-file-shape/reader-b.ts`]: ['access:named', 'branch:if', 'callee:import-local', 'operand:property', 'param:object'],
  [`${CATALOGUE}/happy-path/object/cross-file-shape/types.ts`]: ['access:named', 'param:object'],

  // `config.db.retry`, a property path more than one segment deep — the SAME `branch-local` shape, one
  // level further in. `object-arrange` and `collect-property-demands` both recurse into `db`'s own
  // shape, so stub-realize drives this exactly as it drives a one-segment `config.mode` read: both arms
  // become real cases, `db` built out as a real nested object rather than left unconstrained.
  [`${CATALOGUE}/happy-path/object/property-depth/property-depth.ts`]: ['access:named', 'branch:if', 'operand:property', 'param:object'],

  // The imported shape a reader merely USES — no branch reads a member of it, so nothing about the
  // entry's own control flow could rescue the type. `param-type-resolve` reads the declaration off the
  // sibling at consume time and the parameter fills, which is why an ordinary reader stops being invoiced
  // for an input the file next door constructs happily.
  //   - `cross-file-reader` (ROOT) imports `Settings` (`callee:import-local`) and returns a member of it.
  //     `param:object` is what the resolution gives it; the hermetic walk alone sees an opaque type.
  //   - `settings.ts` (CHILD) declares the interface and a branchless `withDefaults(settings: Settings)`
  //     that enumerates its full shape — the definition the reader's resolution reads.
  [`${CATALOGUE}/happy-path/object/cross-file-reader/cross-file-reader.ts`]: ['access:named', 'callee:import-local', 'param:object'],
  [`${CATALOGUE}/happy-path/object/cross-file-reader/settings.ts`]: ['access:named', 'param:object'],

  // The GENERIC twin of the reader above. `type Box<T> = { value: T }` denotes nothing constructible on
  // its own — only `Box<string>` says what `T` is — so the reference's type ARGUMENTS have to travel to
  // the declaration and fill its type parameters by position. Without them the resolution answers with
  // a shape whose property is still the placeholder `T`, and an ordinary reader of an ordinary alias is
  // invoiced for an input the file next door describes in full.
  //   - `generic-alias` (ROOT) imports `Box` (`callee:import-local`) and takes `Box<string>`.
  //   - `box.ts` (CHILD) declares the alias and a branchless `rewrap(box: Box<number>)`, the SAME-FILE
  //     half where the checker instantiates the generic itself.
  [`${CATALOGUE}/happy-path/object/generic-alias/generic-alias.ts`]: ['access:named', 'callee:import-local', 'param:object'],
  [`${CATALOGUE}/happy-path/object/generic-alias/box.ts`]: ['access:named', 'param:object'],

  // The PLAIN (non-generic) twin of `local-shape.ts`: `type Config = { … }` instead of `interface
  // Config { … }`. Downstream the two are indistinguishable — an object's name is its ALIAS symbol's
  // whenever the object symbol itself is the anonymous `__type` a `type` produces (CLAUDE.md §3) — so
  // this specimen's own analysis is the same shape `local-shape.ts` pins, just reached through the
  // OTHER declaration kind `handle-type-declaration` reads.
  [`${CATALOGUE}/happy-path/object/type-alias/type-alias.ts`]: ['access:named', 'param:object'],

  // A DECLARATION-ONLY module: one exported interface, no signature anywhere in the file that mentions
  // it, so no scope's params or return type carry an object descriptor to enumerate `Config` through —
  // only the DECLARATION channel of `declared-types-projection` populates `declaredTypes` here
  // (CLAUDE.md §3). No exported function and no top-level branch/call/value-use/global-call means
  // `analysisProjectionTransformer` finds nothing worth an entry, so the file derives ZERO functions and
  // ZERO cases — no `access:*` trait at all, since that trait rides an ENTRY and this file has none.
  // Ruled happy-path anyway: nothing to run is not a failure, and a declared-but-unconsumed type is
  // testable surface for whoever consumes it, never a debt this file owes on its own.
  [`${CATALOGUE}/happy-path/object/types-only/types-only.ts`]: [],

  // The harness rungs — the PAID half of the input-gap channel, and the only place `harness:supplied`
  // is observed. Each is byte-for-byte the source of its `sad-path/input-gap/` twin, plus one committed
  // `<basename>.harness.ts` beside it; the harness is the only difference between the two specimens, so
  // the pair is a controlled experiment rather than two files that happen to disagree. The overlay
  // re-derives the invoiced entry through the same case engine with the supplied parameter bound to
  // `inputs.<entry>.<param>`, so each case differs from an ordinary derived one in exactly that binding
  // — and the run RESOLVES it, loading the same harness file the compile read. Both come out clean, so
  // both live in happy-path; each carries the trait of the parameter kind the harness answers.
  //   - `callback-param` supplies a CALLABLE (`report`).
  //   - `object-param` supplies a whole SHAPE (`sink: Sink`): a refused object is refused entire, so one
  //     key names the parameter rather than the `write` member inside it.
  [`${CATALOGUE}/happy-path/harness/callback-param/callback-param.ts`]: [
    'access:named',
    'branch:if',
    'harness:supplied',
    'param:callable',
  ],
  [`${CATALOGUE}/happy-path/harness/object-param/object-param.ts`]: [
    'access:named',
    'branch:if',
    'harness:supplied',
    'param:object',
  ],

  // union: a union whose members are NOT all scalars. A value of ONE member is a value of the union, so
  // the descriptor keeps `Marker | string` whole and the fill seam builds the half it can; degrading on
  // the first non-scalar member refused the type for the half nothing can build. The scalar branch beside
  // it is what proves the union parameter had to be fillable for any case to derive at all.
  [`${CATALOGUE}/happy-path/union/mixed-union/mixed-union.ts`]: ['access:named', 'branch:if', 'param:union'],

  // typeof: `typeof target === 'string'` narrows `target`'s own declared union by which member's
  // runtime tag the comparison names — the `string` member answers the then arm, the `number` member
  // answers the else. Every member has a scalar point, so both arms realize a real, distinguishing
  // value and the branch is fully driven: two cases, no admission. `param:union` is what the branch
  // narrows; `branch:if` is the shape it narrows through.
  [`${CATALOGUE}/happy-path/typeof/typeof-narrow/typeof-narrow.ts`]: ['access:named', 'branch:if', 'param:union'],

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
  // The scoped twin of `uses-console`: the SAME ambient call, nested inside a named, exported function
  // instead of sitting at the file's own top level. `console.log` still earns `callee:node-global` — the
  // trait is named off `graph.globalUses`, which does not care which scope reached it — but `report` is
  // never CALLED at import time, only exported, so the module scope earns no entry: `access:named` alone,
  // never `access:module` beside it.
  [`${CATALOGUE}/happy-path/node-global/nested-console/nested-console.ts`]: ['access:named', 'callee:node-global'],

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
  // arranges the operand to `null`, a value the `??` operator inherently admits. `a: string | null`
  // arrives as a real union, so `param:union` is owed alongside the branch.
  [`${CATALOGUE}/happy-path/short-circuit/nullish/nullish.ts`]: ['access:named', 'branch:ternary', 'param:union'],
  // A SINGLE-LEVEL optional property access `a?.b` in exit position — an assumed ternary on the
  // receiver's non-nullishness, reusing the same `non-nullish` leaf `??` reads. `s` non-null returns
  // `s.length` (the then exit), `s` null short-circuits to `undefined` (the else exit). Its ONE
  // `optional` probe site observes both, so the null path — which has no expression to wrap — is still
  // driven: `s: string | null` arrives as a real union, so `param:union` is owed alongside the branch,
  // and no object representative-value is needed.
  [`${CATALOGUE}/happy-path/optional-chain/basic/basic.ts`]: ['access:named', 'branch:ternary', 'param:union'],

  // switch.
  [`${CATALOGUE}/happy-path/switch/in-class/in-class.ts`]: ['access:method', 'branch:switch', 'param:union'],
  [`${CATALOGUE}/happy-path/switch/in-function/in-function.ts`]: ['access:named', 'branch:switch', 'param:union'],
  // The module-scope switch rung, DRIVEN the same way if-else/pure-statement is: `code` comes from
  // `Number(process.env.CODE)`, so the environment is its input and each case writes CODE and imports
  // the module fresh. `operand:env` gates that check; the absence of `undriven` is the other half — a
  // switch reads its discriminant's env source exactly as an `if` reads its operand's.
  [`${CATALOGUE}/happy-path/switch/pure-statement/pure-statement.ts`]: ['access:module', 'branch:switch', 'callee:node-global', 'operand:env'],
  // The switch twin of `if/no-else`: a tail switch with NO default, whose case clauses fall through
  // rather than returning. With no default every clause's fallthrough and the wholly-unmatched path
  // converge on the SAME physical continuation, so `handle-switch` mints no per-clause completion
  // either — both cases (`'get'`, `'post'`) predict the one enclosing `exit@top`, the first salient
  // and the second grayed. Before the fix each clause got its own always-firing completion stacked on
  // top of the enclosing one, so a real run observed both probes and every case failed against correct
  // code.
  [`${CATALOGUE}/happy-path/switch/no-default/no-default.ts`]: ['access:named', 'branch:switch', 'param:union'],

  // tsx: the FILE-EXTENSION rung — a `.tsx` component, read exactly as a `.ts` file otherwise. `Badge`
  // branches on the `urgent` param the same way any boolean branch does; the JSX each arm RETURNS never
  // enters analysis (P4 — an expression is descended for the scopes/calls it might hide, not analysed
  // for its value), so the returned `<strong>`/`<span>` elements carry no trait of their own. What this
  // pins is that `specimen-catalogue`, the compiler's own inclusion rule, and the walk's parse all treat
  // `.tsx` as analysed surface.
  [`${CATALOGUE}/happy-path/tsx/component/component.tsx`]: ['access:named', 'branch:if'],

  // The NEGATIVE controls, one per contradiction axis — ordinary code every exit reaches, so both run
  // clean and live in happy-path. A solver that flags either has learned to condemn correct code.
  //   - `compatible-guards`: descending numeric thresholds, every exit reachable.
  //   - `bounded-name`: one operand bounded from both sides (`.length >= 2 && .length <= 5`), jointly
  //     satisfiable, so one string satisfies both bounds and NO unreachable-exit lint fires.
  [`${CATALOGUE}/happy-path/unreachable/compatible-guards/compatible-guards.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/happy-path/length/bounded-name/bounded-name.ts`]: ['access:named', 'branch:if'],
  // The ARRAY twin of `bounded-name`: a `.length` guard on an array param, not a string. An array has no
  // scalar point, so its length can only be realized by building a real array AT a permitted length —
  // never the cardinality fan-out's own empty/one/many classes, which top out at two elements and can
  // never reach `length > 3`. `param:array` gates the read; the cases pin that each arm now arranges an
  // array whose length actually decides it, rather than one every case shares regardless of the guard.
  [`${CATALOGUE}/happy-path/length/array-guard/array-guard.ts`]: ['access:named', 'branch:if', 'param:array'],

  // A fixed-length, HETEROGENEOUS tuple param (`readonly [string, number]`). `isObject()` to the
  // checker too, but read as its OWN `tuple` kind before the object branch — one descriptor per fixed
  // position, never an anonymous object enumerating `0`, `1`, `length` and every inherited
  // `ReadonlyArray` method. That symptom is what kept this specimen in `sad-path/run-gap/` before the
  // reader gained its own tuple kind; it MOVES here now that the fill seam builds a real value for it —
  // a real two-element array, a string at position 0 and a number at position 1. `param:tuple` gates
  // the read; branchless, one case.
  [`${CATALOGUE}/happy-path/tuple/tuple-param/tuple-param.ts`]: ['access:named', 'param:tuple'],

  // A template literal type param (`` t: `id-${string}` ``) whose one substitution is plain `string`,
  // not a closed set of literals — a genuine template, never pre-collapsed into a union. `param:template`
  // gates the read. The fill seam builds it as a plain interpolated STRING, the substitution's own
  // representative point joined between the type's literal segments, so it fills as a scalar `param`
  // binding rather than a composite. Branchless, one case.
  [`${CATALOGUE}/happy-path/template-literal/basic/basic.ts`]: ['access:named', 'param:template'],

  // ========================= sad-path/ — root is meant to run UNCLEAN =========================

  // A dark spot: no loop handler exists yet, so the for-of is ADMITTED rather than skipped. This is the
  // RATCHET that migrates buckets — the day a loop handler lands it runs clean and moves to happy-path.
  // `sumAll(items: number[])` also owes `param:array`: the walk reads its array element type whether or
  // not it can follow the loop that consumes it.
  [`${CATALOGUE}/sad-path/loop/in-function/in-function.ts`]: ['access:named', 'param:array', 'darkspot:ForOfStatement'],

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
  // The NESTED twin — `unused` declared inside `outer`, called by nobody and passed nowhere. It keeps
  // the callback fix honest: a nested function that looks like a callback is STILL dead surface when
  // nothing reaches it. Being nested does not rescue it; being REACHED (as an argument, or over an
  // array) is what separates a driven/undriven callback from this dead one.
  [`${CATALOGUE}/sad-path/dead-surface/uncalled-nested/uncalled-nested.ts`]: ['access:named', 'lint:dead-surface'],

  // UNDRIVEN — logic Assayer reads perfectly but no case can steer, because the deciding operand is
  // neither a param, an env read, nor a literal constant the analyzer can fold. Distinct from a gap (no
  // harness closes them) and from a dark spot (the syntax is understood). Each file's colocated test
  // pins its verbatim reason. (A welded LITERAL — a same-file `const`, or a literal a caller welds into
  // a call argument — is a different case: the analyzer EVALUATES it into a live arm plus an
  // unreachable-exit, so those specimens live under `sad-path/unreachable/`.)
  //   - `opaque-module`: a module scope branching on `Math.random()` — an opaque call result, neither a
  //     param nor an env read nor a foldable constant, so no input picks the arm and no evaluation
  //     resolves it. The permanent-undriven module anchor: non-determinism is the definitive "you
  //     cannot test this branch", which no harness or future feature will ever change.
  [`${CATALOGUE}/sad-path/undriven/opaque-module/opaque-module.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'undriven'],
  // UNDRIVEN at the BRANCH, not the whole scope — the deciding value is neither a param nor an env
  // operand, so no case can steer which arm runs. Uniform across branch shapes: the ONLY difference
  // between the two is `if` vs `ternary`. `opaqueIf` guards on a same-file call `decide()`; the
  // derivation cannot arrange a call's result, so its exits derive no case and the branch is admitted
  // undriven at its own line. `opaqueTernary` proves the exact same admission for a ternary condition,
  // one rung of the derivation, not two. `decide` is a branchless private the file calls, projected as
  // no entry of its own — the file's one entry is the named export.
  [`${CATALOGUE}/sad-path/undriven/opaque-if/opaque-if.ts`]: ['access:named', 'branch:if', 'undriven'],
  [`${CATALOGUE}/sad-path/undriven/opaque-ternary/opaque-ternary.ts`]: ['access:named', 'branch:ternary', 'undriven'],
  // The OTHER blocker the one steerability gate asks about: here the operand is a parameter and
  // perfectly arrangeable, and the COMPARISON names no value. `mode === TARGET` and `case Severity.Low`
  // are the same fact one construct apart — the parse cannot read the right-hand side as a literal, so
  // neither arm is constrained and there is nothing to vary. Undriven, not a case: asked only whether
  // the OPERAND was arrangeable, the gate derived both arms with the same arranged input and one of them
  // failed against correct code. The switch is the sharper of the two, because the clause used to be
  // dropped outright — its `return` never emitted, the `default` losing the else that guards it, and the
  // single derived case reporting "reached no exit" on code that reaches one perfectly.
  [`${CATALOGUE}/sad-path/undriven/const-comparand/const-comparand.ts`]: ['access:named', 'branch:if', 'undriven'],
  [`${CATALOGUE}/sad-path/undriven/enum-case/enum-case.ts`]: ['access:named', 'branch:switch', 'param:union', 'undriven'],
  // `typeof` of a genuinely OPAQUE operand: `readValue()` is a call, not a parameter, so `typeof` is
  // read past its own keyword onto something that still has no input a case can set. This is the SAME
  // opaque-operand limit `opaque-if` has (above), worded to name the value `typeof` reads rather than
  // claim `typeof` itself is unreadable — `unarrangeable-typeof` is the cause. `checkKind` takes no
  // parameters, so this comparison has nothing to ever narrow by.
  [`${CATALOGUE}/sad-path/undriven/typeof-narrow-opaque/typeof-narrow-opaque.ts`]: ['access:named', 'branch:if', 'undriven'],
  // A typeof read that DOES narrow: `target` is a parameter and the comparison names a real tag, but
  // the union's other member (`Plain`, an object) has no scalar point Assayer can pick from a union on
  // its own — only the first fillable member, which is what an UNCONSTRAINED parameter gets, not what
  // one arm of one branch needs. `unarrangeable-typeof-member` is the cause, distinguished from the
  // fully opaque typeof operand above and from an unread comparison (`const-comparand`, above): the
  // comparison IS read here, the fill just cannot be steered per arm yet. `branch:ternary` proves the
  // same steerability gate reads a ternary's condition exactly as an `if`'s.
  [`${CATALOGUE}/sad-path/undriven/typeof-narrow-member/typeof-narrow-member.ts`]: [
    'access:named',
    'branch:ternary',
    'param:union',
    'undriven',
  ],
  // A branching callback passed to a same-file higher-order function (`apply(value, (x) => { if … })`).
  // The code REACHES the callback (it is passed as an argument), so it is NOT dead surface — but the
  // value `x` binds to is handed to it by `apply`, not an input any case at `run` controls, so its
  // branch is admitted UNDRIVEN. The array/element twin (map-conditional) IS driven; the passthrough
  // that would drive THIS (`run`'s `value` reaching `x` through `apply`) is a later rung. `run` is the
  // sole `access:named` entry; `apply` is a branchless private.
  [`${CATALOGUE}/sad-path/undriven/hof-callback/hof-callback.ts`]: ['access:named', 'undriven'],
  // A function that RETURNS a branching closure (`return (n) => { if (n > threshold) … }`). The code
  // reaches the closure via the export surface, so it is NOT dead surface — but `n` is supplied by
  // whoever applies the returned function and `threshold` is closed over, neither an input a case
  // controls, so it is admitted UNDRIVEN. `makeClassifier` is the sole `access:named` entry.
  [`${CATALOGUE}/sad-path/undriven/returned-closure/returned-closure.ts`]: ['access:named', 'undriven'],

  // ENV-as-OBJECT: `process.env` is an object, and its properties feed the stub stitch REGARDLESS of
  // drivability. `multi-read` reads two: `CODE` via `Number(process.env.CODE)` in a switch (DRIVEN, one
  // env case per arm, `operand:env`), and `MODE` via a bare `process.env.MODE === 'production'` compare
  // (UNDRIVEN — it types as `any` in the hermetic walk, §5.10). The bare compare is the `env:property`
  // capture: its literal is a real stub demand even though no case can steer the arm. So the file drives
  // the switch clean but ADMITS the `if` undriven — an unclean run, hence sad-path. The env stubs it
  // contributes (`process.env#CODE` → guessed `[1,2,7]`, `process.env#MODE` → `['abc123','production']`)
  // are asserted in `compile-stub-graph-broker.integration.test.ts`, independent of this run verdict.
  [`${CATALOGUE}/sad-path/env-object/multi-read/multi-read.ts`]: [
    'access:module',
    'branch:if',
    'branch:switch',
    'callee:node-global',
    'env:property',
    'operand:env',
    'undriven',
  ],

  // UNREACHABLE — an exit no input reaches, whose finding is a BUILD ERROR (an unreachable-exit lint)
  // rather than a case. Two causes, both dead in the source: guards that CONTRADICT, and a WELDED
  // constant that forces one arm. The rung adds arithmetic over the guard path, not syntax.
  //   - `welded-const`: `const level = 7; if (level > 5)` — the analyzer EVALUATES the welded value, so
  //     the `then` arm is a real case and the `else` arm is an unreachable-exit lint naming `level` and
  //     its welded `7`. A welded literal is decided in the source, not steered, yet it is not undriven:
  //     the analyzer knows exactly which arm runs. It reaches `console.log`, so it owes `callee:node-global`.
  //   - `welded-arg`: the FUNNEL twin — `report(){ return decide(3) }` welds `3` into `decide`'s `value`,
  //     and `report`'s only exit returns the call, so `decide` funnels into `report` (the SOLE
  //     `access:named` entry): following the call EVALUATES `decide`'s `if (value > 5)`, the `else` arm
  //     the one funnel case `report` reaches and the `then` arm an unreachable-exit lint. The lint keys on
  //     the surface (`report`) while its message names where the dead code lives (`decide`, line 3). No
  //     separate `decide` entry and no `branch:if` — the private's `if` drives the funnel; the welded
  //     literal lives in the caller's argument rather than the callee's own source, but the finding is the
  //     same lint.
  //   - `const-array-branch`: the array twin — `const items = [1, 2, 3]; if (items.length > 2)` — the
  //     branch on the welded array's fixed LENGTH (3) evaluates the same way, its lint naming the length.
  //   - `iife`: the module-load twin — `((n) => { if (n > 5) … })(7)` welds `7` into the arrow's `n` at
  //     the INVOCATION, so importing the file EVALUATES it: the `if` arm is a module-driven case
  //     (`access:module`, the surface rendering it by the file's label) and the fall-through an
  //     unreachable-exit lint naming `n` welded to `7`. The welded literal lives in the invocation rather
  //     than the scope's own source or a caller's call, but the finding is the same lint.
  //   - `sequential-guards` is the whole contradiction rung in one function: `>= 1` then `<= 1 || === 0`,
  //     so the fall-through exit needs a value both under 1 and over 1.
  //   - `cross-file-guards` + its two predicate helpers are the CROSS-FILE rung. The contradiction
  //     (`> 50` returns first, so `> 100` can never hold) exists in no single file, which is the point.
  //     The consume-time compose overlay follows each `if`-condition call to its sibling predicate and
  //     rebases the callee's threshold onto `size`, so both guards reach the branch model: the two
  //     reachable exits get sound cases and the dead middle exit rides a `lint:unreachable-exit`, which
  //     keeps the root in sad-path (a lint is an unclean run). Each helper (`exceeds-limit`,
  //     `within-budget`) is a CHILD, `access:named` alone; the root adds the relative imports whose
  //     predicates it composes and the unreachable-exit lint their contradiction yields.
  [`${CATALOGUE}/sad-path/unreachable/welded-const/welded-const.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'lint:unreachable-exit'],
  [`${CATALOGUE}/sad-path/unreachable/welded-arg/welded-arg.ts`]: ['access:named', 'lint:unreachable-exit'],
  [`${CATALOGUE}/sad-path/unreachable/const-array-branch/const-array-branch.ts`]: ['access:module', 'branch:if', 'callee:node-global', 'lint:unreachable-exit'],
  [`${CATALOGUE}/sad-path/unreachable/iife/iife.ts`]: ['access:module', 'branch:if', 'lint:unreachable-exit'],
  [`${CATALOGUE}/sad-path/unreachable/sequential-guards/sequential-guards.ts`]: ['access:named', 'branch:if', 'lint:unreachable-exit'],
  [`${CATALOGUE}/sad-path/unreachable/cross-file-guards/cross-file-guards.ts`]: [
    'access:named',
    'branch:if',
    'callee:import-local',
    'lint:unreachable-exit',
  ],
  [`${CATALOGUE}/sad-path/unreachable/cross-file-guards/exceeds-limit.ts`]: ['access:named'],
  [`${CATALOGUE}/sad-path/unreachable/cross-file-guards/within-budget.ts`]: ['access:named'],

  // INPUT GAPS — the shapes the fill seam REFUSES, invoiced to the CALLER. These are ORDINARY files:
  // every one is code a real repo would contain, every branch is understood, and every case is derived
  // confidently for the parameter the branch steers. What stops them is a parameter the case does NOT
  // steer and no value of the right shape exists for, so the entry derives NO case rather than one built
  // on a placeholder. Zero cases is unclean, hence sad-path — and the gap channel is what keeps the
  // refusal from reading as a file with nothing to test.
  //
  // The bucket is the VERDICT, not a judgement about the source: each of these is one committed
  // `<basename>.harness.ts` away from running clean, which is what the `happy-path/harness/` twins of
  // the first two show. They stay here because THIS file has no harness beside it.
  //   - `callback-param`: a callback parameter (`report: (message: string) => string`). The walk reads
  //     its call signature, so it owes `param:callable` — and no value in the arrange vocabulary is a
  //     function, which is exactly why the seam refuses it.
  //   - `object-param`: the same refusal one shape over — a same-file `interface Sink` parameter whose
  //     `write` member is enumerated onto it as a callable. An object is fillable only when EVERY
  //     property is, so one callable member refuses the whole shape rather than half-building it.
  //   - `map-param`: a built-in generic (`Map<string, number>`). Nothing about it is a function, and it
  //     is still opaque: `Map` is declared by the standard library, so the hermetic walk carries the
  //     reference and its arguments and no structure. It owes no `param:*` trait for that reason, and it
  //     is the sharpest no-placeholder case in the catalogue — a stand-in string has a `.size` to read,
  //     so the entry would run, reach an exit, and report a verdict about an input nobody supplied.
  //   - `partial-harness`: two refused callables with a harness beside it declaring only ONE. The entry
  //     still cannot be called, so the gap stands — but re-worded from the refusals that REMAIN, naming
  //     `sink` alone. Its harness is read (it registers), yet it buys no case, so `harness:supplied` is
  //     correctly absent: the trait rides the ARRANGE binding, and a partial payment produces none.
  [`${CATALOGUE}/sad-path/input-gap/callback-param/callback-param.ts`]: [
    'access:named',
    'branch:if',
    'gap:input',
    'param:callable',
  ],
  [`${CATALOGUE}/sad-path/input-gap/object-param/object-param.ts`]: ['access:named', 'branch:if', 'gap:input', 'param:object'],
  [`${CATALOGUE}/sad-path/input-gap/map-param/map-param.ts`]: ['access:named', 'branch:if', 'gap:input'],
  [`${CATALOGUE}/sad-path/input-gap/partial-harness/partial-harness.ts`]: [
    'access:named',
    'branch:if',
    'gap:input',
    'param:callable',
  ],
  // The PARAM twin of `object-param`, one door down from where the refusal lives: not a callable member
  // buried inside an object, but a bare `if (settings)` on the param itself. `is-falsy-arm` — the same
  // rule that already refuses a no-scalar-point PROPERTY — is asked here of the PARAM: the truthy arm
  // gets a real built object and DOES derive a case, while only the falsy arm's own bucket is refused
  // (no constructed object is ever falsy) and invoiced as a GAP. `cases` and `gaps` on the same entry is
  // the point: before this call site, the falsy arm's bucket fell through to the generic seam fill and
  // silently arranged the SAME `{ mode: 'abc123' }` the truthy arm gets, so the else case predicted an
  // exit it could never reach.
  [`${CATALOGUE}/sad-path/input-gap/truthy-object-param/truthy-object-param.ts`]: [
    'access:named',
    'branch:if',
    'gap:input',
    'param:object',
  ],
  // The ARRAY twin, one shape over: `if (tags)` on a `string[]` param. The truthy arm still fans out over
  // cardinality (empty/one/many) — nothing about bare truthiness narrows a LENGTH, every array is truthy
  // regardless of size — while the falsy arm is refused and invoiced exactly as the object shape's is.
  [`${CATALOGUE}/sad-path/input-gap/truthy-array-param/truthy-array-param.ts`]: [
    'access:named',
    'branch:if',
    'gap:input',
    'param:array',
  ],

  // `contradictory-bounds` nests `.length > 1` inside `.length < 1`, which no string satisfies — the
  // length axis is read over the integers, so this is provably dead where the same bounds on a plain
  // number are not. Second specimen owing `lint:unreachable-exit`, on a different axis from
  // `sad-path/unreachable/sequential-guards`.
  [`${CATALOGUE}/sad-path/length/contradictory-bounds/contradictory-bounds.ts`]: ['access:named', 'branch:if', 'lint:unreachable-exit'],
} as const;

export const specimenRegistry = new Map<string, readonly SyntaxTrait[]>(
  Object.entries(DECLARATIONS).map(([relPath, traits]): [string, readonly SyntaxTrait[]] => [
    relPath,
    traits,
  ]),
);

// The constructs the CONTRACTS declare that no specimen exercises — the catalogue's own blind spots,
// each carrying why. Written down rather than discovered, so shrinking this is a deliberate act and
// growing it is impossible by accident: the coverage check fails the moment a contract gains a member
// nobody catalogued. Otherwise "the catalogue covers every syntax we model" is a claim with nothing
// behind it.
export const uncataloguedTraits = {
  'access:unreachable':
    'no ENTRY can EVER carry it, by construction — not a missing specimen but a value the pipeline ' +
    'always resolves away before analysis is exposed. `readEntryAccessLayerTransformer` assigns `unreachable` ' +
    'only when the module export table has no entry for the scope, which is exactly the condition under ' +
    'which `analysisProjectionTransformer`\'s own entry filter (`scope.kind === \'function\' && ' +
    'scope.exported`) already excludes it from `FileAnalysis.functions`. The only route back in is ' +
    '`followCallsTransformer`, which either FUNNELS the scope (folded into its caller, no entry of its ' +
    'own — `happy-path/function/nested`), promotes it to `access:through-caller` ' +
    '(`happy-path/composition/through-caller`), or leaves it UNDRIVEN (`sad-path/undriven/hof-callback`), ' +
    'which carries no access kind at all. So `unreachable` is real only inside the raw walk, one step ' +
    'before `FileAnalysis` — pinned there, and only there, by `read-entry-access-layer-transformer.test.ts`.',
} as const;
