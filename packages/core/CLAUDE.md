# @assayer/core — the analyzer

Read this before touching `adapters/ts-morph/**`, `transformers/*projection*`, `transformers/*coverage-id*`,
or `brokers/analyze/**`. The root `CLAUDE.md` gives the project's principles; this says how the parser
actually works and what you are not allowed to do to it.

Every rule below exists because the thing it forbids was ALREADY IN THIS CODEBASE and broke something
real. They are not style preferences.

---

## 1. The one idea

**There is exactly one walk, and context flows DOWN.**

The analyzer used to be flat `getDescendantsOfKind` scans — one per SyntaxKind — that re-derived
ownership afterwards by climbing ancestors (`node.getFirstAncestor(isFunctionLike) === entryNode`).
Context flowed *up from leaves* instead of *down through descent*. Everything that was wrong with it
followed from that single inversion:

- constructs could not compose (`switch` inside `if` silently **lost the outer `if` guard**);
- every host scope needed its own near-copy of the derivation (module scope was a 155-line clone of
  function scope; the class rung was therefore a permanent "gap");
- nesting did not exist (a function inside a function was dropped by *both* the entry scan and the
  ownership filter — its logic vanished with no error);
- unrecognized syntax vanished silently.

If you find yourself reconstructing context, you have re-created the bug. Stop.

---

## 2. The model

`contracts/walk-context` carries three axes down the walk. Their differing behaviour at a function
boundary IS the design:

| axis | pushed by | crossing a function boundary |
| --- | --- | --- |
| `scopePath` | module root, function-like, class | **extends** — `['*module*','Classifier','classify']` |
| `guardPath` | `if`, `switch` (and every construct you add) | **resets** — a function *defined* in an arm is not *guarded* by it |
| `tail` | statement position | only the LAST statement can end the scope |

`tail` is what makes a bare top-level `if` and an `if` inside a function **the same handler**: when the
`if` is the last thing that runs, each arm's *completion* is an exit worth a test case; when code
follows it, the arms merely converge. Delete `tail` and "per-arm exits" becomes a rung-specific rule —
i.e. the duplication this architecture removed.

`transformers/walk-context` is the ONLY place these rules live. Do not re-implement them in a handler.

---

## 3. The pipeline — one parse, pure projections

```
ts-morph-walk-file-adapter          ← the ONLY ts-morph boundary, the ONLY parse
  └─ walk-node-layer-adapter        ← the recursion; calls ITSELF per descent
       └─ dispatch-node-layer-adapter   ← the ONLY place a kind is ROUTED to an owner
            └─ handle-<x>-layer-adapter ← returns {facts, descents}; NEVER recurses
                        │
              normalized WalkFileResult (serializable, ts-morph-free)
                        │
        ┌───────────────┴────────────────┐
  analysis-projection             map-projection        ← pure transformers
  (+ dark-spot-projection)        (explorer nodes)
```

Scopes complete on the way back **UP**: branches and exits travel as LOOSE facts belonging to the
nearest enclosing scope, and whichever node opened a scope claims them. By induction each scope claims
exactly its own — which is why no node ever has to ask "which function am I in?".

Handlers describe descent; the core performs it (R15: *core owns all traversal; plugins never parse*).
That inversion is why a `switch` handler needs zero knowledge of `if`.

---

## 4. Where to make a change

| You want to… | Touch |
| --- | --- |
| support a new syntax family | a new `handle-<x>-layer-adapter` + **one** route in `dispatch-node` |
| support a new callable shape | `handle-function-layer-adapter` (owns `FunctionLikeNode`) + its dispatch route |
| handle a new type shape | `transformers/type-descriptor` (`read-type-fact` only packs raw checker facts) |
| handle a new comparison | `transformers/predicate` (`read-condition` only extracts the readout) |
| change coverage IDs | `transformers/coverage-id` + `transformers/exit-coverage-id` |
| change what identity is | `project-node-layer-adapter` |
| change operand typing | `read-operand-type-layer-adapter` (read §5.9 first) |
| change reachability | `read-terminal` **or** `read-accounted` — they are different questions, read §5.8 first |
| change what counts as a dark spot | `statics/significant-syntax-kinds` |
| change what becomes an entry | `transformers/analysis-projection` (policy lives there, not in the walk) |

**`dispatch-node` is the only place that ROUTES** — i.e. the only place that decides *which handler
owns a node*. That is the invariant; it is not "no other file may say `Node.isX`". Plenty of files
legitimately inspect kinds for their own reading job (`read-condition` narrows a binary expression,
`read-terminal`/`read-accounted` recurse the statement forms, `desugar-switch` reads case clauses,
`project-node` distinguishes identifiers from literals). What none of them may do is decide ownership,
or answer a question the walk already answered.

The test to apply: *am I reading this node, or am I deciding who handles it?* The second belongs in
`dispatch-node` and nowhere else.

---

## 5. Non-negotiable rules

**5.1 — Never pull source TEXT into analysis.** Derive from node KINDS, resolved SYMBOLS, and literal
VALUES (`getLiteralValue()`, not the quoted spelling). If the AST can't be decomposed for some syntax
yet, build a normalized STRUCTURAL projection of it — `project-node-layer-adapter` already does this
for ANY node — do NOT add a `getText()` fallback. A formatting-only edit that moves an ID is a bug.

`getText()` currently appears exactly 5 times in the analyzer and **every one is one of these two
sanctioned uses**. Do not cite them as precedent for a third:

- `node.getText()` on an **Identifier** (`project-node`, `read-condition`, `desugar-switch`) — an
  identifier's text IS its name; there is no formatting freedom in it. *Open question, not settled:*
  this is the identifier's spelling, not its resolved symbol, so renaming a local currently moves the
  ID. That is churn-matrix #5 and is explicitly undecided in `plan/requirements.md` — if you resolve
  it, resolve it there, in `project-node`, once.
- `type.getText()` on a **Type** (`read-type-fact`) — that is the CHECKER's canonical rendering of a
  type, not the user's source. It lands in display-only `TypeText` and never reaches an ID.

Anything else — a condition's text, a node's span text, a "just for the fallback" `getText()` — is a
bug, full stop.

**5.2 — Never scan.** No `getDescendantsOfKind`, no `forEachDescendant`, no "find all the Xs then work
out who owns them". The walk reaches every node exactly once and already knows who owns it. A scan
cannot tell a `return` in the function from a `return` in a callback nested inside it — that was a real
bug here.

**5.3 — Never climb ancestors for context.** No `getFirstAncestor`, no "which function am I in".
The answer is already in `context`. This is rule 5.2's twin and the reason the guard
`is-function-like-kind` was deleted.

These two are checkable. In `packages/core/src`, `getDescendantsOfKind`, `getFirstAncestor` and
`forEachDescendant` are at **zero** occurrences — grep before you add the first one back. (Tests use
`getFirstDescendantByKindOrThrow` to fetch a node to feed the unit under test; that is a test fixture,
not analyzer logic, and is fine.)

**5.4 — Never write rung-specific code.** No `if (isModuleScope)`, no `if (insideClass)`. Module,
function, method, nested function and callback are the same handler at different depths. If a construct
needs to behave differently at the top level, the difference is `context.tail`, not the rung.

**5.5 — Never hardcode a guard path.** Always append to `context.guardPath`. The old switch handler
emitted `guardPath: [{branch, arm:'then'}]` — one step, invented locally — which silently dropped every
enclosing guard. Your handler does not know what encloses it, and must not try.

**5.6 — Never drop a node silently (D22).** Unrecognized ≠ invisible. `dispatch-node`'s default branch
DESCENDS anyway (so a `return` inside an unhandled `for` is still found) and RECORDS the node as
unhandled if its kind is load-bearing, which becomes a `darkSpot` in the cache. Handling a kind means
adding a handler, **not** removing it from `significant-syntax-kinds`. `FileAnalysis.darkSpots` is
required, not optional: an analysis that can omit its own blind spots reads as complete and gets
trusted, which is worse than no analysis.

Corollary: **descend expressions.** `handle-exit` descends the returned expression — not to analyse the
value (P4 forbids that) but because `return xs.map((n) => …)` contains a whole scope and
`return a ? b : c` contains a branch we must at least admit we can't follow. Skipping it drops both.

**5.7 — Never parse twice.** `walk-file` runs once; the analysis and map are pure projections of that
one model. Two parses is how the old map and analysis could disagree about the same file.

**5.8 — Keep the two reachability predicates separate.**
- `read-terminal` = "does this ALWAYS exit?" → decides whether code AFTER it is guarded by one of its arms.
- `read-accounted` = "are its ways out already emitted?" → decides whether the scope owes a completion exit.

They differ for an `if`-with-else whose arms fall through: *accounted for* (each arm gets a completion
exit) but does NOT *always exit* (code after it runs on both arms). Merging them is a real soundness
bug — it guards a trailing `return` by an arm it doesn't depend on and keys it under a wrong ID.
Pinned by `smoke-repo/.../composition/fallthrough-in-if`.

**5.9 — Don't "simplify" operand typing.** `read-operand-type` deliberately keeps TWO rules (param →
declared descriptor; other binding → widened type-graph read). Widening everything collapses
`'get'|'post'|'delete'` to `string` and destroys the exhaustive per-member fan-out that makes switch
analysis worth anything.

**5.10 — The analyzer's project has NO ambient Node types, and the env rung is built on that.**
`ts-morph-walk-file-adapter` parses with `useInMemoryFileSystem: true` and one source string: the
standard library resolves, `node_modules` does not. Two consequences, and both are load-bearing:

- It is what lets `read-env-operand` prove `process.env` rather than pattern-match it. An identifier
  the file itself declares is NOT the global, and the checker answers that exactly — so a file with
  its own `const process = { env: … }` is refused. The uniform rule is "no declaration in THIS source
  file"; do not weaken it to "no symbol", because `Number` resolves (to the lib) while `process`
  resolves to nothing, and only the file-scoped question covers both.
- It caps the rung at **one hop through `Number`** — `const x = Number(process.env.X)`. `String` is
  its exact inverse, so a representative value can be put back into the environment. A bare
  `const mode = process.env.MODE` types as `any` here (no `@types/node`), so it has no domain to pick
  a value from and stays honestly undriven — which means the very common
  `process.env.NODE_ENV === 'production'` is NOT driven. Loading `@types/node` into the project is
  what would widen it, and that is a real decision (parse cost on every file, a core dependency on
  consumer-adjacent types, and every specimen's analysis changes) — not a tweak.

**5.11 — An exit owes a probe SITE, minted where its id is minted.** Every handler that emits an exit
emits its site in the same expression (`handle-if` per arm completion, `handle-function` per body,
`handle-source-file` per file end). Derive sites in a second pass and a runtime observation can key
under an id the analyzer never produced. Two site shapes, because two things are observed: an
EXPRESSION exit is wrapped in place (value passes through, short-circuit preserved), while an
IMPLICIT one — falling off the end of an arm, a body, or the file — has no expression at all, so its
site is the statement CONTAINER and the probe is APPENDED (`kind: 'complete'`). An implicit exit with
no site is unobservable, and a case predicting one reports "reached no exit" against code that
reached it perfectly.

---

## 6. Adding a construct — the recipe

Do these in order. Skipping step 1 is how you end up asserting what the code does instead of what it
should do.

1. **Specimen first.** Add `smoke-repo/packages/syntax-repository/src/<construct>/<rung>.ts` + a
   colocated `.test.ts` holding only what is BESPOKE to that file (exact coverage IDs, the shape of
   its analysis). If it's currently a dark spot, assert THAT first (a ratchet), then flip it.
   Adding a specimen also changes the e2e's compiled-surface counts — see §8.
1b. **Declare it** in `packages/core/test/harnesses/specimen-registry.ts` — one line naming what the
   file IS (`['access:named', 'branch:if']`), never what to test. The matrix walks the catalogue off
   disk, so an undeclared specimen fails the catalogue check rather than being skipped, and the
   declared traits alone decide which checks it owes. Everything universal (valid TypeScript,
   determinism, produces a run artifact) then applies with nothing written.
   **Author it by READING the file.** Never regenerate it from analyzer output: a matrix that asks
   the analyzer what is in a file cannot notice the analyzer being wrong — it would agree with
   itself, run fewer checks, and go green. That is P4 one level up, and the cross-check
   (`analyze-file-broker.integration.test.ts`) is only worth its runtime because the two sides are
   authored independently. A trait the analyzer cannot see, or a fact it sees that nobody declared,
   fails there — which is what a forgotten trait looks like.
2. **Handler.** `handle-<x>-layer-adapter.ts`. It emits its branch(es)/exit(s), and returns descents
   with `walkContextTransformer({ context, guardSteps: [...] })` per arm. It must not recurse, must not
   look at its parents, and must not know any other construct exists.
3. **One route** in `dispatch-node-layer-adapter`.
4. **Proxy + test** for the handler (both are lint-enforced). Then the derivation semantics: a branch
   is useless unless `transformers/type-to-range` and `transformers/derive-cases` can turn its predicate
   into values.
5. **Verify** (§7).

You should not have to touch any existing handler. If you do, ask why — that's the smell the whole
architecture exists to prevent.

---

## 7. Verification loop

**Probe before you assert.** Discover real values by running the real code; never guess expected
strings into a test. From the repo root:

```bash
npx tsx /tmp/.../probe.ts     # import by ABSOLUTE path:
# import { tsMorphWalkFileAdapter } from '/abs/.../walk-file/ts-morph-walk-file-adapter';
# ts-morph too: from '/abs/.../node_modules/ts-morph'
```

Then, **both** of these — `test:syntax` is NOT in ward's jest graph, so ward alone does not cover it:

```bash
npm run test:syntax        # the specimen catalogue
npm run ward               # lint + typecheck + unit + integration + e2e, all 5 packages
```

Two properties must hold and are cheap to check with a probe:
- **Determinism**: same source ⇒ byte-identical analysis across runs (no Map/Set order leakage).
- **Formatting immunity**: minified vs formatted vs different quotes ⇒ **identical** coverage IDs.

---

## 8. Traps that will cost you an hour

- **Never `import type` across layer files.** `enforce-proxy-child-creation` is post-edit, keys on the
  imported NAME, and demands a `<Name>Proxy` that cannot exist for a type — while also flagging the
  proxy you add as "phantom" because the value isn't imported. Catch-22. Escape: annotate with
  `ReturnType<typeof someValueYouAlreadyImport>` (that is how every handler declares its return type),
  or let the file own the type itself.
- **`handler-result-layer-adapter` is a LEAF** — it imports nothing else in the folder. Shared handler
  vocabulary lives there because putting it beside the recursion makes the proxy graph circular
  (`walk-node.proxy → dispatch.proxy → handler.proxy → walk-node.proxy` = infinite recursion at runtime).
- **An expression-level branch does not fit the guard model — which is why `ConditionalExpression` is a
  dark spot, and why §6's recipe will not close it.** `guardPath` assumes a guard is a STATEMENT
  enclosing STATEMENTS; a ternary's arms guard an expression SUBTREE. Two consequences follow, and a
  handler addresses neither. `handle-exit` emits its exit BEFORE descending, handing the expression
  `context` verbatim (`handle-exit-layer-adapter.ts:57`), and exits merge UPWARD
  (`walk-node-layer-adapter.ts:36`) — so a branch inside a `return` cannot make that `return` retract
  its own unguarded exit. `handle-if` inverts this with `readAccounted` ("the arm already returns, so
  I owe no exit"), but for an expression branch the polarity reverses and nothing asks `handle-exit`
  to stand down. Separately, `const x = cond ? y : z` needs value-flow tracking (follow the binding to
  its use) before it could derive anything: `derive-cases` derives per exit from `exit.guardPath`, so a
  branch no guardPath can mention derives zero cases and is inert decoration. The work is
  exit-ownership + value-flow, not a handler.
- **`*/` inside a doc comment terminates the comment.** Writing a scope path like `*module*/classify` in
  a `/** … */` block produces baffling TS1109/TS1005 parse errors. Don't put scope paths in comments.
- **Tests may not contain conditionals** — including `result.success === true && result.x`. Assert the
  WHOLE discriminated-union result with `toStrictEqual`. No helper functions in test files either
  (`forbid-non-exported-functions`); a top-level `const` of DATA is fine.
- **Adding any non-test `.ts` to the syntax-repository package makes it part of the analysed surface.**
  A test-only shim at the package root silently inflated the e2e's `ts N` count. Map jest aliases
  straight at core instead of adding shim files.
- Adding a specimen changes three assertions in `packages/app/src/flows/app/surface-explorer.e2e.ts`:
  the header count, the sorted file-leaf list, the sorted dir list — plus its line in
  `specimen-registry.ts`, without which the catalogue check fails.
- **The runner's Jest config must be IDENTICAL for every file.** ts-jest keeps one TypeScript
  compiler per distinct config and never releases it, so anything per-file in the config strands a
  whole compiler — ~370MB each, which is `assayer unit` OOM-ing partway through a real repo, not a
  slow test. Which run to execute travels in the test-path pattern (`_`), never in `roots`/`testMatch`.
  Two ways to break it, and the second is the one that looks innocent:
  - naming the run's own directory in the config; and
  - a harness minting a **fresh temp dir per test** — a new path is a new config just as surely, so
    `run-unit.harness.ts` WIPES one stable path rather than renaming it.
  Pinned by *"two different runs => the config is IDENTICAL"* in `jest-run-cli-adapter.test.ts`. If
  you are about to make the config depend on the file, that test is the reason not to.
- **One nested Jest run proves nothing about fifteen.** `run-unit-broker` calls `runCLI` in-process,
  so the engine integration runs Jest inside Jest. That is fine and stays flat — but only while the
  rule above holds; the memory cost is per CONFIG, and it does not show up until something drives the
  whole catalogue at once.
- **The wrapped runner executes COMPILED adapters, never your source.** The generated shim `require`s
  `<coreRoot>/dist/adapters` by absolute path — that IS the product: a published core ships `dist`,
  and a consumer's shim requires exactly that, so mapping it to TS source would test a path nothing
  runs. The consequence is that `dist` and `src` disagreeing is a SILENT wrong answer — a stale
  `dist` lets the integration suite pass against old compiled code while the unit suite passes
  against new source, and neither notices. `jest.config.base.js` closes it with a `globalSetup` that
  builds first, so every jest path is covered rather than only `npm run ward`. `tsc --build` is
  content-hashed (an mtime bump alone rebuilds nothing), so the no-op costs ~0.2s. Do not remove it.
- Coverage IDs are **cache-internal by ruling** — changing them costs only fixture rewrites, never a
  migration. Do not contort the design to preserve an ID string.
