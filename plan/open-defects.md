# Assayer — Open defects

> Every defect here is CURRENTLY REAL and was read off a real run, never reasoned about.
> Each entry states the symptom, a repro you can paste, the root cause with file paths
> where it is known, and what closing it involves. Delete an entry when it closes — never
> annotate it as resolved.
>
> **Scope:** everything except the values a derived case hands its parameters, which live
> in `plan/arrange-inputs.md`.
>
> **Verify any fix with BOTH** `npm run ward` and `npm run test:syntax` — the specimen
> catalogue is not in ward's jest graph. `npm run typecheck:syntax` is a third gate and is
> currently red (§E1).
>
> **Probe before asserting.** Import by absolute path under `npx tsx`; run the built CLI
> at `packages/cli/dist/bin/assayer.js` for anything end-to-end.

## A. Derivation soundness — a case that fails, or passes, against correct code

These are the worst class: a false RED fails a build and blames the reader's code, and a
false GREEN reports coverage that never happened. All are PRE-EXISTING — verified against a
detached worktree at HEAD — but none is covered by either gate.

### A1. A tail-position `if` with no `else` fails against correct code

The most serious open defect, and the catalogue structurally cannot see it.

```ts
export const decide = (n: number): string => { if (n > 5) { return 'big'; } return 'small'; };
```

Fails at module scope, inside a function, and inside a callback alike. The catalogue has
exactly two tail-`if` specimens and **both carry an `else`**, which is the only reason
`test:syntax` is green over it —
`smoke-repo/.../happy-path/if-else/pure-statement/pure-statement.ts` is this shape plus
four characters, and deleting its `else` turns the suite red.

Closing it needs the derivation fix plus a no-else specimen. **Until it is fixed, do not
author a specimen on a no-else tail `if`** — you would pin the bug.

### A2. `is-predicate-constraining` ORs the arms instead of requiring they differ

`packages/core/src/guards/is-predicate-constraining/`

The steerability gate asks "does EITHER arm name a value" when steerability needs "can the
arms be arranged to DIFFERENT values". Two verified consequences, both failing against
correct code:

- `if (b === false)` — the satisfying arm names `false`, passes the OR, then both arms
  arrange `false` and the one predicting the other exit fails.
- `ns.length > 2` — predicts an arm the cardinality fan-out can never build (see A3).

One line in intent; a real design decision in practice, which is why it was left.

### A3. A `.length` guard on an array param derives guaranteed-failing cases

`packages/core/src/transformers/cause-arrange/cause-arrange-transformer.ts` (~160-170, 214)

```ts
export const pick = (xs: string[]): string => { if (xs.length > 3) { return 'many'; } return 'few'; };
```

Derives SIX cases. The three predicting the `#then` exit arrange `[]`, `['abc123']` and
`['abc123','abc123']` — every one of length ≤ 2, so every one takes the `else` arm at
runtime. The length domain the guard produced is computed into `bindings` and then silently
discarded by the unconditional cardinality fan-out. No specimen exercises it.

### A4. `null` / `undefined` comparisons derive zero cases silently

`v === null`, `v !== null` and `v === undefined` — three of the commonest branches in
TypeScript — are admitted UNDRIVEN, and the reason reads "compare against a literal", which
is exactly what they already do. Net better than the prior false FAIL, but `0/0, exit 0` on
a null check reads as success. The undriven text enumerates three comparand kinds and is
applied to four shapes that are none of them (bare truthiness, `null`, `undefined`, a
same-file const).

Root cause: `read-condition-layer-adapter.ts`'s `rightLiteral` reader handles
`StringLiteral`, `NumericLiteral`, `TrueKeyword` and `FalseKeyword` — not `NullKeyword`. So
the leaf carries `rightLiteral: undefined`, `predicateTransformer` buckets it
`{kind:'unrecognized'}` alongside a genuinely unreadable `m === TARGET`, and
`isPredicateConstrainingGuard` calls it non-constraining.

`typeToRangeTransformer` already computes the correct `null` domain, so extending the reader
activates a path nothing currently reaches. The change moves analyzer output for every
`=== null` in the catalogue: verify with `npm run test:syntax`, not ward alone.

### A5. A fillable REST parameter is applied as one array argument instead of spread

```ts
export function tally(size: number, ...ns: number[]): number { return ns.length + size; }
```

arranges `{kind:'array', param:'ns', value:[7]}`, and `jest-interpret-case` applies every
non-env binding positionally — so the entry is called `tally(11, [7])` and `ns` binds to
`[[7]]`. Benign for the structural exit assertion in most shapes (`ns.length` still reads
1), wrong for anything that reads an element. The descriptor now carries `rest: true`, so
the fix has the fact it needs: spread a rest binding in the interpreter, or give the arrange
a rest-shaped binding kind.

## B. Types that are refused although a value exists

Each derives 0 cases and a GAP (exit 1). The invoice is accurate and ~1000 characters,
naming the type as the SOURCE spells it — so these are honest refusals, not false ones.
Closing any of them means teaching `read-type-fact` / `is-type-fillable` to BUILD the shape,
never changing the message.

### B1. Structural and builtin shapes

`v: Ay & Bee` (intersection), `when: Date`, `task: Promise<string>`,
`` t: `id-${string}` `` (template literal), `payload: Map<string, number>`,
`pair: readonly [string, number]`.

`Date` and `Promise` enumerate as objects of ~40 callable members, so every method-bearing
lib type refuses by the same route.

### B2. A `typeof` narrowing is admitted UNDRIVEN with a misleading reason

```ts
export const choose = (target: Plain | string): string =>
  typeof target === 'string' ? target : target.label;
```

Correctly NOT invoiced (the union fills), but the branch is admitted UNDRIVEN and the reason
says "make the deciding value a parameter" — `target` **is** a parameter. The real limit is
that `read-condition` does not decompose a `typeof` comparison into operand + predicate, so
the leaf carries no `operandParamName`. Either read the `typeof` form (its satisfying domain
per union member is derivable) or word the admission for what it actually is.

### B3. A cross-file object-MEMBER leaf keeps an opaque operand type

`param-type-resolve` substitutes a leaf's `operandType` by type reference, so a DIRECT param
read (`level === 'low'` typed `Level`) gets its declared union and fans out per member. An
object-MEMBER read (`config.mode` on an imported `Config`) does not: the member access has
no type node of its own, so its leaf carries no `typeRef` and `operandType` stays
`{kind:'unknown', text:'any'}`.

The derived CASES are correct — `stub-realize` arranges those branches from the stub view's
per-property demands — but the enrichment panel shows `any` on the branch line, and any
future consumer of the leaf's operand type reads a collapsed one. Indexing the resolved
object descriptor by `operandPropertyPath` would close it.

## C. Harness remainders

### C1. A harness cannot pay a refusal owned by a funnelled scope

A refusal that a driving route hits on an entry's behalf — a funnelled private's parameter,
or a callback's — is invoiced against the HOST and the invoice reads ``on `helper` ``. But
`harness-validate` checks declared keys against `FileAnalysis.functions[].entry.params`,
which does not include a funnelled scope's parameters, so **declaring the key the invoice
literally prints is a compile-time P1** ("a parameter the entry does not take").
`harness-realize-broker` narrows supplied keys to the entry's own declared params for the
same reason, so the run side agrees with the stitch rather than arranging an argument the
signature has no slot for.

Closing it means carrying the declaring scopes onto `FileAnalysis` so both the validation
and the derivation can see them. Pairs with D3.

### C2. A harness key declared as `undefined` buys a green verdict

`assayerHarness({ inputs: { measure: { report: undefined } } })` validates, and an entry
that never CALLS the refused parameter then reports `2/2 passed`, exit 0.

`harness-value-transformer` documents the choice deliberately — it tests `in` rather than
truthiness, because "a key declared as `undefined` is a value a human deliberately
supplied". The arrange never carries the value, so the report cannot show what actually ran.
This is the single known route to a green verdict bought without a usable input; decide
whether the deliberate choice is still the right one.

## D. Catalogue coverage — features the specimen matrix cannot see regress

The catalogue is the ratchet: a feature with no specimen can be lost without a single test
turning red. Each of these is pinned only by core unit tests today.

### D1. No plain `type X = { … }` specimen

`interface Config` and `type Config = { mode: string }` are now byte-identical downstream
(probed: same `declaredTypes`, same verdict). The only alias specimen in the catalogue is
GENERIC — `happy-path/object/generic-alias/box.ts` (`export type Box<T> = { value: T }`) —
so the plain non-generic form, which most TypeScript repos prefer, is unexercised.

### D2. No types-only specimen

A types-only module analyzes to zero entries and zero cases, so it fits neither bucket's
verdict rule (happy-path wants ≥1 passing case, sad-path wants an admission).
`object/cross-file-shape/types.ts` keeps `withDefaults` precisely to have a runnable entry.
Pinning "an interface no signature mentions still reaches `declaredTypes`" needs a **bucket
ruling for declaration-only files first**.

### D3. No funnelled/driven-route input gap specimen

`sad-path/input-gap/` covers entry-own refusals only. Nothing exercises a refused parameter
belonging to a folded private or a callback, so that channel — added so those builders stop
dropping refusals on the floor — cannot be seen to regress. Pairs with C1.

### D4. No `.tsx` specimen, and the walkers cannot hold one

The runner transform now selects `.tsx` and a probe proves a `.tsx` entry derives and runs
cases, but a smoke-repo `.tsx` specimen is **invisible to `specimen-catalogue`** — it filters
`.ts`, derives roots with `basename(x, '.ts')`, and finds the colocated test with
`.replace(/\.ts$/)`. That is the silent skip this repo forbids: the file would exist and no
suite would look at it. Teach that walker `.tsx` first, then add the specimen. JSX inside a
`.tsx` needs `jsx` in the consumer tsconfig for ts-jest to compile it.

`syntax-surface.harness` no longer contributes to this: `fileLeaves`/`dirNames` and
`surfaceHeaderPattern` now share one `isAnalysedSourceFile` predicate, so the tree sets and
the header count enumerate the same files. The harness symbol gate applies only to `.ts`,
since a harness is always `.ts`.

### D5. No specimen carries a GAP and an UNDRIVEN branch on one entry

`analyze-file-broker` drops an entry's undriven admissions when that entry also carries an
input gap — precedence, never a merge, and one of the few places two admissions meet. No
specimen declares both on one entry (probed: no `'undriven'` and `'gap:input'` co-occurrence
in `specimen-registry.ts`), so the rule is pinned only by a hand-built core unit case and
cannot be seen to regress through real parsing.

### D6. Two `SyntaxTrait` members have no specimen

`access:through-caller` and `access:unreachable`. `uncataloguedTraits` names both honestly,
so nothing lies — but a trait with no specimen is a trait whose derivation can be lost
silently.

## E. Gate and test coverage

### E1. `typecheck:syntax` is red at HEAD, and npm can swallow it

```
src/happy-path/switch/pure-statement/pure-statement.ts(1,7): error TS2451: Cannot redeclare block-scoped variable 'code'.
src/sad-path/env-object/multi-read/multi-read.ts(7,7):       error TS2451: Cannot redeclare block-scoped variable 'code'.
```

Two specimens each declare a module-scope `const code`, which collide as global-scope
block-scoped redeclarations under the smoke-repo tsconfig. Verified pre-existing by stashing
all work and re-running. Fix by renaming one const, or by giving the catalogue per-file
module scope.

**When you assert this gate, assert tsc's OUTPUT, not the shell exit code** — npm has been
observed swallowing the workspace failure and exiting 0.

### E2. No test proves a saved run goes missing after a harness edit

`run-id-broker`'s own tests pin that an edited harness moves the id and that an unharnessed
file keeps its id. But `run-find-broker`'s unit test replaces `runLoadBroker` wholesale, so
nothing exercises "saved run + edited harness ⇒ not found" through the reader the desktop
actually calls. Confirmed empirically: reverting the run-id ingredient leaves both harness
integration tests GREEN. Needs an integration-shaped test over a real cache dir.

### E3. Nothing in CI drives a `.tsx` through the runner

Only the emitted config is pinned. A behavioural pin needs a fixture repo **inside the
workspace** — Jest resolves `ts-jest` relative to `rootDir`, so a `/tmp` fixture dies with
"Module ts-jest in the transform option was not found". Blocked on D4.

### E4. Three branches need a proxy capability that does not exist

`compile-run-broker`, `config-load-broker` and `stable-namespace-layer-broker` each have a
branch no test reaches, because the colocated `.proxy.ts` cannot stage what the branch needs:
a rejection from an unwrapped `fsReadFileAdapter` call, and an assertion that a given
argument reached a mocked callee.

### E5. `assayer unit <path>` is unreachable from a CLI temp dir

`ts-jest` resolves from a `node_modules` tree relative to the target repo root, which
`mkdtemp` cannot supply — the run dies with "Module ts-jest in the transform option was not
found" before reaching anything under test. Real coverage lives in `run-console.e2e.ts`
against the smoke-repo, which is a real npm workspace. Same root cause as E3.

The generic non-`CliExactOutputError` catch-all in `packages/cli/bin/assayer.ts` is
unreached for a different reason: it needs a manufactured runtime exception thrown through
the real compiled pipeline.

## F. Dead surface

Each is probe-backed — no constructible input reaches it. Under this repo's own vocabulary
that makes them LINT: the repo's debt, to delete rather than to test.

### F1. `isEnumLiteral()` can never independently decide its guard

In `isStringLiteral() || isNumberLiteral() || isEnumLiteral()`, across
`read-signature-type-layer-adapter.ts`, `read-global-type-layer-adapter.ts` and
`read-type-fact-layer-adapter.ts`. TypeScript sets the `EnumLiteral` flag only in combination
with `StringLiteral`/`NumberLiteral`, or folds it into a union an earlier branch handles.
Probed across seven enum shapes: string member, numeric member, `const enum`, heterogeneous,
single- and multi-member whole-enum, ambient `declare enum`.

The enum-syntax cases in those three test files are still worth keeping — they pin real
behaviour — but they reach the branch through `isStringLiteral()`.

### F2. The `declaration === undefined` fallback is unreachable

`{ flavor: 'other', text: 'unknown' }`, in the same three readers. Reaching the properties
loop requires `getSymbol()` to be defined, and every such symbol carries at least one
declaration node. `Record<'a'|'b', string>` resolves through its synthetic `__type` symbol to
the `MappedType` node in `lib.es5.d.ts`; an intersection of object literals has no symbol,
but then fails `isObject()` and never enters the loop.

### F3. `definition.name === ''` at `read-callee-layer-adapter.ts:80`

Only two paths populate the field. `FunctionDeclaration.getName()` returns `undefined` for an
anonymous declaration, never `''` — and an anonymous declaration has no identifier for a call
site to resolve through. `VariableDeclaration.getName()` never sees a destructured binding,
which produces `BindingElement` nodes that `isVariableDeclaration` excludes. A valid
identifier is never empty.

The sibling `definition?.name === undefined` disjunct IS reachable, via `const f = 5; f();`.

### F4. Two computed-but-unread branches

- `branch.operand === undefined` at `undriven-branch-transformer.ts:47`, for the
  `unread-comparison` cause. Every path producing that cause requires all leaves to be
  arrangeable, and every arrangeable route requires a nameable `operandParamName`.
- The `distinct` local in `type-to-range-transformer.ts`: its
  `typeof literal === 'number' ? literal + 1 : …` branches are computed but never read for any
  `literal !== undefined` input, because the only read site uses `literal` directly.

## G. Invariants held by convention rather than by a rule

### G1. `??` silently discards a legitimate `null` from a derived value

`null` is a first-class member of the domain — `representative-value-contract.ts` states it:
"`null` is a value in the domain because a nullish operand HAS one." The `non-nullish` case
of `typeToRangeTransformer` produces its violating arm as exactly `{ members: [null] }`,
which is what drives every `config.mode ?? fallback` object-member guard.

So `a ?? b` over a derived value substitutes `b` for a correct `null`, and the generated case
stops exercising the branch it names — while passing. `objectArrangeTransformer` and
`typeToRangeTransformer` use explicit `=== undefined` checks for this reason, but nothing
stops the next `??` from reintroducing it. Wants a lint rule over a `RepresentativeValue` /
`ArrangeValue` operand, per the checklist ratchet.

### G2. `LaunchRunResponder` spawns Electron with no `error` handler

The bare-launch path calls `child_process.spawn` for a detached Electron process and attaches
no `error` handler to the child, so a spawn failure has nowhere to go. It is also why that
path is untested — driving it for real risks an unhandled exception that depends on display
and Electron-binary availability.

## Belongs to `@dungeonmaster/testing`, not here

`registerMock`'s stack-based dispatch routes a write to the wrong handle when a broker's own
write never fires (an early return) AND a sibling untracked write to the same underlying
`fs/promises.writeFile` happens elsewhere in the same call graph. Probed:
`manifestWriteBrokerProxy().getWrittenManifest()` returns a compiled blob rather than a
manifest. This is the exact collision stack dispatch exists to prevent.

## Not a defect, but know it

Compiling THIS monorepo with Assayer OOMs: `assayer status` against
`repoRoot=/home/brutus-home/projects/assayer` (1781 targets) dies with
`FATAL ERROR: Ineffective mark-compacts near heap limit`, exit 134, at ~3.3GB after 150s —
during the walk, before any stitch. It is why the harness symbol gate was proved by a
plan-broker probe plus byte-exact copies rather than by compiling the repo itself.
