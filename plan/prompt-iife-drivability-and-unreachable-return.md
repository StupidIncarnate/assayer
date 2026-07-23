# Prompt: make IIFEs drivable + mark the welded IIFE's last return as an unreachable exit

## The surface task (two deliverables)

1. **Add a WORKING (driven) IIFE example** under
   `smoke-repo/packages/syntax-repository/src/happy-path/function/iife/iife.ts` — an IIFE whose branch
   actually drives to real cases (not admitted undriven).
2. **Fix the existing welded IIFE specimen**
   `smoke-repo/packages/syntax-repository/src/sad-path/undriven/iife/iife.ts` so its analysis marks the
   reachable `if`-arm as a real (driven/observed) case and the final `return 'small'` as an
   **`unreachable-exit`** (NOT a dark spot). Today the whole arrow is blanket-admitted `undriven`, which
   is a misclassification: with the welded argument `7`, `n > 5` is always true, so the `if`-arm is
   runnable and only the last `return` is unreachable.

---

## READ THIS FIRST — do NOT take this prompt at face value

This prompt was written by a prior session and encodes *its* understanding and *its* proposed design.
Treat it as a lead to verify, not a spec to implement blindly.

- **Reproduce the ground truth yourself** (probe the analyzer — see "Ground truth" below) before trusting
  any claim here.
- **Read the code you intend to change** and confirm the mechanism actually behaves as described.
- **Expect the correct fix to be BROADER than "just the IIFE."** See "The design tension you MUST
  resolve." Do not patch the IIFE in isolation if that makes it inconsistent with `welded-const` /
  `welded-arg`; surface the inconsistency and decide the scope deliberately (with the user if needed).
- If `packages/core/CLAUDE.md`, `plan/requirements.md`, or `plan/expectation-catalog.md` disagree with
  anything here, **they win** — this is a task note, not design source of truth.

---

## Get up to speed BEFORE you plan (read these, in order)

You are changing the analyzer's driving/reachability logic. Read the design first, then the exact code:

1. `packages/core/CLAUDE.md` in full — especially:
   - §2 (the one walk, context flows down),
   - §5.10 (the hermetic walk has NO node_modules; how `process.env` is *proven*, not pattern-matched;
     the one-hop-through-`Number` env rung),
   - §5.12 (drivability is decided in ONE place — `derive-cases` — never per position/construct),
   - §5.13 (the case set is the full input-bucket breadth; `salient`; unreachable exits),
   - §6 (adding a construct: specimen first, declare in the registry by READING the file),
   - §7 (verification loop: probe before you assert), §9 (the stitch).
2. `packages/core/src/transformers/derive-cases/derive-cases-transformer.ts` — the steerability gate,
   the `envDrivable` flag, and how `unreachableExits` is computed (an exit is unreachable iff every
   bucket that maps to it is infeasible).
3. `packages/core/src/transformers/cause-arrange/cause-arrange-transformer.ts` — how an env operand
   becomes an `env` arrange binding, how value domains INTERSECT, and how an empty intersection ⇒
   `unreachable`.
4. `packages/core/src/adapters/ts-morph/walk-file/read-env-operand-layer-adapter.ts` — how
   `Number(process.env.X)` is recognized (checker-based, §5.10).
5. `packages/core/src/brokers/analyze/file/analyze-file-broker.ts` — the wiring: `envDrivable` is set to
   `fn.entry.access.kind === 'module'`; `follow-calls`; and `result.unreachableExits` →
   `unreachable-exit` lints.
6. `packages/core/src/transformers/follow-calls/follow-calls-transformer.ts` — where reached inline
   functions are routed (THE file where IIFE and returned closures are currently conflated).
7. `packages/core/src/transformers/through-callback-cases/through-callback-cases-transformer.ts` — the
   analog the prior session built: it drives a `.map` callback THROUGH its entry by arranging the array
   element. The IIFE drive is the **module-load** analog of this.
8. The walk emitters: `handle-call-layer-adapter.ts` (emits an IIFE callee into `reachedFns`) and
   `handle-exit-layer-adapter.ts` (emits a returned function into `reachedFns`).
9. Related specimens (read them AND their `.test.ts`), under
   `smoke-repo/packages/syntax-repository/src/`:
   - `happy-path/if-else/pure-statement/`, `happy-path/switch/pure-statement/` — a MODULE scope driven
     by `process.env` (2 cases, env arrange). This is the mechanism a working IIFE must reuse.
   - `sad-path/undriven/welded-const/`, `sad-path/undriven/welded-arg/` — the "welded value ⇒ one
     outcome ⇒ undriven" specimens. **These are the design-tension anchors** (see below).
   - `sad-path/unreachable/sequential-guards/`, `sad-path/length/contradictory-bounds/` — the
     `unreachable-exit` lint you must produce for the welded IIFE's last return.
   - `happy-path/function/{declaration,expression,arrow,nested}/` — the function category the new
     working IIFE joins.
   - `sad-path/undriven/iife/`, `sad-path/undriven/returned-closure/`, `sad-path/undriven/hof-callback/`
     — the reached-inline-function specimens from the prior session.

---

## Background: current state (what the prior session already built)

Two features landed in the session before yours; understand both, because you're refining the second.

**(a) The `.map`-callback drive.** A branching callback passed to an array-iteration method is now
DRIVEN through the entry by steering the array element (`through-callback-cases-transformer.ts`). Walk
records the callback link + receiver/method on the call site (`read-call-args`, `handle-call`,
`call-site-contract`).

**(b) The `reachedFns` rung (the one you'll refine).** The walk now records a FLAT, file-level channel
`reachedFns: LineNumber[]` — the start lines of inline functions the code reaches WITHOUT a named call:
- a RETURNED function (`return (n) => …`) — emitted by `handle-exit-layer-adapter.ts`;
- an IMMEDIATELY-INVOKED function (`((n) => …)(x)`) — emitted by `handle-call-layer-adapter.ts`.

It is plumbed through `handler-result-layer-adapter`, `walk-facts-contract`, `walk-facts-layer-adapter`,
`walk-node-layer-adapter`, `walk-file-result-contract`, `ts-morph-walk-file-adapter`. `follow-calls`
reads it: any candidate whose start line is in `reachedFns` is admitted **undriven** with
`REACHED_FN_REASON`.

**The root problem you're fixing:** `reachedFns` LUMPS an IIFE (which runs NOW, at import) with a
returned closure (which runs LATER, in some external caller), and blanket-admits both as `undriven`
without analyzing that an IIFE is **module-load code**. A module-scope branch drives via env; the
identical branch wrapped in an IIFE does not, purely because the IIFE arrow's scope is not recognized as
running at load. That is the whole bug.

---

## Ground truth (reproduce this before you change anything)

Write a throwaway probe under `smoke-repo/.../src/_probe/` that calls
`analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) })` (imports resolve through the
`test:syntax` jest config — run with
`npx jest --config smoke-repo/packages/syntax-repository/jest.config.js <path>`), and delete it after.
The prior session observed:

| Input | Current result |
|---|---|
| welded IIFE `((n) => { if (n>5) 'big'; else 'small' })(7)` | whole arrow **undriven**; never notices the `if`-arm is runnable or the last return unreachable |
| env-ARG IIFE `((n) => {…})(Number(process.env.T))` | flatly **undriven** (arg not propagated into `n`) |
| env-BODY IIFE `(() => { const n = Number(process.env.T); if(n>5)… })()` | flatly **undriven** (arrow not env-drivable) |
| direct module-scope env branch (no IIFE) | **drives** — 2 cases, `T=6`→then, `T=5`→else |

Confirm these still hold; the code may have moved.

---

## The proposed fix (a lead to verify, not a spec)

Model: **an IIFE arrow runs at module load, so treat it as an extension of the module scope for driving
and reachability.** Concretely, three cases fall out — verify each is right and consistent:

- **env-sourced IIFE (body or arg) → DRIVES both arms.** Its branch turns on an env-derived value, and
  a case sets the env var before importing — exactly what `if-else/pure-statement` already does at the
  module scope. This is the "IIFE that actually works" for deliverable #1. Likely needs: (i) the walk to
  tell an IIFE-invoked arrow from a returned one (today both are just `reachedFns`), and (ii)
  `derive-cases` to run on that arrow with `envDrivable = true`. Decide whether an env-ARG form
  (`(…)(Number(process.env.T))`) also needs argument→param propagation, or whether you only support the
  env-BODY form in v1 — and if you scope it down, SAY SO in the specimen and registry comment (§5.13:
  no silent caps).

- **welded-literal IIFE → reachable arm gets a case, unreachable arm is an `unreachable-exit`.** Bind the
  arrow's param to the literal argument (`n = 7`) as a single-value domain, then let the existing domain
  machinery do the rest: `{7} ∩ satisfying(n>5) = {7}` (reachable) vs `{7} ∩ satisfying(n<=5) = {}`
  (empty ⇒ unreachable, via `is-domain-empty` → `unreachableExits` → `unreachable-exit` lint). NOTE: the
  current `unreachableExits` only fires for **steerable** branches; a welded param is currently gated OUT
  as unsteerable (→ undriven) in `derive-cases` §5.12. So this is genuinely NEW capability: *evaluate* a
  branch whose operand is bound to a known constant, distinct from *steering* it. Work out the reachable
  arm's case shape too — a welded IIFE has no settable input, so the case is a module-load observation
  (import, assert it reaches the `if`-arm's exit); confirm what `arrange` such a case carries.

- **returned closure → unchanged (stays `undriven`).** It genuinely runs in an external caller, not at
  load, so it is correctly not drivable here. Do NOT let the IIFE fix bleed into it.

---

## The design tension you MUST resolve (this is the "don't take it at face value" core)

The user's critique — "the `if` is runnable, the last return is the dark area" — is really a critique of
the whole **welded ⇒ undriven** model, not just the IIFE:

- `welded-const` (`const level = 7; if (level > 5) {…} else {…}`) is ALSO module-load code with a known
  value. By the same logic its then-arm is runnable and its else-arm unreachable — yet it is currently a
  `sad-path/undriven/welded-const` specimen (blanket undriven).
- `welded-arg` (`decide(3)` where `decide` branches on `value > 5`) has a known value too; its else-arm
  is reachable *through its caller* and its then-arm unreachable — currently blanket `undriven`.

So decide, explicitly and with the user or the design docs: **is "evaluate a constant-bound branch for
reachability" IIFE-specific, or is it the general fix that should also change `welded-const` /
`welded-arg`?** If you make only the IIFE evaluate its welded value while `welded-const` stays blanket
undriven, you have created exactly the kind of per-construct inconsistency §5.12 exists to forbid
("decide drivability ONCE, never per position"). Either apply it uniformly, or have a principled reason
the IIFE differs — and write that reason down. Do not paper over it.

---

## Deliverables & acceptance

- `happy-path/function/iife/iife.ts` (+ `.test.ts`): a driven IIFE. Registered in
  `packages/core/test/harnesses/specimen-registry.ts` with traits AUTHORED BY READING THE FILE (never
  from analyzer output — §6). Runs clean ⇒ happy-path.
- `sad-path/undriven/iife/iife.ts`: keep the file (the user said leave it), but its analysis now yields
  ONE driven/observed case for the `if`-arm + ONE `unreachable-exit` lint for the last `return`. Update
  its `.test.ts` assertions and its registry trait line (it is no longer a plain `undriven` — likely
  gains `lint:unreachable-exit` and a branch/access trait; work out the exact set by reading the real
  output). A lint keeps it in `sad-path`, which is where the user wants it.
- Whatever you decide for the `welded-const`/`welded-arg` tension is reflected consistently (either they
  change too, or a written rationale for why not).

## Verification & gotchas

- Run BOTH: `npm run test:syntax` (the catalogue — includes the declared-vs-observed cross-check and the
  catalogue-completeness check) AND `npm run ward` (lint/typecheck/unit/integration across all 5
  packages). `test:syntax` is NOT in ward's jest graph.
- **e2e is being optimized separately right now** (the user said so). Confirm with the user before
  relying on / running the full e2e (`ward --only e2e`, ~12 min); the non-e2e checks are the fast signal.
- **Hardcoded specimen paths exist.** `packages/core/src/brokers/run/unit/run-unit-broker.integration.test.ts`
  and `packages/app/src/flows/app/detail-tests-tab.e2e.ts` reference specimens by literal path. If you
  move/rename a specimen, grep-equivalent (native grep/find are blocked — use `ls`/Read or a `node`
  script) for the old path across `packages/` and fix every reference, or integration/e2e will ENOENT.
- Coverage IDs are cache-internal (a ruling); an anonymous arrow's scope segment is its full STRUCTURAL
  projection (a long `fn:ArrowFunction,…` string). Don't contort the design to prettify it; in tests,
  hold it in a `const` and build the expected ids from it (see the prior session's
  `array/map-conditional/map-conditional.test.ts` for the pattern).
- P4: every case asserts REACHING an exit, never a returned value. Values are INPUTS (env, literals),
  never outputs.
- Determinism + formatting-immunity (§5.1, §7): same source ⇒ byte-identical analysis; quote/spacing
  changes must not move any id.
