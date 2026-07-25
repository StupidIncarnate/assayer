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

**Types are read structurally too.** `read-type-fact` reads a type into a serializable fact —
primitive, union, ARRAY element type, or a LOCAL object type's enumerated (sorted) property list;
`type-descriptor` interprets that fact into the analysis model. An object's name is its symbol's, or
its ALIAS symbol's when the object symbol is the anonymous `__type` a `type X = { … }` produces, so
the interface and alias spellings of one shape are indistinguishable downstream. Only same-file
declarations enumerate: an imported object type is `any` in the hermetic walk (§5.10) and gets its
shape at the stitch.

`FileAnalysis.declaredTypes` projects the file's named local object shapes with their full property
lists — the source later phases splice per-property value demands onto. `declared-types-projection`
gathers it from TWO walk channels and needs both: `handle-type-declaration` records every
`interface`/`type` DECLARATION as a `declaredShape`, and every scope's params and return type carry
object descriptors. A types-only module mentions its own shapes in no signature, so the signature
channel alone leaves its declared surface empty and every reader of it is invoiced for a shape
Assayer can build itself; a shape a signature spells inline is in no declaration.

**Resolution is a separate post-compile stitch — the walk still never crosses a file.** A call to an
imported name records a raw `import` reference (the module-specifier's literal VALUE + the imported
name) and keeps going; the walk never opens the imported file, so import cycles are a non-event at walk
time. A second pass, over already-finished per-file blobs, turns those references into resolved edges by
LOOKUP, not by re-parsing (§9). One parse per file still holds.

---

## 4. Where to make a change

| You want to… | Touch |
| --- | --- |
| support a new syntax family | a new `handle-<x>-layer-adapter` + **one** route in `dispatch-node` |
| support a new callable shape | `handle-function-layer-adapter` (owns `FunctionLikeNode`) + its dispatch route |
| handle a new type shape | `transformers/type-descriptor` (`read-type-fact` only packs raw checker facts — primitives, unions, ARRAY element types, and a LOCAL object type's enumerated properties; an imported object type is `any` in the hermetic walk and is resolved at the stitch or by the consume-time `param-type-resolve` overlay, §5.10). A UNION keeps its members whenever ANY of them is representable and degrades to `unknown` only when NONE is — a value of one member IS a value of the union, which is the rule `is-type-fillable` states |
| handle a new comparison | `transformers/predicate` (`read-condition` only extracts the readout) |
| change coverage IDs | `transformers/coverage-id` + `transformers/exit-coverage-id` |
| change what identity is | `project-node-layer-adapter` |
| change operand typing | `read-operand-type-layer-adapter` (read §5.9 first) |
| capture an object-member operand (`config.mode`) | `read-condition` (+ `read-property-path` for the `.member` chain) — records `operandParamName` (root), `operandPropertyPath`, and `operandTypeRef` (the root param's declared type-reference NAME) for the stub stitch; the branch is UNDRIVEN in the per-file blob (gated in `derive-cases`, §5.12) and DRIVEN at consume time by `stub-realize` (§9) |
| drive an object-member branch from the stub view | `brokers/stub/realize` (the consume-time overlay) + `transformers/object-arrange` (arranges one object param's properties from the merged stub view; a corrected property is AUTHORITATIVE — only its values, no branch-literal fallback) — NEVER `derive-cases`, which stays scalar-only |
| give a parameter declared as an IMPORTED type the shape its declaration says | `brokers/param-type/resolve` (the consume-time overlay that runs FIRST) + its `resolve-type-ref-layer-broker` (one reference to one declaration, following named imports, re-export barrels and NAMESPACE imports — `import * as T` then `T.Leaf` forwards `Leaf` — seen-set for cycles, and instantiating a GENERIC declaration from the reference's type ARGUMENTS, resolved in the reader's own file and substituted for the declaration's `typeParams` by position) + `transformers/collect-type-refs` / `substitute-type-refs` / `substitute-condition-types` (the pure read/write halves) keyed by `transformers/type-ref-key`, the reference's declared RENDERING — `Box<string>` and `Box<number>` are one NAME and two demands, so a name-keyed map answers one with the other's shape. The walk records the reference NAME and its arguments on the opaque descriptor (`typeRef`/`typeArgs`, off `param.getTypeNode()` — §5.1-sanctioned, never `text`); the overlay resolves it and re-projects the file through `analyze-file-broker`, so there is ONE derivation path and nothing to reconcile. It does NOT move the file's own `declaredTypes` — a sibling's shape is not one this file declares, and letting one in would key its stub on the reader |
| give a parameter no case steers a value, or REFUSE one | `transformers/fill-param` — the ONE fill authority, which every fill site routes through (`cause-arrange`, `stub-realize`, the funnel and `through-*` builders). `guards/is-type-fillable` is the RULE (scalar/literal ⇒ yes; union ⇒ some member; array ⇒ its element; object ⇒ every property, so the property-less shape is `{}`; callable/unknown ⇒ no) and `transformers/fill-value` the recursive builder. There is NO placeholder fill: a parameter the seam refuses derives no case at all, never `'abc123'` handed to something that calls, dereferences or measures it |
| decide which parameters a CALL supplies | `transformers/applied-params`, asked once per layout site (`derive-cases` — which also gates steerability on it — plus `stub-realize`, `funnel-*` and `through-*`). A parameter the caller owes NOTHING (`optional`/`rest` on the descriptor, read off the ts-morph parameter in `handle-function` because the checker widens `report?: T` to `T`) and the seam refuses is not owed: `maybe(11)` is a real call, so invoicing it bills a debt nobody has. It TRUNCATES rather than filters — the interpreter applies an arrange positionally, so a hole would slide every later argument one slot left. A REQUIRED refusal stays and is invoiced |
| word the INVOICE for a refused parameter | `transformers/input-gap` — the one home of the P1 text. It names the type the SOURCE spells (`param.declaredText`, read off the type node by `read-declared-type-text` and carried only where the descriptor cannot reproduce it), never the descriptor's rendering: a `readonly [string, number]` enumerates as an anonymous shape carrying every member of `ReadonlyArray`, so rendering it buries the one actionable fact under a three-thousand-character dump — in the message AND in the harness snippet meant to be pasted. `derive-cases` reports the refusals as `unfillable` (deduped across buckets), and so does EVERY driving route (`through-caller-cases`, `through-callback-cases`, `funnel-cases`, `funnel-named-cases`, plus `compose-cross-file-map`), because every one of them routes through `fill-param` and a refusal it drops is a scope that silently derives nothing. A route's refusal carries `owner` — the scope that DECLARES the parameter — whenever the gap is filed against a different entry: a funnelled private or callback is no entry of its own, so its refusal is filed against the HOST a reader can drive and reads `on \`helper\``. `analyze-file-broker` merges both sources per entry onto `FileAnalysis.gaps`, `case-set-projection` CONCATENATES them with the access-shaped gaps it computes (one channel, two producers, the shared `entry-gap-contract` shape), and `stub-realize` CLEARS the gap for an entry it drives from the merged stub view. Severity is the global `inputGaps` toggle, which governs the EXIT CODE alone — `off` and `warn` print the same bytes; never a per-site waiver |
| decide which admission an entry PRINTS when it has two | `analyze-file-broker` — an entry carrying an input GAP has its UNDRIVEN admissions dropped. The channels stay separate and keep their own meanings; this is precedence, not a merge. An entry Assayer cannot construct an input for cannot be CALLED, so it has nothing to say about which branch it would steer, and "make the deciding value a parameter" beside "supply this input" is two contradictory next actions. The gap's own closing sentence promises only that the refusal ends — anything still in the way (an ACCESS gap, the undriven branch) states itself on its own line once the input lands |
| render a type the CHECKER collapses (`Db \| string` ⇒ `any`) | `read-declared-type-text-layer-adapter`, threaded into `read-type-fact` as `typeNode` (from `handle-function`, and down into array elements and object properties). It walks the type NODE by kind and asks the checker to render each part, so an opaque member reads as its own declared name. Display TEXT only — the classification is untouched, so what was refused stays refused |
| fan an array param out over cardinality (empty/one/many) | `transformers/array-arrange` (builds a real array of each size class, recursing for nested `number[][]` → `[[7]]`) + the array-cardinality cartesian in `transformers/cause-arrange` (folded into `arrangements` the ArrangeValue[] twin of the operand cartesian); `statics/array-cardinality` fixes the order (`empty` first ⇒ salient) and counts. Every array param takes this fan-out; a `.length` guard on an array DOES record a length predicate, and where that constrains an object PROPERTY the property is refused rather than filled, since no array of the demanded length is built yet |
| flag a committed correction that CONTRADICTS a guard (pre-run) | `transformers/gather-property-guards` (the per-guard seam, guard twin of `gather-type-reads`) + `transformers/stub-contradictions` (intersect corrected values with the guard's satisfying domain, `is-domain-empty`) — folded into `compile-run-broker`'s `errors[]` beside the stale-overlay reconcile (§9) |
| change reachability | `read-terminal` **or** `read-accounted` — they are different questions, read §5.8 first |
| decide whether a branch is DRIVABLE (steerable) | `transformers/derive-cases` — the ONE gate, every branch construct alike (§5.12); never a per-construct or per-position gate. It asks TWO questions per leaf — is the OPERAND arrangeable, and does the PREDICATE constrain (`guards/is-predicate-constraining`) — and reports which one failed as the `undriven-cause`, because the two have opposite remedies |
| EVALUATE a branch welded to a literal constant | capture the value where it is welded — `read-const-operand-layer-adapter` for a same-file `const` (stamps `operandConstValue`/`operandConstLength` on the leaf at walk time), `transformers/stamp-const-leaves` for a literal call/invocation ARGUMENT (stamped by the follower). Then it flows through the existing math: the `derive-cases` gate treats it as arrangeable, `cause-arrange` seeds a single-value domain, and the arm it violates falls out of `is-domain-empty` as an `unreachableExits` entry — a lint, never a second bogus case. The lint text is `transformers/unreachable-lint` |
| drive an inline function nothing calls BY NAME | `transformers/follow-calls` routes each shape: an IIFE (its start line in the walk's `invokedFns`, which carries the invocation args) to `transformers/through-invocation-cases` — module-load code, so `envDrivable` and welded invocation literals both drive it, and its entry ACCESS is `module`; an array-iteration callback to `through-callback-cases`; a named-call callee to `through-caller-cases`. A RETURNED closure stays UNDRIVEN — an external caller applies it |
| change what counts as a dark spot | `statics/significant-syntax-kinds` |
| change what becomes an entry | `transformers/analysis-projection` (policy lives there, not in the walk) |
| change what a call TARGETS (local / import / unresolved arms) | `read-callee-layer-adapter` — a same-file callee is a `local` link whether it is a `FunctionDeclaration` or a `const`/`let` bound to a function-like initializer (read off the declaration's KIND, and keyed on the INITIALIZER's line, which is where the walk opened that scope) |
| record an import / re-export edge | `handle-import-layer-adapter` / `handle-export-layer-adapter` + their routes in `dispatch-node`; projected by `transformers/module-graph-projection` |
| record a type DECLARATION (`interface Config`, `type Config = { … }`, `enum Level`) | `handle-type-declaration-layer-adapter` + its route in `dispatch-node` — reads the declaration through the SAME `read-type-fact` → `type-descriptor` pipeline every signature goes through, and emits the declared NAME (plus `typeParams` for a generic one) beside the descriptor on the flat `declaredShapes` channel (the name is the only fact the descriptor cannot hold for itself: `type Id = string` denotes a descriptor with no name slot, so a name-keyed lookup would miss every alias to a scalar or a union). An ALIAS also hands its right-hand type NODE to the reader, or `type BeeT = AyT` records no reference and an alias CHAIN stops one file short of the shape it names. A CLASS declares its instance shape on the same channel, from `handle-class` — a sibling taking a `Point` needs the same answer whether `Point` is an interface or a class; projected by `transformers/declared-types-projection` alongside the signature descriptors (§3) |
| record an ambient global USE (`console`, `process`) | `handle-member-access-layer-adapter` (member forms) / `handle-call` (bare-identifier global calls) + `read-ambient-root-layer-adapter`; projected as `globalUses` by `transformers/module-graph-projection` |
| record a `process.env.<X>` env read | `handle-member-access-layer-adapter` (the outer `process.env.<X>` access — property name + any equality-comparison literal); projected as `envReads` by `transformers/module-graph-projection`, aggregated into per-property env stubs by the stub stitch (§9) |
| change import resolution (the stitch) | `brokers/compile/resolve-graph` + `adapters/typescript/{read-config,resolve-module}` |
| change the stub index (per-property value demands over declared types) | `brokers/compile/stub-graph` (the twin stitch; also returns the per-guard `guards` for the contradiction check) + `transformers/gather-type-reads` (the reader/type seam) + `transformers/collect-property-demands` (the value math); written by `brokers/stub-index/write` |
| read an external (npm / node) signature | `brokers/external-signature/read` + `adapters/ts-morph/read-external-signature` (the SECOND, node_modules-aware project — §5.10) |
| read an ambient global / called-builtin signature | `brokers/external-signature/read-global` + `adapters/ts-morph/read-global-signature` (probes the SAME second project's GLOBAL scope — a builtin resolves only in the checker, never a `.d.ts` path) |
| decide whether a `*.harness.ts` is ASSAYER'S | `adapters/typescript/harness-gate` (the symbol gate: does the module import `assayerHarness` from `@assayer/core` and CALL it) + `brokers/harness/classify`, the ONE place a planned file is split into an analysed target or a harness — called by BOTH plan brokers, so the working tree and a committed ref never disagree. Never the source-inclusion guard: a blanket `.harness.` rule would drop a consumer's real source |
| change what a harness can DECLARE | `contracts/harness-declaration` (the PUBLISHED type, two open catchall shapes rather than `z.record` — a branded-key record infers `Partial<Record<…>>`, which an author's `{ audit: { report } }` literal cannot satisfy) + `transformers/assayer-harness`, the registration seam itself, republished as `assayerHarness` from the package's MAIN barrel (`packages/core/index.ts`), which is the specifier the input-gap invoice tells a reader to import |
| change how a harness is READ | `adapters/typescript/load-harness` — `transpileModule` (no require hook, nothing added to the module cache) then `runInContext` in a bare sandbox holding a CommonJS shell and ONE reachable import: `@assayer/core`, bound to that call's collector. A thrown error is read with `util.types.isNativeError`, never `instanceof Error`, because an error raised inside the sandbox belongs to that context's own constructor |
| change the harness index (the key inventory) | `brokers/compile/harness-graph` (the THIRD stitch — §9) + `transformers/harness-target` (which source a harness addresses) / `transformers/harness-keys` (the sorted, deduped (entry, param) pairs); written by `brokers/harness-index/write` |
| word a P1 about a WRONG harness key | `transformers/harness-validate` — the harness twin of `stub-overlay-reconcile`, reconciling declared keys against the target's ANALYSIS: an entry the file does not offer, a parameter the entry does not take (both with `transformers/did-you-mean` beside the full candidate list), a parameter `is-type-fillable` says Assayer builds itself, and a file that declares nothing at all |
| PAY an input gap with the harness that answers it | `brokers/harness/realize` (the consume-time overlay, §9) — it re-derives each invoiced entry through the SAME `derive-cases`, handing it `harness: { entry, params }`, so `cause-arrange` emits a `harness` binding where the fill seam would have refused. Wired at the SAME three seams the other overlays are, LAST, because everything ahead of it can still turn a refusal into something Assayer builds itself. NEVER a second derivation path — a supplied entry's cases differ from a derived one's in exactly one binding |
| resolve a harness-supplied value AT RUN TIME | the generated shim (`transformers/assemble-shim`) REQUIRES the harness through ts-jest, and Jest maps `@assayer/core` to the root `harness-registrar.js` (`adapters/jest/run-cli`) so the registration lands where the shim can read it — resolving the package from the harness and from the shim can otherwise land on two installs in a workspace, and two module instances mean a declaration nobody collected. `adapters/jest/interpret-case` then walks the key path with `transformers/harness-value`; a key the declaration does not carry is an `errored` case NAMING it, never a silent `undefined` argument |
| name a harness by its (entry, parameter) pair | `transformers/harness-key-path` writes `inputs.<entry>.<param>`, `transformers/harness-value` splits it back apart, and both read `statics/harness-module` — two spellings of one route is how a case comes to name a key nothing can resolve. `transformers/harness-path` is the source→harness direction (`harness-target` is the inverse) |

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

`getText()` currently appears in the analyzer only in these two sanctioned uses. Do not cite them as
precedent for a third:

- `node.getText()` on an **Identifier or type-reference NAME** (`project-node`, `read-condition`,
  `read-type-fact`, `desugar-switch`) — an identifier's text IS its name; there is no formatting freedom
  in it. This covers `read-condition` reading an object-member operand's ROOT identifier (`config` in
  `config.mode`) and the type-reference name the root param declares (`Config`, off
  `param.getTypeNode()`), `read-type-fact` reading the same reference name onto an opaque type's
  `typeRef`, and `handle-type-declaration` reading a declaration's own name — all spelling-invariant
  names, and all foreign KEYS a later phase resolves by, never display. *Open question, not settled:* this is the
  identifier's spelling, not its resolved symbol, so renaming a local currently moves the ID. That is
  churn-matrix #5 and is explicitly undecided in `plan/requirements.md` — if you resolve it, resolve it
  there, in `project-node`, once.
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
value (P4 forbids that) but because `return xs.map((n) => …)` contains a whole scope. A `return a ? b :
c` is split per arm by `read-conditional-exit` before that descent; any other expression is descended
whole. Skipping the descent drops the scopes and calls hiding in it.

**5.7 — Never parse twice.** `walk-file` runs once; the analysis and map are pure projections of that
one model. Two parses is how the old map and analysis could disagree about the same file.

**5.8 — Keep the two reachability predicates separate.**
- `read-terminal` = "does this ALWAYS exit?" → decides whether code AFTER it is guarded by one of its arms.
- `read-accounted` = "are its ways out already emitted?" → decides whether the scope owes a completion exit.

They differ for an `if`-with-else whose arms fall through: *accounted for* (each arm gets a completion
exit) but does NOT *always exit* (code after it runs on both arms). Merging them is a real soundness
bug — it guards a trailing `return` by an arm it doesn't depend on and keys it under a wrong ID.
Pinned by `smoke-repo/.../happy-path/composition/fallthrough-in-if`.

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

External types are read WITHOUT weakening any of this. When a resolved import needs its declared
input/output types, a SEPARATE, node_modules-aware project reads them out of band —
`adapters/ts-morph/read-external-signature` opens `new Project` WITHOUT `useInMemoryFileSystem`,
rooted at the consumer repo so `node_modules`/`@types` resolve, and reads DECLARED types only
(P4-safe). This second project is the sanctioned way to read externals; the hermetic walk above is
never given `node_modules`, which is exactly what keeps the `process.env` proof intact. The two
projects stay strictly separate.

**5.11 — An exit owes a probe SITE, minted where its id is minted.** Every handler that emits an exit
emits its site in the same expression (`handle-if` per arm completion, `handle-function` per body,
`handle-source-file` per file end). Derive sites in a second pass and a runtime observation can key
under an id the analyzer never produced. Two site shapes, because two things are observed: an
EXPRESSION exit is wrapped in place (value passes through, short-circuit preserved), while an
IMPLICIT one — falling off the end of an arm, a body, or the file — has no expression at all, so its
site is the statement CONTAINER and the probe is APPENDED (`kind: 'complete'`). An implicit exit with
no site is unobservable, and a case predicting one reports "reached no exit" against code that
reached it perfectly.

**5.12 — One syntax, one channel; decide drivability ONCE, never per position.** The same form is read
the same way no matter what encloses it. Position may pick a LENS — never a per-position VARIANT of one.
The value/exit lens has a single reader: a conditional expression (a ternary, a `&&`/`||`/`??` chain, a
`?.`) is handed to `read-conditional-exit` in EVERY value position — `return`, `throw`, a concise-arrow
body, and the value-flow `const x = …; return x` tail — and split into per-arm exits identically each
time. (An expression AS A CONDITION is the OTHER lens — `if`, a ternary's own condition, a `??`/`?.`
non-nullishness — read by `read-condition` / `read-condition-tree` / `read-nullish-leaf`. `a && b` is one
predicate in `if (a && b)` and two value-paths in `return a && b` because those are different lenses, not
two readers for one lens.)

Whether a branch can be STEERED is likewise decided in ONE place — the `derive-cases` steerability gate —
for `if`, `switch`, ternary, `&&`/`||`/`??` and `?.` alike, and it asks TWO questions of every condition
leaf. Is there an input a case can set: a PLAIN SCALAR param, an env operand, or a WELDED literal constant.
And does the PREDICATE name a value to set it to (`is-predicate-constraining`, which asks the same
`type-to-range` engine the arrangement runs). Either one missing ⇒ admitted UNDRIVEN, and the admission says
WHICH, because the two send the reader to different places: `unarrangeable-operand` means make the deciding
value a parameter, `unread-comparison` means compare against a literal. Telling a reader to make `m` a
parameter when `m` already is one is advice they cannot act on. The incident the second question closes:
`m === TARGET`, `case Sev.Low` and every enum/as-const/imported comparand read as an `unrecognized`
predicate that constrains NEITHER arm, so both arms arranged the same value, and whichever case predicted
`#then` failed the build against correct code. A welded leaf (`operandConstValue` / `operandConstLength`,
stamped by `read-const-operand` for a same-file `const`, or by `stamp-const-leaves` for a literal
call/invocation argument) is not STEERED but EVALUATED: `cause-arrange` seeds it as a single-value domain,
so the arm it satisfies is a case and the arm it violates falls out of the SAME emptiness arithmetic as an
`unreachableExits` entry — never a second, bogus case. Weldedness answers only the first question: with an
unreadable comparison the single value reaches both arms, so it stays undriven. An object-member read
(`config.mode`) names its root param but is
NOT scalar-arrangeable, so PER-FILE a leaf carrying `operandPropertyPath` stays un-steerable and its branch
is admitted UNDRIVEN, the property fact captured for the stub stitch. That admission is closed at CONSUME
time: `stub-realize` (§9), the object twin of compose, arranges the object param from the merged stub view
(derived per-property demands + the committed `assayer/stubs/` overlay) and DRIVES the branch — so an
object-member branch is undriven in the blob and driven in the run, exactly as an opaque call-guard is. A branchless predicate's return comparison (the `returnPredicate` axis)
rides the SAME gate, but its failure mode differs: an un-steerable one is simply OMITTED — the entry is
still callable, it just cannot tell its two return values apart — never admitted undriven. The incident
this forbids: a `?.` receiver was gated on `context.params`
INSIDE `read-conditional-exit`, and `read-value-flow-exit` carried its own drivability gate — so one
`cond ? a : b` came out three ways (split, single-exit, or dark spot) by nothing but whether it sat in a
`return`, behind a `const`, or after a `?.`. Both gates were deleted. Asking "is this drivable?" anywhere
but `derive-cases`, or reading one lens two ways by position, re-opens it.

**5.13 — The case set is the full input-bucket BREADTH; `salient` marks the execution subset.**
`derive-cases` produces one case per input COMBINATION the logic distinguishes — the cartesian product
of every branch's arms (each arm's short-circuit causes kept distinct), a branchless predicate's
`true`/`false` return, and every array param's cardinality classes (empty/one/many, built by
`array-arrange` and crossed in `cause-arrange`) — EVEN when several combinations reach the same exit. Every case carries
`salient`: the salient subset is one representative per PREDICTED OUTPUT (the minimal set worth
RUNNING), and the full set is the file's testable breadth. So a file's case count is the breadth, and
`salient` is what a reviewer reads as must-run.

Predicted output is `reachesPath`, because two buckets reaching one exit path return the same literal —
the SOLE exception is a branchless predicate, whose two return values leave by the same exit, so
`predWant` splits them and each earns a salient case. Everything else that shares an exit collapses: the first is
salient, the rest are the grayed breadth. A converging branch is therefore NOT dropped — its off-path
buckets (a bucket may constrain a branch its flow never reaches; that arm is SOUND) stay in the full set
as grayed twins. Effects are not modeled, so two buckets differing only by a side effect over-collapse in
the salient subset; the full set still carries both. The cross-system stub repository (the value demands
objects/arrays/env carry) is a SEPARATE artifact — `plan/requirements.md` D22/D23 (artifact inventory #9).

---

## 6. Adding a construct — the recipe

Do these in order. Skipping step 1 is how you end up asserting what the code does instead of what it
should do.

1. **Specimen first.** Add `smoke-repo/packages/syntax-repository/src/<bucket>/<category>/<rung>/<rung>.ts`
   + a colocated `<rung>.test.ts` holding only what is BESPOKE to that file (exact coverage IDs, the
   shape of its analysis). The catalogue is bucketed by RUN VERDICT: `<bucket>` is `happy-path/` if
   running the root file comes out clean (≥1 case, all passed, no admission) or `sad-path/` if it is
   meant to come out unclean (a failing case, or a dark spot / gap / undriven / lint). Category folders
   group examples; every example is its own eponymous folder (`<rung>/<rung>.ts`), so a multi-file rung
   keeps helper children beside its root. A ratchet that flips — a dark spot the day its handler lands —
   MOVES from `sad-path/` to `happy-path/`. If it's currently a dark spot, assert THAT first (a
   ratchet), then flip it. The surface e2e derives its expected surface off disk, so it needs no edit
   for a new file — see §8.
1b. **Declare it** in `packages/core/test/harnesses/specimen-registry.ts` — one line naming what the
   file IS (`['access:named', 'branch:if']`), never what to test. The matrix walks the catalogue off
   disk, so an undeclared specimen fails the catalogue check rather than being skipped, and the
   declared traits alone decide which checks it owes. Everything universal (valid TypeScript,
   determinism, produces a run artifact, sits at `<bucket>/…/<name>/<name>.ts`, and runs to the
   verdict its bucket declares) then applies with nothing written.
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
- **An expression-level branch is EXIT-OWNERSHIP, not a handler — which is why §6's recipe does not
  reach it.** `guardPath` assumes a guard is a STATEMENT enclosing STATEMENTS; a ternary's arms guard
  an expression SUBTREE. `handle-exit` emits its exit BEFORE descending and exits merge UPWARD
  (`walk-node-layer-adapter.ts`), so a branch inside a `return` cannot make that `return` retract its
  own unguarded exit from the outside. The exit's OWNER splits it instead: an exit-position ternary
  (`return`/`throw cond ? a : b`, and a concise-arrow body that IS a ternary) is handed to
  `read-conditional-exit-layer-adapter`, which reads the condition as a `ternary` branch and emits one
  guarded exit per arm (recursing for nested ternaries) — delegated from `handle-exit` (block-bodied
  return/throw) and from `handle-function` (the concise-arrow body, which never reaches `handle-exit`).
  A non-ternary expression returns the `{ conditional: false }` sentinel, so the single-exit path is
  unchanged. VALUE-POSITION value-flow rides the SAME split, at the block seam: `read-value-flow-exit`
  matches an adjacent `const x = <conditional>; return x`/`throw x` tail (single const binding, the exit
  expression EXACTLY that identifier by SYMBOL, a solver-drivable condition) and hands `handle-block` the
  same per-arm split — `x` never appears, the exit is `return cond ? y : z`. `handle-block` drops the two
  consumed statements from its descent and folds the facts in; `handle-function` MERGES the block
  result's branches/exits/probe-sites/nodes (not just its descents), and the scope claims them via
  `opensScope`. What stays the marked `ConditionalExpression` dark spot is what that tight
  `≡ return cond ? y : z` equivalence STRUCTURALLY cannot reach: a non-adjacent or transformed use
  (`return x + 1`, `f(x)`), `let`/reassignment, and argument-position or JSX ternaries — reachable only
  through the later def-site-derived reverse-map rung, not v1. A non-drivable CONDITION is NOT a dark
  spot: the branch is emitted and the `derive-cases` steerability gate (§5.12) admits it UNDRIVEN, never
  a spurious case.
- **`*/` inside a doc comment terminates the comment.** Writing a scope path like `*module*/classify` in
  a `/** … */` block produces baffling TS1109/TS1005 parse errors. Don't put scope paths in comments.
- **Tests may not contain conditionals** — including `result.success === true && result.x`. Assert the
  WHOLE discriminated-union result with `toStrictEqual`. No helper functions in test files either
  (`forbid-non-exported-functions`); a top-level `const` of DATA is fine.
- **Adding any non-test `.ts` to the syntax-repository package makes it part of the analysed surface.**
  A test-only shim at the package root silently inflated the e2e's `ts N` count. Map jest aliases
  straight at core instead of adding shim files.
- Adding a specimen needs NO edit to the surface e2e. `packages/app/src/flows/app/surface-tree.e2e.ts`
  derives the compiled surface — the header `ts N` count, the sorted file-leaf list, the sorted dir
  list — off disk via `syntaxSurfaceHarness` (the same `.ts`-excluding-`.test.ts` inclusion rule the
  compiler uses), so it self-maintains. The one edit a new specimen still requires is its line in
  `specimen-registry.ts`, without which the catalogue check fails.
- **MOVING a specimen is the opposite: literal paths elsewhere break, and only at run time.** The
  registry keys on the path, and so do consumers that name a specimen to prove a RUN behaviour —
  `run-unit-broker.integration.test.ts` (`MODULE_SPECIMEN` and its siblings) and the app e2es, which
  select by `data-relpath` (`detail-admissions.e2e.ts`, `detail-tests-tab.e2e.ts`). Miss one and the
  integration ENOENTs or the e2e clicks nothing. Native grep is blocked here, so sweep with the
  `discover` tool before and after the move. A move that changes a specimen's VERDICT (a rung flipping
  from an admission to a driven case) also moves its bucket, which is what those consumers assert.
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

---

## 9. Cross-file & external resolution (the stitch)

The walk parses one file and records what leaves it as raw references (an `import` callee arm on a
call site; flat `moduleEdge`s for import/re-export statements). A separate post-compile **stitch** turns
those into resolved edges. It never re-parses source — it reads already-finished blobs back from
`blobsDir` (a reused file is not re-analyzed in-run, so its record is on disk) and reconciles by lookup.

- **Reconcile on the definition site, never the specifier string.** Different spellings (`../b/foo` vs
  `../../b/foo`) and aliases (`@app/foo`) resolve — through TypeScript's own `ts.resolveModuleName`
  (`adapters/typescript/resolve-module`, config via `adapters/typescript/read-config`) — to one
  canonical repo-relative `(file, symbol)`. Re-export barrels are followed to the definition with a
  seen-set (recursion, not `while(true)`); the seen-set is the only guard a cycle needs, because the
  walk never recursed across the file in the first place.
- **Classify `local` / `package` / `builtin` / `unresolved`.** `brokers/compile/resolve-graph` emits
  resolved edges + resolution errors. A `local` target is keyed by its in-repo definition path; a
  `package`/`builtin` target is keyed by package name.
- **External signatures via the SECOND project (§5.10).** A CALLED package or builtin edge carries the
  declared `{ params, returnType }` of its callable — read through `adapters/ts-morph/read-external-signature`
  and fed through the EXISTING `read-type-fact → type-descriptor` pipeline, so no new type language —
  cached by `.d.ts` byte hash at `.assayer/cache/external-signatures/<declHash>.json` and reused by
  every importer. An import that ships no usable types raises `no-usable-types`.
- **Ambient globals + typed builtins via the SECOND project's GLOBAL scope.** A free identifier the
  hermetic walk cannot type (`console`, `process`, `Buffer` — resolving to a host lib or to nothing,
  never to the ES lib) is recorded WITHOUT resolving as a `globalUse`, and a CALLED node builtin
  (`import { join } from 'node:path'; join(a,b)`) is read the same way. The stitch resolves each by
  PROBING the second project — a called reference yields a `{params,returnType}` signature, a member
  access (`process.env`) its member type — cached at `.assayer/cache/global-signatures/<hash>.json`.
  Each resolves to a `{ kind: 'global', name, member?, signature?/type? }` resolved-edge arm (a called
  builtin instead enriches its `builtin` edge with a signature). A resolved edge is emitted for EVERY
  use so a candidate is never invisible; a CALLED use `@types/node` cannot type is additionally a
  no-usable-types build error at the call site (a member access that cannot be typed is merely
  recorded). This is the sanctioned way node stuff gets a cache entry; the hermetic walk stays typeless
  (§5.10 is untouched, and `read-env-operand` still proves `process.env` on its own).
- **Cache split keeps it honest.** Per-file blobs stay content-keyed and pure (raw references + module
  edges). The resolved index is DERIVED, keyed on repo layout + tsconfig hash, rebuilt when the file set
  or tsconfig changes; written to `.assayer/cache/resolved/<namespace>.json`. A pure file move re-parses
  nothing (blobs are content-addressed) and re-resolves edges against the new layout, so a
  moved-but-not-updated import surfaces as a broken link, never a stale pointer.
- **The stub index is a TWIN stitch over the same blobs.** `compile-stub-graph-broker` reads the finished
  blobs back by lookup — never re-parsing, never re-resolving, blobs stay pure — and for every object type
  a blob declares, splices per-property value demands onto the type's FULL declared property list: a
  property some branch reads (`config.mode`) carries the values that branch distinguishes (the SAME
  `type-to-range → domain-values` math the case engine runs — the object-member branch is admitted
  UNDRIVEN, yet its branched VALUES are real demands), a property no reader touches is an honest `unknown`.
  It keys on the SAME layout + tsconfig hash the resolved index it is handed already carries, and writes
  `.assayer/cache/stubs/<namespace>.json` (keyed by `<definitionRelPath>#<TypeName>`) atomically via
  `stub-index-write-broker`. Which blobs' read facts feed a type — and which files read it — is decided in
  ONE seam (`gather-type-reads-transformer`), which INVERTS the resolved index: a type declared in one file
  and branched on across several is keyed on its DEFINITION site, and every reader's per-property demand is
  UNIONED onto it, `readers[]` listing exactly the files that read it. A reader reaches its definition by
  reconciling the branch leaf's `operandTypeRef` — a SAME-FILE type resolves to the reader itself, a
  cross-file type through the reader's `local` import edge (a type-only `import { Config } from './types'`
  is recorded as a module edge like any other, so the resolved index carries it with no special case). The
  per-property value math (`collect-property-demands-transformer`) stays put on the far side of the seam.
- **Env reads are the object twin — `process.env` IS an object.** `gather-env-reads-transformer` folds
  every file's `process.env.<X>` reads into one env stub per property keyed `process.env#<PROP>`, keyed on
  the property name (never a type, since `process.env` has no declared shape in the hermetic walk). Two
  facts feed it, both already on the blob: the module graph's `envReads` (bare `process.env.<X>` reads the
  walk captured, carrying the property and any equality-comparison literal) and the Number-coerced branch
  leaves (`operandEnvVarName` names the property, the predicate literal is the switch/if value). `values`
  are the distinct branch literals GUESSED plus one representative for anything else, marked `guessed:true`
  (a best-effort guess a human later corrects, never authoritative); `readers[]` lists every file that
  reads the property. This runs REGARDLESS of drivability — a bare `process.env.MODE === 'x'` compare is
  admitted UNDRIVEN (§5.10 — it types as `any`), yet its literal is a real stub demand. The env proof
  stays checker-based; nothing here adds `node_modules` to the walk.
- **`param-type-resolve` gives an IMPORTED parameter type its declared shape — the overlay every other
  one runs behind.** The hermetic walk types an imported type as `any` (§5.10) and records only the
  reference the signature spelled, so `fill-param` refuses the parameter and the entry is invoiced for an
  input the file next door constructs happily. `param-type-resolve-broker` reads that declaration off the
  sibling on disk — the same per-run sibling read compose and stub-realize do — and it turns on the
  DECLARATION alone, never on how the entry happens to BRANCH: a reader that merely uses the value gets
  its shape exactly as one that reads a member does. What comes back is whatever the declaration denotes
  (a scalar alias, a literal union, an array, an object), so the existing derivation does the rest with
  nothing added. Two INPUT facts move together — the parameter's declared type and each branch leaf's
  OPERAND type — because an opaque operand knows only the point to avoid, so `level === 'low'` would fill
  both arms with `'low'` and predict one exit while reaching the other. The walk's parameters are
  rewritten and `analyze-file-broker` re-projects the file from them, which is why there is one
  derivation path and no reconciliation to drift. The file's own `declaredTypes` are carried through
  untouched: a sibling's shape is not a shape this file declares, and admitting one would key its stub on
  the reader rather than on the definition. Wired at the SAME three seams as the overlays below, ahead of
  them, and a same-reference pass-through for a file whose parameters name no resolvable reference.
- **`stub-realize` DRIVES object-member branches at consume time — the object twin of compose.** A
  branch on `config.mode` is admitted UNDRIVEN in the per-file blob (an object param's property is not
  scalar-arrangeable, §5.12). `stub-realize-broker` closes that at run/serve time, exactly where compose
  closes an opaque call-guard: for an entry whose branches all read object members of a stubbable type it
  builds that type's merged stub view (the derived per-property demands via `collect-property-demands`
  combined with the committed overlay via `stub-view`), enumerates the same input buckets `derive-cases`
  does, and hands each object param to `object-arrange-transformer`, which fills every property with a
  stub value SATISFYING that bucket's requirement — the object-arrange discriminant `{ kind:'object',
  param, value:{ prop: val, … } }`. A property WITH a committed correction is AUTHORITATIVE: object-arrange
  seeds its narrowed domain from ONLY the corrected values, so it never falls back to the branch literal —
  and when no corrected value satisfies the guard the bucket is unreachable and dropped (no bogus case),
  the contradiction itself raised as a P1 by `stub-contradictions` before running. A property WITHOUT a
  correction keeps the derived demand (which inherently contains the branch literals, so its guard is
  always satisfiable). A same-file type reads off `declaredTypes`; a cross-file type resolves
  through the import the entry declares and its definition is re-walked on disk, the same per-run sibling
  read compose does. Values are INPUTS (a human correction wins over the derived demand), never outputs
  (P4) — the case asserts reaching an exit structurally. It is a per-run overlay, NEVER persisted into a
  blob or the cache, wired into the SAME three seams compose is (`run-unit-broker`, the `syntax-traits`
  harness, `compiled-file-resolve-broker`). A human correction thus becomes a real case that runs and can
  fail — the payoff the stub repository exists for.
- **The committed overlay combines with the derived stub index at READ time, never in a hash.** The
  DERIVED stub index above is cache-internal; a human corrects a value in the COMMITTED
  `assayer/stubs/` (`objects/<definitionRelPath>/<TypeName>.json`, `env/<PROPERTY>.json`), OUTSIDE the
  cache, the file PATH carrying the stub's stable key. `stub-overlay-load-broker` reads it,
  `stub-view-transformer` combines derived + overlay (a correction REPLACES the demanded values of each
  property it names, or an env stub's values; unmentioned properties keep the derived demand) — computed
  fresh per read, NEVER persisted merged. The overlay is in NO hash, so editing it never invalidates the
  derived index; the cache stays disposable/rebuildable. Two ways a correction is WRONG, both P1 build
  errors folded into `compile-run-broker`'s `errors[]` (exit 1, the same class as a broken import), each
  naming the overlay file, the identity, and the fix. A STALE correction — its type-key absent from the
  index, a named property absent from that type's full list, or an env key absent from the env stubs — is
  raised by `stub-overlay-reconcile-broker`. A CONTRADICTING correction — its authoritative values cannot
  satisfy a branch guard that reads the property (`mode === 'a'` where the corrected `mode` omits `'a'`) —
  is dead code under the human's truth, caught BEFORE running by `stub-contradictions-transformer`: over
  the per-guard `guards` the stub stitch gathered (`gather-property-guards`, the guard twin of
  `gather-type-reads`), it intersects the corrected values (a fixed-member domain) with the guard's
  satisfying domain (`type-to-range → intersect-domains`) and reports the ones `is-domain-empty` proves
  unreachable — the SAME emptiness machinery as the unreachable-exit lint, naming the reader:line. Only a
  literal-carrying guard is judged; a truthy/falsy satisfying domain is a sample, never a constraint, so it
  is skipped. This is the first concrete instance of the committed-override-reconciled-against-a-derived-map
  pattern (the named-states pattern, still unbuilt).
- **The harness index is a THIRD stitch, over the files classified OUT of the analysed surface.**
  `compile-harness-graph-broker` runs beside the stub stitch on the same collision rule and reads the same
  finished blobs by lookup, but what it stitches is the committed `<basename>.harness.ts` files the plan
  brokers split off. LOADING IS THE READ: a harness declares callbacks, so there is no way to know what it
  says except to run it — transpiled and evaluated in a sandbox whose only reachable import is the
  published `assayerHarness` bound to that call's collector, which is why the compile-time key inventory
  and the run-time values are validated by ONE function. Only KEYS are written
  (`.assayer/cache/harness/<namespace>.json`), because a callback does not serialize and its absence is
  what keeps the index deterministic. It carries a THIRD hash the other two indexes cannot: `layoutHash`
  and `tsconfigHash` come from the resolved index, and a harness is in NEITHER, so `harnessHash` — over the
  harness files' own paths and bytes — is what makes a harness-only edit rebuild it. A harness whose target
  is not in the analysed surface, or whose module body throws, is a P1 and is left OUT of the index; one
  that loaded is recorded even when its keys are wrong, because the index is the inventory of what was
  declared and the errors are what says the declaration is wrong.
- **`harness-realize` PAYS the input gap at consume time — the caller-debt twin of stub-realize.** A
  parameter the fill seam refuses is invoiced as a GAP in the per-file blob (§5.12's fill authority has no
  vocabulary for a callback). `harness-realize-broker` closes that at run/serve time: it finds the
  colocated `<basename>.harness.ts` by the same CONJUNCTION the stitch uses (basename plus the symbol
  gate), loads it through the same `typescript/load-harness`, and re-derives each invoiced entry through
  the SAME `derive-cases` with `harness: { entry, params }` — so `cause-arrange` emits
  `{ kind:'harness', param, key }` where it would have refused, and the entry's cases differ from a
  derived entry's in exactly that one binding. A key naming a parameter the entry does not declare reaches
  no derivation (the stitch reports it as a P1); a harness whose body throws leaves the analysis untouched,
  since a second voice would say the stitch's P1 twice. A PARTIAL harness keeps the gap, re-invoiced from
  the refusals that REMAIN — reprinting the original would bill the reader for what they just supplied.
  Paying a gap REVIVES the undriven admissions it was suppressing (the precedence rule in
  `analyze-file-broker`), which is exactly what the invoice's closing sentence promised. It is a per-run
  overlay, NEVER persisted, wired at the SAME three seams the others are (`run-unit-broker`, the
  `syntax-traits` harness, `compiled-file-resolve-broker`) and LAST, because every overlay ahead of it can
  still turn a refusal into something Assayer builds itself.
- **The VALUES resolve at run time, from the same file and the same registrar.** Only KEYS are cached, so
  the shim loads the harness itself: `case-set-projection` carries `harnessPath` (absolute, like
  `modulePath`) exactly when some case names a harness binding, the shim REQUIRES it through the same
  ts-jest transform the subject goes through, and `jest-run-cli-adapter` maps `@assayer/core` to the root
  `harness-registrar.js` so the registration lands where the shim reads it. The mapping is what makes the
  read deterministic: resolving the package from the harness and from the shim can land on two installs in
  a workspace, and two module instances mean a declaration nobody collected and every key reported missing.
  `jest-interpret-case-adapter` then walks the key path (`transformers/harness-value`) and applies the
  value positionally; a key the declaration does not carry is an `errored` case NAMING the key — never a
  throw, and never a silent `undefined` argument, which would let the entry run on a value nobody supplied
  and report whatever it then did as a verdict. The harness is NOT instrumented: no probe plan is written
  for it, so the probe transformer's content-hash lookup misses and it passes through, which is already the
  correct "not analysed surface" behaviour.
- **Resolution failure is a BUILD ERROR, not a dark spot — the distinction is WHO OWES the fix.** A dark
  spot is Assayer admitting it never understood some syntax (its debt, unactionable for the reader). An
  unresolvable import is understood perfectly and simply broken or opaque, so it is the REPO's to fix:
  it surfaces at the call site (`relPath:line:column message`, P1) through `compile-run-broker`'s
  existing `errors[]` — exit 1, the same class as a parse failure — with reason
  `cannot-resolve-specifier` / `dynamic-or-computed-specifier` / `no-usable-types`. Never route one
  through the dark-spot channel; telling the reader to fix their own for-loop is a dark spot's problem,
  telling them to fix a broken import is a build error they can act on.
