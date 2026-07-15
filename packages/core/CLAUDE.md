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

---

## 6. Adding a construct — the recipe

Do these in order. Skipping step 1 is how you end up asserting what the code does instead of what it
should do.

1. **Specimen first.** Add `smoke-repo/packages/syntax-repository/src/<construct>/<rung>.ts` + a
   colocated `.test.ts`. If it's currently a dark spot, assert THAT first (a ratchet), then flip it.
   Adding a specimen also changes the e2e's compiled-surface counts — see §8.
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
- **`*/` inside a doc comment terminates the comment.** Writing a scope path like `*module*/classify` in
  a `/** … */` block produces baffling TS1109/TS1005 parse errors. Don't put scope paths in comments.
- **Tests may not contain conditionals** — including `result.success === true && result.x`. Assert the
  WHOLE discriminated-union result with `toStrictEqual`. No helper functions in test files either
  (`forbid-non-exported-functions`); a top-level `const` of DATA is fine.
- **Adding any non-test `.ts` to the syntax-repository package makes it part of the analysed surface.**
  A test-only shim at the package root silently inflated the e2e's `ts N` count. Map jest aliases
  straight at core instead of adding shim files.
- Adding a specimen changes three assertions in `packages/app/src/flows/app/surface-explorer.e2e.ts`:
  the header count, the sorted file-leaf list, the sorted dir list.
- Coverage IDs are **cache-internal by ruling** — changing them costs only fixture rewrites, never a
  migration. Do not contort the design to preserve an ID string.
