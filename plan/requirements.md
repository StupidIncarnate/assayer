# Assayer — Requirements (Working Draft)

> Status: capture phase. Recorded from planning session 2026-07-04. The README predates
> this and describes an older stub-generator vision — this document supersedes it.
> Open questions at the bottom are being fleshed out before epic/story breakdown.
>
> **Companion docs (read alongside this one):**
> - `plan/expectation-catalog.md` — concrete syntax→expectation classifications
>   (bucket A: auto-derivable / B: user-intent / C: repo-specific).
> - `plan/case-studies.md` — the full self-contained records of the real
>   incidents this plan keeps referencing by shorthand (codex session-message
>   parity §1, amalga eyelid §2, quest transition matrix + H-1 §3). New sessions:
>   read the case studies FIRST — they are the problems this tool exists to solve.

## ⛔ Blockers before epic carving (do not split epics past these)

1. **Q3 (v1-blocking):** non-lexical data-flow edges (event bus, WS, stores,
   context) must be DESIGNED before the analyzer epic is carved — the target
   repos' core flows cross these hops.
2. **Config test format (ACTIVE DISCUSSION below):** gates the format epic and
   D3-style scaffolding; the artifact inventory (below) constrains it but the
   schema itself is undrafted.
3. **Coverage-ID scheme (ACTIVE DISCUSSION below):** "coverage ID" is used as
   settled vocabulary throughout — it is NOT yet designed. Gates regeneration
   (D10), the lock (D12), baselines (R12), and C1's cross-file presumption.
4. **Q7 (below):** R12 lists many product surfaces + D14's desktop app with no
   v1 partition — scope must be ruled before the tooling epic.
5. **Q4 / db section:** the database obligation family is TO-FILL; a db-probe
   epic cannot be scoped yet (same status as Q3 for the analyzer, stated here
   explicitly).

## Glossary (terms used throughout; canonical definitions)

- **Tiers (R9 — provenance of a test case):** tier 1 = syntax-derived, tier 2 =
  model-derived, tier 3 = intent scenarios/observables. P3 uses the same
  numbers as graceful-degradation levels: semantics declared as data get tier-2
  generation; undeclared semantics fall back to tier-1 branch skeletons. Same
  axis, both senses.
- **Observable (D9/R11; "tier-3 observable" = "D9 observable" = same thing):** a
  declared requirement artifact — "state S + trigger T ⇒ effects E" — carrying a
  LAYER (computed-value, dom, request, rendered-geometry, visual, perf, copy…).
  The layer list is OPEN (plugins add layers); the core set ships with Assayer.
- **Harness (a.k.a. driver — ONE artifact, two historical names):** the per-file
  authored companion (D4 merged dungeonmaster's proxy+harness). It exposes the
  **surface**: **interactions** (do) + **observations** (read) per D8, carries
  correlation bindings (R11), and may declare custom tests (D12). "Driver
  surface" = the surface the harness exposes. Where older text says "op", read
  interaction/observation.
- **Rule engine (ONE engine, three output kinds):** R2 is the engine; a rule may
  emit **obligations** ("you owe test case X at site Y" — R8 shipped, R14
  user-declared), **lints** ("this implementation pattern is
  banned/must-change" — R13), or **refusals** ("this state of code is an error,
  no test can fix it" — R10). Rule packs, probes (R15), and seam adapters are
  all PLUGINS to this one engine — a rule pack is a plugin using only the
  detect + generation/lint phases; a probe adds tap/observe/display.
- **Seam-plus-adapters (the plugin pattern, defined once):** core declares an
  ABSTRACT vocabulary; per-tech ADAPTERS supply detection (analyzer side) and
  observation/instrumentation (runtime side). Instances: D7 routers, R11
  observation vocabularies, R14 form vocabularies, R15 effect probes.
- **Coverage ID:** the stable identifier of a testable item that cases reference
  via `covers`. THE SCHEME IS NOT YET DESIGNED (see Blockers #3) — every use in
  this doc is a placeholder for that design.
- **Waiver:** a committed declaration (with reason) that a specific generated
  obligation/case (referenced by coverage ID) is a false positive or
  intentionally unmet. Surfaces in the semantic diff. Schema TBD in format epic.
- **Statics:** dungeonmaster's folder-type for immutable declared constants —
  the "no magic numbers" home. Assayer requires declared values (scales, delays,
  budgets) to live in analyzable constant declarations; the dungeonmaster folder
  convention is NOT required (P3) — any type-graph-visible const declaration
  counts.
- **Ward:** dungeonmaster's quality-gate CLI (lint+typecheck+tests, one entry
  point). Referenced as prior art for D2's bundled CLI and R21's
  `detail <runId>` pattern.
- **Buckets A/B/C:** the expectation-catalog's classification — A: always tested
  based on code (auto-derivable; ships as base rules), B: user-expected (right
  code, wrong for the user — needs declared observables), C: repo-specific
  (needs custom declarations/plugins). Defined fully in the catalog preamble.
- **Verified pair / demanded pair / registry (R19):** verified = (input ⇒
  output state + effects) proven by a downstream layer's own suite; demanded =
  a pair an upstream consumer declares it relies on; registry = the reconciled
  set. Registry is a RUN-SCOPED DERIVED artifact (cache): pair definitions
  derive statically from configs; verification status is produced by
  dependency-ordered execution within the same run (downstream suites run
  before upstream glue). Nothing registry-related is committed.
- **Salient states (C3):** the minimal state set worth testing, computed by
  partitioning each field's domain by the conditionals that consume it;
  don't-care fields get randomized fill. Worked example: an endpoint returns
  `{status, name}`; one caller branches on `status === 'blocked'`, another
  renders `name` verbatim → salient set = {status: blocked, status:
  non-blocked-representative} × {name: random} — 2 states, not |statuses|×|strings|.
- **Plumbing principle (catalog, Passthroughs):** static proof replaces tests
  for pure value-forwarding; tests attach only at transformation and consumption
  sites.
- **Execution contexts (clarifies R6's modes):** `unit` = Jest, boundaries
  mocked; `integration` = Jest with the REAL external engine for DSL-expressed
  logic (SQL, ESLint selectors, regex — "the DSL rule": logic written in an
  external system's language must be validated by that system, not by mocks);
  `e2e` = Playwright full stack (frontend) or endpoint/entry-driven full chain
  (backend/packages). R6 mode classification assigns cases across these.
- **"Broccoli-style chaining":** inspiration note only (broccoli.js build
  pipelines) — means: scenario steps thread STATE through a chain, with
  CATEGORIZED expectations at each step. No broccoli dependency.
- **Entry kinds (D7/R19):** #1 web routes (URL → component), #2 server routes
  (endpoint → responder), #3 package function entries (exported fn with
  effects).

## Artifact inventory (who writes it, does it commit — resolves D10/D12 interplay)

| Artifact | Authored by | Committed | Home |
|---|---|---|---|
| Harness (surface, bindings, custom tests) | human/LLM | yes | next to source file |
| Observables / scenarios (tier 3) | human/LLM (scaffolded by Assayer) | yes | TBD format epic (colocated or `.assayer/declarations/`) |
| **Expectation fills** (tier-1 expected values, keyed by coverage ID) | LLM/human | **yes** | committed companion artifact — location TBD format epic |
| Waivers | LLM/human with reason | yes | with declarations |
| Config, R14 policies, D5 mock policy | human/LLM | yes | `.assayer/config` |
| Baseline approval records | human approval act | yes | `.assayer/baseline/` (sharded per artifact) |
| Repo-local plugins | human/LLM | yes | `.assayer/plugins/` |
| **Assembled test files** (skeletons ⊕ fills) | machine | **no** | `.assayer/cache/` |
| Registry (pairs + verification) | machine, run-scoped | no | `.assayer/cache/` |
| Graphs (C2), projections, run artifacts | machine | no | `.assayer/cache/` |

**The D10/D12 resolution stated plainly:** D10's "author-owned zones" are the
committed EXPECTATION-FILL artifacts (and tier-3 declarations); D12's locked
"generated test files" are the ASSEMBLED cache artifacts (structure from
implementation ⊕ fills from the committed artifacts). The LLM fills expected
values in the committed companion, never in the cache; regeneration re-assembles;
orphaned fills (coverage ID gone) error per D10. D3 is hereby ABSORBED: "should
Assayer scaffold" is answered — skeletons and fill-holes are always generated
(D12); what remained of D3 was only where fills live, answered above.

## Vision

Assayer is an npm package installed into TypeScript repos (like ESLint) that:

1. Statically identifies every piece of syntax that **should** be tested, according to
   configurable rules.
2. Compares that against what the file's tests **actually** cover, and fails like a
   build error when something testable is uncovered — catching new code written after
   the tests were.
3. Defines a **config-structure test format** (not traditional `it()` blocks) so a
   single test file drives both Jest (unit) and Playwright (e2e) runners.

## Design Principles

### P1 — Built for LLM-maintained repos
The primary consumer is a repo written and maintained by LLMs, not humans. Tedium
that would be unacceptable for humans (exhaustive per-branch test configs, verbose
declarations, strict coverage) is acceptable — **as long as every failure is a
precise, actionable build error** telling the agent exactly what is wrong, where,
and what would satisfy the check. Ambiguous or vague errors are bugs in Assayer.

### P2 — Tests as data, inputs/outputs at boundaries
A test is: controlled inputs in → stimulus → asserted outputs + side effects out,
where inputs/outputs are defined as *all boundary traffic over time* (args/props,
mocked I/O responses, globals like time/random in; return values, DOM state,
emitted events/callbacks, outbound requests out). Because state means output
depends on input HISTORY and async means outputs are EVENTUAL, the config's unit
is a SCRIPT (arrange → act, assert, act, assert), not a single tuple.

### P3 — Standalone; detect by type graph, never by convention
Assayer is a separate package — dungeonmaster (or any architecture framework) must
NOT be a prerequisite. Rules:
- Detection keys off **TypeScript type-graph facts** (unions, `as const` objects,
  `Record<Union, Meta>` exhaustive maps, Zod schemas, imports crossing into
  node_modules, nondeterministic globals) — never off folder locations, file
  naming, or architectural conventions.
- **Graceful degradation by tier:** semantics declared as data → tier-2 exhaustive
  generation; semantics baked into imperative literals → tier-1 branch skeletons
  (coverage still enforced, auto-expansion lost). Assayer errors may NUDGE toward
  modeling ("declaring Record<Status, Meta> would derive these N tests") but never
  require it.
- The config schema replaces the TEST-side lint-rule category wholesale: forbidden
  matchers, hooks, conditionals-in-tests are unrepresentable in a closed
  vocabulary, not linted. IMPLEMENTATION-side rule enforcement remains in scope
  where it guarantees testability preconditions: R10 (semantic redundancy) and
  R13 (companion lint layer), both in Assayer's own rule engine, severity-
  configurable (off/warn/error).
- Dungeonmaster-shaped repos are the best-case input, not the required input.

### P4 — Expectations never derive from the code under test
Generated/scaffolded expected values may derive from **inputs** (tier 1: the value
funneled in), **declared models** (tier 2: the property says what should happen), or
**declared observables** (tier 3: spec-time requirement). NEVER from executing the
implementation and recording its output — that is a snapshot test, structurally
incapable of disagreeing with the code (the amalga-victorious failure mode: LLM
tests derived from the LLM's own implementation always passed while the user
requirement stayed unmet).

## Requirements

### R1 — Distribution: npm package, runner-owning
- Installable as a dev dependency in consuming repos. Not a standalone app.
- **Assayer owns Jest and Playwright** as its own dependencies — version-locked by
  Assayer, not the consuming repo.
- All test execution goes through Assayer's CLI (`unit`, `e2e`, `check`, ...).
  Consumers never touch Jest/Playwright directly; the underlying runner is an
  implementation detail so the tech can be swapped later.
- **Wrapping discipline (EXCLUSIVE, user-mandated):** raw Jest/Playwright
  controls are NEVER exposed — not in configs, not in harness authoring, not in
  custom tests. The wrapped surface is a closed allowlist, and additions to it
  follow an escalation ladder:
  1. Express it in the existing closed vocabulary (default answer).
  2. If genuinely needed, a GLOBAL config control — repo-level, one place,
     reviewable (example: timeouts. Per-test/per-harness timeout knobs are
     terrible practice and don't exist; if timeout tuning is ever needed it is
     one global detail in config).
  3. Only if all else fails: a new wrapped capability — added to Assayer
     itself (or a plugin vocabulary), never as a raw-runner passthrough.
  Rationale: every raw control that leaks becomes (a) an LLM escape hatch
  around the schema's guarantees and (b) a coupling point that blocks swapping
  the underlying runner.

### R2 — Rule-based testable-syntax detection
- Reads source code and identifies all syntax that needs testing.
- Driven by a repo-level config of "I care about this, not this" — ESLint-model:
  a base rule set ships with Assayer, and the architecture allows new rules to be
  added as separate packages later.
- **Now:** base rule set + the groundwork/plugin seams for configurability.
- **Later:** full third-party rule/package extensibility (not needed for v1, but the
  architecture must not preclude it).

### R3 — Coverage enforcement as a build-style error
- For each source file, look at its test file and determine what is covered versus
  what R2 says should be covered.
- If something that should be covered isn't, **error like a build error**.
- Purpose: catch new/changed code after tests were originally written. Enforcement is
  continuous, not one-time generation.

### R4 — TypeScript only
No plans for plain JS or other languages.

### R5 — Config-structure test format
- Test cases are declarative config structures, not traditional Jest `it()` commands.
- One test file serves as the source of truth for **both** execution systems:
  - "Unit" tests executed via Jest
  - E2E tests executed via Playwright
- The format must support per-system instructions within a single test case, since
  the same logical test may need different mechanics per runner.

### R6 — Per-test execution-mode classification
- Each test case is classified as: unit-only, e2e-only, or both.
- Assayer should intelligently determine (or the config should express) which modes
  apply. Examples from discussion:
  - Values rendering correctly in a component → unit **and** e2e
  - Button/interaction tests → unit **and** e2e
  - Display variations driven by a parent-provided value → potentially unit-only
- The granular classification rules will be worked through case-by-case later; the
  test-case config schema must support per-mode instructions **now**.
- **Classification heuristics (accumulating from catalog walk):**
  1. Rendered value: ONE e2e for the happy path (state funnels end-to-end, value
     visible in browser); all branch/variant/negative cases unit-only.
  2. (TENTATIVE) State-driven element presence/absence: e2e for sure; unit
     possibly overkill — pending more examples. Distinction from #1: value
     VARIANTS are content detail (unit); PRESENCE toggled by app state is
     user-perceivable flow (e2e).
  3. State-mutation → render changes, and timer/effect-driven behavior
     (navigation, ejects, inactivity branches): user flows for sure (e2e), with
     unit fake-timer/interaction cases as support.
  4. (EMERGING DIRECTION, per user) Single-owner allocation: side-effect
     categories that MUST be e2e-verified (navigation, timer branches, ejects)
     probably need NO duplicate unit test. Tilts R6 away from "both by default"
     toward each case having ONE owning mode, support cases only where they add
     distinct value. Firm up as the catalog walk accumulates categories.

### R7 — Harness / page-driver enforcement per file
- Enforce a harness / page-driver-style setup on a file-by-file basis.
- Using the import graph (parent → child), harnesses should compose — "string them
  along" — so you can target testing one thing versus another.

### R8 — Categorical test obligations
Certain syntax patterns create mandatory test obligations regardless of whether an
LLM (or human) thinks of them: string input reaching a query/HTML/shell/path sink →
injection tests; unbounded iteration / large-list rendering → perf tests. These are
R2 rules whose output is "you owe a test of kind K at point P" — same detection
pipeline, same build-error enforcement. LLMs must not need to REMEMBER security or
perf cases; Assayer demands them.

### R9 — Test provenance: three tiers
1. **Syntax-derived** — analyzer generates the case skeletons deterministically
   (value renders, conditional renders, branches). LLM fills expected values only,
   inside the constrained assertion vocabulary.
2. **Model-derived** — when high-level behavior is declared as data (state
   machines / transition maps, allowlists, route configs, Zod contracts), Assayer
   derives obligations from the model: every edge tested, every non-edge rejected,
   every gate's missing-content case covered.
3. **Intent scenarios** — workflow tests encoding requirements and regressions
   ("state S + trigger T ⇒ effects E"). Not derivable. Guardrailed structurally
   (see `case-studies.md` §1/§3 for the incidents behind this): scenario configs
   with schema-enforced completeness rules, linked to declared requirement
   artifacts (observables), with expectation-weakening surfaced as requirement
   diffs.

### R10 — Canonical semantic models (single source of truth, enforced)
Requirements like "only terminal statuses can be deleted" are only testable if their
terms are defined exactly once as data (e.g. `Record<QuestStatus, {isTerminal}>` in
statics). Assayer enforces this, not just consumes it:
- **Duplicate-enumeration rule:** a literal subset of a declared union's members
  appearing in implementation code is a build error — derive from the model instead.
  Two encodings of the same concept = ontology failure = no truth anchor for tests.
- Exhaustive metadata (`Record<Union, Meta>`) makes adding a member a compile error
  until its semantics are declared — one decision, one file, at addition time.
- Tier-2 test matrices derive from the model (every member, expected value computed
  from the property) and verify the WIRING (code consults the model through real
  boundaries), not the flag values — the flag values are the spec, reviewable in one
  line at spec time.
- Principle: generation quality = model quality, so Assayer enforces models, and its
  build errors teach the consuming LLM to "declare as data, derive everything."

### R11 — Observables declare their layer; assertions must reach it
Requirements are perceived at a specific pipeline layer (data → mesh → pixels;
data → DOM → browser). Every signal-transforming/discretizing boundary (SDF →
marching-cubes mesh, mesh → raster, state → DOM) can destroy upstream correctness
(amalga: correct SDF, socket smaller than the marching cell, nothing rendered).
Therefore:
- Tier-3 observables declare a **layer/kind** (e.g. `computed-value`, `dom`,
  `rendered-geometry`, `visual`).
- An observable is only SATISFIED by an assertion at its layer or downstream of
  it. Upstream (math-layer) tests may support it but never discharge it. Build
  error: "observable X (layer: rendered-geometry) has no verification at or past
  the mesh layer."
- **Plugins provide observation vocabularies per domain** (three.js plugin:
  vertex-displacement deltas, occlusion/silhouette metrics, raycast hits) so
  artifact-layer assertions "actually mean something." This is the primary
  justification for the R2 plugin architecture beyond rule packs.
- **Each layer vocabulary defines its COMPARATORS:** exact-match for dom/
  request/computed-value; DECLARED-TOLERANCE comparators for geometry/perf
  (tolerances are data in the config, not ad-hoc numbers in assertions).
- **Scene/canvas vocabularies must ship SETTLEMENT observations** ("scene
  quiescent", "N frames rendered") — in canvas worlds there is no element to
  await, so without awaitable settlement the never-sleep rule is unsatisfiable
  and `waitForTimeout` creeps back (observed throughout amalga's specs,
  case-studies §4).
- **Declared correlations → perturbation obligations (tier 2):** repo declares
  `control → affected-region` mappings (rig handle y ↔ data point x); Assayer
  generates perturbation tests (perturb control, assert correlated region
  changed). Framework-agnostic pattern; plugins supply the observations.

### R12 — The review surface: humans review requirement-space, never test files
Assayer's fourth surface (after enforcement, generation, execution): artifacts FOR
THE HUMAN that make code/test reading unnecessary. Segmentation rule: **humans
review declarations and their diffs; machines review conformance.**
- **Model projections:** deterministic renderings of declared models (state
  diagram from transition map, flag tables from Record<Union, Meta>) — derived
  from the declaration, so they're truth, not LLM claims. Human approves a
  projection; semantic changes to the model error until re-approved. (Replaces
  the "redraw the map across 5 sessions" loop with: review one diagram, once.)
- **Observable ledger:** every requirement with status — verified (layer, cases),
  unverified, orphaned.
- **Semantic diff report:** per change, in requirement-space only — model edges
  added/removed, observables added/changed/WEAKENED (headline, never buried),
  coverage delta, obligations delta, **new/removed boundaries per flow** ("flow
  save-quest now writes to redis" — catches wrong-tech choices no test can),
  and waivers added. Empty semantic diff + green gate = nothing to review.
- **State-render decks (plugin capability):** render declared states for human
  perceptual comparison (three.js: model + lid positions + camera presets).
  Human approval converts a render into a baseline — P4-legal because the human
  is the oracle; the tool captures the verdict. Subsequent regressions diff
  mechanically against approved baselines.
- **Semantic-diff mechanics (baseline lockfile):** the diff is NOT a git text
  diff. Assayer derives the requirement-space model from the working tree and
  graph-diffs it against the **last human-approved baseline**, stored as a
  committed lockfile artifact (deterministic serialization; git carries it,
  the UI renders it). Anchoring to approval beats git-ref diffing: N commits
  that swap tech and swap it back still reconcile against what the human last
  signed off. Approving updates the lockfile — a visible, committed act.
  - **UI: only-changed queue** — default view lists ONLY artifacts whose
    subgraph changed (flows, models, boundaries); unchanged diagrams never
    appear. Each renders as a CHANGE DIFF: added nodes/edges marked new (a
    redis boundary appears green with a callout), removals marked, changed
    attributes highlighted, before/after toggle to pinpoint the exact delta.
  - **Gate:** unapproved baseline delta = build error ("unapproved semantic
    change: flow save-quest: boundary added redis") — green is impossible
    without the change passing through the human's queue.
  - **Concurrency & merge semantics (sharded, content-addressed records):** the
    baseline is one small file PER ARTIFACT (`.assayer/baseline/flows/<id>`,
    `/models/<id>`), each holding the approved subgraph's content hash +
    author/when. Consequences:
    - Unrelated PRs touch disjoint records → conflict-free merges.
    - Same-artifact approvals on two branches → a git conflict that is CORRECT
      (two humans approved different versions of one promise);
      `assayer approve --resolve` re-derives the merged state for fresh
      approval.
    - Merging main in brings main's records with main's code → content hashes
      match → approved changes NEVER reappear in the branch queue.
    - Two individually-approved changes that INTERACT in the same flow derive
      a composite matching neither record → surfaces as unapproved showing the
      interaction delta: semantic merge conflicts git can't see, the key
      review under multi-agent parallel branches.
    - Preconditions (load-bearing): deterministic derivation/serialization
      (same code ⇒ same hash) and stable artifact IDs (entry points /
      declaration symbols, same philosophy as coverage IDs).
- **Flow projections:** derived diagrams of scenario chains — "test ensures X then
  Y happens" as an event/causality graph, generated from scenario configs (and
  handler effect enumeration), so the human spot-checks the claimed causality
  without reading tests or playing through the UI. Sibling of model projections:
  models → structure diagrams; scenarios → sequence diagrams. Must include
  AUTONOMOUS edges (timer/effect-driven transitions — inactivity redirects,
  auto-ejects) as first-class branches alongside interaction edges, or the
  causality picture the human reviews is incomplete.
- **State explorer (interactive; React counterpart of render decks):** a generated
  harness UI wrapping the frontend where the human picks any DECLARED state and
  sanity-checks the view. Key synergy: the arrange declarations from test configs
  ARE the explorer's state list — no separate authoring. Human eyeballs
  representative states; the coverage ledger vouches for the rest; "state X is
  wrong" becomes precise LLM feedback. Component kinds carry STANDARD state sets
  the explorer always includes (lists: empty / representative / max-many /
  per-filter-sort variations — max-many because layout breaks are browser
  nonsense no logic test catches). **Granular flow-state stepping (user: the
  manual-testing pain was state SETUP):** the explorer can build states at any
  POINT ALONG A FLOW — pick a step, get the state as it exists there, watch
  records transition x → y as the flow progresses — so mid-flow visual checks
  no longer require hand-rigging preconditions. Derives from C3 states + the
  scenario chain positions.
- **Endpoint explorer (backend counterpart of the state explorer):** a generated
  console that lists endpoints with their flow projections and lets the human
  FIRE requests — including extreme presets at the declared max scale — with an
  **expected-vs-actual effects panel**: "this endpoint is expected to write to
  db → here are the actual rows from the real store after your submit"; "this
  third party is mocked → here are the exact outputs/calls the mock captured."
  Includes per-boundary call counts per request (accidental vendor-overload
  check). Derived from the same effect enumeration that generates test cases —
  the explorer and the tests can't drift apart.
- **The explorer is FULL-STACK (user-specified):** interacting in the browser
  explorer executes the real stack exactly as e2e mode does (same harness, same
  D5 mock policy — db real, externals mocked), and the browser shows a LIVE
  EFFECT-CHAIN LOG — Cypress-command-log-style, but crossing the wire with
  deeper hooks: interaction → request → server chain → db calls (with results)
  → third-party/boundary calls (mock captures) → response → UI update. The
  static flow projection is the map; this live trace is the territory — the
  human spot-checks the diagram, then watches the real chain confirm it.
- **Shared subsystem — effect-chain instrumentation:** the tracing hooks that
  feed the live log are the SAME instrumentation the runners use for effect
  observations in tests. One instrumentation layer, two consumers (assertions
  and display); it cannot drift from what tests verify.
- **Checklist ratchet:** every defect class the human catches manually becomes an
  R2 rule / R8 obligation / R13 lint rule; custom rule authoring must be easy
  because it is the human's personal offload path. The manual checklist only
  shrinks.
- Config-format note: tier-3 scenarios chain state through steps with
  CATEGORIZED observation vocabularies (Broccoli-style chaining; categories =
  R11 layers).

### R13 — Companion implementation-side lint layer
Assayer ships a bundled lint ruleset (its own rules + curated third-party rules)
enforcing testability preconditions on IMPLEMENTATION code — constraints that make
the generated tests meaningful and the failure modes representable:
- Leaked-render family: nullable values in JSX require explicit `??` fallback /
  else render (blank, `"null"`/`"undefined"`, and `{count && ...}` → `0` leaks).
- Date/format family: no raw Date-to-string in render paths; formatting must be
  explicit (TS cannot type the format).
- Dead contract surface: a declared prop (esp. optional) never consumed by the
  component body → unused/untested-prop error. TS's unused checks miss this
  (the prop is "used" by the type and by passing parents); Assayer's consumption
  analysis catches it, and no tests are generated for unconsumed props.
- The set grows via the R12 checklist ratchet, same as test obligations.
Rationale: some testability guarantees are implementation constraints the config
schema cannot reach. Bundled with the package so consuming repos get them by
installing Assayer, not by assembling lint configs themselves.

### R14 — User-declared interaction policies
The user declares, once, per scope, the lifecycle expectations for an interaction
pattern; Assayer generates the obligations for EVERY detected instance of that
pattern. First instance: **form policies** — e.g. "every submit: blocking UI while
pending; loader hidden on settle; error surfaced on failure; no double-submit."
- Motivation (user, verbatim intent): LLMs are not good about baking project
  standards in; the human wants to declare them as data instead of re-instructing.
- **Scoped, not global:** repo-level default + per-section/app overrides, since
  different sections legitimately have different form expectations.
- Relationship to R8: same obligation engine — R8 entries are Assayer-SHIPPED
  categorical obligations (injection, perf); R14 entries are USER-DECLARED ones.
  Both produce build errors naming the uncovered obligation at the detected site.
- Expected to generalize beyond forms (navigation policies, notification/toast
  policies, error-boundary policies) — schema should not be form-specific.
- **Policies bind to abstract vocabularies, adapters supply the concretes:**
  policies reference abstract state predicates ("field invalid", "submitting",
  "settled"); a per-library ADAPTER (interface/abstract-class contract) supplies
  both detection (analyzer: what a form/field/schema looks like in this lib) and
  observation (runtime: how each predicate manifests). Shipped adapters for
  common form libs; repo-custom implementable. Third instance of the
  seam-plus-adapters pattern (D7 routers, R11 observation vocabularies) — the
  plugin API should expose ONE consistent mechanism for all three.

### R15 — Effect-probe plugin contract
One contract governs how ANY effect kind — shipped (db, Redis, logging, queues,
transactions, outbound HTTP) or repo-special — participates in the whole system.
An **EffectProbe** supplies up to four members (display optional, defaulted):
- **detect** (analyzer): a SYNTAX SUBSCRIPTION — the plugin declares patterns of
  interest ("imports of `three`", "`new THREE.Mesh`", "scene mutations") and the
  CORE analyzer, which owns all traversal/chain-following/ID assignment, calls
  the plugin back at each match site. The plugin never parses; it answers
  phase-keyed callbacks with domain semantics:
  - *test-generation phase:* what cases/obligations to emit for this site
  - *instrumentation phase:* what to tap
  - *display phase:* what to log to the user manual UX and how
  - *(lint/rule phase, projection phase — same shape)*
- **tap** (runtime): instrumentation emitting structured trace events (kind,
  label, payload, timing, correlation id) into the effect-chain pipeline — this
  is how events appear "as things happen."
- **observe** (assertion vocabulary): the observation kinds test configs may
  assert on this effect (e.g. `cache.set {key}`, call-count budgets) — closed
  vocabulary, R11-layered.
- **display** (explorer): how events render in the live chain log — label
  template, payload summarization, severity. Optional: default rendering from
  the trace event; repos override only for special presentation.
Registered via Assayer config (plugin list), scoped like everything else. A
repo-special system implements the same contract as first-party probes — no
second-class integration path. Probe packages also SHIP their domain's
obligation checklist (the expectation-catalog section for that tech — e.g. the
db package carries the schema-derived case families), so installing a probe
installs its bucket-A knowledge, not just its instrumentation.

**LLM-authorability constraint (user scenario: "no three.js plugin exists →
tell the LLM to read `assayer docs` and write me one"):** the contract must be
small, declarative, and phase-callback-shaped so an LLM can author a working
plugin from R18 docs alone. Corollaries: R18 includes a complete worked plugin
example; Assayer validates plugins (schema-check the shape, dry-run against a
fixture) with P1-grade errors so a wrong plugin is a build error the LLM
iterates on, same as any other.

**Seam consolidation (now definitive):** this is the 4th instance of
seam-plus-adapters (D7 routers, R11 observation vocabularies, R14 form
vocabularies, R15 effect probes). The plugin API IS this one pattern —
detect/tap/observe/display against an abstract vocabulary — instantiated per
domain. Epic carving should treat it as ONE subsystem.

### R16 — Assayer's own tests are conventional (KEY REQUIREMENT, per user)
Assayer PRODUCES a new type of test content for consumers, but the tests that
verify Assayer's own functionality are **pure Jest/Playwright**, structurally
constrained and enforced by dungeonmaster standards (proxies, harnesses, strict
matchers, ward). No bootstrapping: Assayer does not verify itself with its own
config format. The natural shape for its integration/e2e coverage: run the
Assayer CLI/analyzer against **fixture repos** and assert on outputs (generated
skeletons, build errors, coverage reports) — still plain Jest/Playwright per
dungeonmaster. Supersedes any earlier "Assayer assays itself" notion; dogfooding
against real consumer repos is a validation activity, not the test suite.

### R17 — Package architecture: lean core + per-tech plugin packages
Tech-specific integrations (R15 probes: postgres vs mongo vs prisma; R14 form-lib
adapters; D7 router adapters; R11 domain vocabularies like three.js) ship as
SEPARATE published packages (`@assayer/probe-postgres`, `@assayer/form-rhf`,
`@assayer/threejs`, ...) — pick and choose; the core stays lean and never
depends on any consumer tech. Core owns: analyzer, config schema, runners
(Jest/Playwright per R1), rule engine, review surfaces, and the R15 plugin
contract the packages implement.
- **`assayer init` (D2):** reads package.json(s), detects the repo's tech, and
  auto-installs + wires the matching plugin packages into Assayer config. Manual
  plugin assembly is the escape hatch, not the onboarding path.
- Version compatibility between core and plugin packages is core's problem
  (peer-range enforcement with a P1-grade error when mismatched), not the
  user's.

### R18 — LLM-facing instruction surface (shipped, versioned, CLI-exposed)
Assayer ships its own LLM-consumable documentation, exposed via the CLI (e.g.
`assayer docs <topic>` / `assayer explain <topic>`), so the human can point an
LLM at it and have it build repo-specific pieces case by case:
- **Topics:** one-off config changes; declaring R14 policies and D9 observables;
  authoring R15 probes / R2 rules / seam adapters; high-level concepts (tiers,
  plumbing principle, coverage IDs, mock policy).
- **Written for LLM consumption:** dense, exact, example-driven, with the
  relevant contracts/schemas inline — the same register as dungeonmaster's
  get-architecture/get-testing-patterns MCP tools.
- **Versioned with the package:** instructions always match the installed
  Assayer version — no drift between what the docs say and what the schema
  accepts. (Candidate later: expose the same topics over MCP; CLI is the v1
  requirement.)
- Symmetry with P1: build errors are the LLM's corrective instructions; this
  surface is its constructive ones. Both are product surfaces, not afterthought
  docs.

### R19 — Layered verification & the verified-contract registry
Entry points exist at three kinds of seam (web routes, server routes, package
function entries — D7). Each layer's OWN e2e suite verifies its entries as
(input ⇒ output state + effects) pairs. Those verified pairs live in a
**contract registry**, and upstream layers' glue tests consume them as stubs:
- **Glue test =** assert the correct call is made (url/args/payload) + assert
  correct handling of a REGISTRY-VERIFIED downstream state. P4-safe by
  construction: the stub state was proven by the downstream suite, never
  hand-invented.
- **Coherence enforced:** a stub may only be a pair the downstream suite
  actually verified. When downstream behavior changes, its verified pairs
  change, and every upstream consumer of a stale pair becomes a build error
  (semantic diff names the seam). Mock-drift is eliminated deterministically —
  the classic contract-testing problem, solved by both sides deriving from one
  registry.
- **Bidirectional (user: cross/inverse contracts):** upstream also PUBLISHES
  its demands into the registry — "when I send this, I expect these things" —
  as demanded pairs. Assayer enforces the inverse direction: every
  upstream-demanded pair must be VERIFIED by a downstream test state, or build
  error ("UI at quest-panel demands {status: blocked, workItems: non-empty};
  server suite verifies no such pair"). Consumer-driven contracts, both
  directions deterministic: downstream can't drift from what it proved,
  upstream can't demand what nothing proves.
- **Full-flow scenarios are the exception, declared:** reserved for
  downstream-EMERGENT behavior a pair can't represent (WS pushes contingent on
  async completion, timing, confirmations-after-flow). See catalog examples.
- **"Already covered, don't rerun" becomes checkable:** the registry accounts
  for what each layer proved, so cross-layer coverage is set arithmetic, not
  judgment.

### R20 — `assayer init` spec (accumulating tracked list)
Everything install/onboarding does, consolidated (grows as decisions land):
1. **Home dir:** create `.assayer/` (committed: config, baseline/, plugins/,
   declarations) + `.assayer/cache/` with the .gitignore entry (D13 layout).
2. **Config file:** `.assayer/config` — scopes, mock policy defaults, R14
   policies, plugin registrations.
3. **Tech detection:** scan package.json(s), install + wire matching plugin
   packages (R17) — probes, form adapters, router adapters.
4. **LLM session prehook (user, this round):** install a settings hook
   (dungeonmaster-style SessionStart injection) that tells any LLM working in
   the repo, at session start: how Assayer governs tests here, where to get
   authoring information (`assayer docs <topic>` — R18), and the cardinal
   rules (generated files are locked, declare don't hand-edit, errors tell you
   what to fix). The hook content ships with the package and versions with it,
   same guarantee as R18.
5. **Optional git warmers:** husky post-merge/post-checkout cache warm +
   surface the unapproved queue (D13) — offered, not required.
6. **Baseline init:** derive the initial model, present it as the first
   approval queue (nothing is pre-approved silently).

### R21 — Flow-anchored execution & step-pinpointed diagnostics
Scenario tests EXECUTE as the flow graph (user's unification: the runner walks
the same chain the flow projection renders — one artifact, projected static,
executed live, diffed on failure):
- **Expected-vs-observed chain:** every run (pass or fail) captures the
  observed effect chain via the shared instrumentation. A failure is a CHAIN
  DIFF: steps that happened (green), the expected step that didn't (red,
  zoomed), and what was observed INSTEAD at that position.
- **No more non-obvious timeout errors:** never "waiting for request timed out"
  — instead: "flow begin-quest, step 3/6: after interaction `click Begin`,
  expected `POST /quests/:id/start` — not observed within budget. Observed at
  this position: [PATCH /quests/:id]. Prior steps completed: [...]" — P1-grade,
  names the step, the expectation, and the actual.
- **Per-effect artifact capture, pullable:** each effect kind records its rich
  data on success AND failure (http: headers/request/response; db: query+rows;
  redis: key+value; per R15 probes' tap). `assayer detail <runId>` lets the
  LLM (or human, in the desktop app's zoom view) dig into any step's
  artifacts to diagnose based on the flow.
- Desktop rendering: the failed run IS the flow diagram with the failure step
  highlighted — click a step, see its artifacts.

## Non-goals / Deferred

- **v2 — Record-inspection UX:** a record-centric verification surface ("did my
  records do what I needed them to, across operations") beyond the endpoint
  explorer's per-request expected-vs-actual effects panel. User wants to
  manually spot-check records even knowing tests exist; UX shape unclear —
  explicitly deferred to v2 by user.
- Third-party rule packages (groundwork only for v1) — R2
- Granular unit-vs-e2e classification ruleset (schema support only for v1) — R6
- Non-TypeScript languages — R4

## Decisions

- **D1 — Execution model: interpreter (Option A).** Runners consume the config
  directly; no compiled/generated test files. Assayer ships the Jest integration and
  Playwright fixtures that interpret test configs at run time. (Rejected Option B —
  compile configs into emitted `.test.ts` files Jest/Playwright run natively:
  easier per-test debugging, but reintroduces generated-file management/drift and
  a second source of truth. Note: D12/D14 later put ASSEMBLED configs in cache —
  those are still interpreter INPUT, not emitted runner code.)
- **D2 — CLI surface:** subcommands `check`, `unit`, `e2e` (bundle-capable — one
  invocation can run several), all scopeable by file paths / globs for subsets.
  Plus `init` (see R17): scans the repo's package.json(s), detects the tech in
  play (pg/mongo/prisma, form libs, routers), and installs + configures the
  matching Assayer plugin packages — nobody assembles the plugin set by hand.
- **D3 — Scaffolding: ABSORBED by D12 + artifact inventory.** (Historical entry;
  originally "tabled, leaning yes.") Resolution: skeletons and fill-holes are
  always generated (D12); tier-2 fills derive from models; tier-1/3 fills are
  authored in the committed expectation-fill/declaration artifacts. Nothing left
  to decide except the fill-artifact location (format epic).
- **D4 — Unified per-file driver.** The dungeonmaster proxy (unit) and harness (e2e)
  concepts merge into ONE driver artifact per source file, exposing a shared semantic
  op surface. Drivers may additionally contain unit-only and e2e-only ops where
  needed. A dual-mode test case may only reference surface members available in
  both impls (type-checked claim, not runtime hope — mechanism: configs are `.ts`
  files whose interaction/observation names are typed off the harness's exported
  surface type; a dual-mode case's names must satisfy the INTERSECTION type of
  both impls, so referencing a unit-only observation from a dual-mode case is a
  compile error).
- **D5 — Explicit per-boundary mock policy.** Boundaries (I/O deps, globals,
  external systems) are declared explicitly — a config array/structure — with
  per-mode execution policy. Example: unit mocks everything at I/O boundaries; e2e
  keeps the db driver REAL but still mocks external systems (LLM APIs, third-party
  services). The policy is data, not convention.
- **D6 — Route-config parsing for e2e reachability.** Assayer parses the repo's
  React route config to tie browser state (URLs) to component entry points, then
  chains drivers down the import graph from route entry through all potentially
  rendered components. This is how an e2e test knows where to navigate and which
  driver chain reaches the component under test.
- **D7 — Route parsing is a pluggable seam covering BOTH sides of the wire**
  (per-tech plugin packages per R17):
  - **Client routers** (react-router first) → URL ↔ component entry points →
    D6 reachability chains for frontend e2e.
  - **Server route frameworks** (Express; Hono — the codex stack) → endpoint
    enumeration → route → responder/handler chain: powers the backend-e2e
    obligations ("every endpoint has coverage"), the endpoint explorer's list,
    and entry-point mapping for the flow projections.
  v1 set: react-router, express, hono. Manifest escape hatch for
  non-statically-analyzable routes: still tabled.
- **D8 — Terminology:** drivers expose **interactions** (things a test does —
  click, type, submit) and **observations** (things a test reads — text, presence,
  emitted calls). Together: the driver's **surface**. Replaces the earlier "op"
  shorthand.
- **D9 — Assayer owns the observable/requirement format.** Forced by P3: since no
  external framework can be assumed, the tier-3 requirement artifact (observables:
  "state S + trigger T ⇒ effects E") is a first-class Assayer format. External
  systems (e.g. dungeonmaster quests) map INTO it via the pluggable seam.
- **D11 — Timer compression in test runtimes.** Because delays/timeouts must live
  in statics (no magic numbers), the Assayer runners auto-inject environment
  overrides for declared time values — a 60s inactivity timeout runs as
  milliseconds under test. Tests never wait wall-clock for declared delays; the
  runner provides expected-timeout handholding. Applies to e2e (env injection)
  and unit (fake timers) alike; another payoff of R10's declare-as-data pressure.
- **D12 — Tests are locked and generated; harness + observables are the authored
  surface (RESOLVES Q2).** Every file gets a harness (authored; may be
  empty/default for pure files) and a generated test file — **generated into
  `.assayer/cache/`, NOT colocated with source and NOT committed (D14)**: the
  committed surface is harness + observables/scenarios + custom tests + waivers
  + baselines; generated cases rebuild deterministically from those plus the
  implementation. Manual changes or additions to generated test files are build
  errors (and being cache-resident, they're also out of the LLM's line of
  temptation and can never merge-conflict). Rules that make the lock
  safe:
  - Expectations are always sourced from something OTHER than the file being
    regenerated (consumer code, declared models, observables, demanded pairs,
    prior locked values via D10 orphan flow) — same-file regeneration ratifies
    same-file bugs otherwise. Implicit breakage is caught exactly when the
    expectation's source and the change live in different places.
  - Leaf code with no in-repo consumers is the exposed class → tier-3
    observables + review surface are load-bearing there.
  - "Explicit" changes are safe because R10 forces the semantics into
    declarations whose diffs headline for human approval — generation itself
    cannot distinguish intent from accident.
  - Carve-outs: tier-3 observables/scenarios are authored, never locked;
    WAIVE-WITH-REASON declarations are the legal move against analyzer false
    positives (surface in semantic diff); extra desired cases route to
    observables or new rules (ratchet), never manual test edits.
  - **Harness-declared custom tests (user addition):** for truly unique cases
    no generator can bake in (e.g. drag responsiveness measured through a
    pointer sequence), the HARNESS may declare custom tests — authored,
    isolated from generated files, therefore easy to review in isolation.
    Constraints: config-vocabulary-first with measured escape hatches; must
    link coverage IDs / observables so they appear in the ledger (an unlinked
    custom test is invisible to enforcement and review).
  - Residual risk lives in the authored harness (an observation wrong the same
    way as the implementation co-signs the bug) → harness ops stay constrained
    to closed vocabulary / plugin primitives.
  - **No representable skip:** generated tests cannot be skipped; retiring a
    flow/architecture must pass through a WAIVER or an orphaned observable —
    both semantic-diff-visible. (Motivating find: a codex e2e suite sitting at
    `describe.skip` for a retired architecture, "re-enable once a harness
    exists" — silently unverified observables with nothing forcing the return.
    Case-studies §4.)
- **D14 — Tooling vehicles: CLI + desktop app (Electron/Tauri-class, no
  browser-tab workflow — explicit user preference, not a technical derivation).**
  Because generated tests aren't colocated, the tooling must make them browsable:
  - **CLI:** list all cases for a file (`assayer cases <file>`), run scoped
    tests, pull run artifacts (`assayer detail <runId>` — ward-style).
  - **Desktop app:** repo file/folder tree → click a file → its case list,
    launch its tests, or jump into manual testing from its entry points; hosts
    the review surfaces (semantic-diff queue, projections, explorer, decks).
- **D13 — Cache: content-hash incremental; git hooks are warmers, never the
  correctness mechanism.** Every derivation input is hashed (file contents,
  Assayer version, plugin versions, config); any invocation recomputes exactly
  the stale subset — merges/rebases/checkouts/direct writes need no special
  handling. Invalidation propagates along C2 dependency edges (the impact-
  analysis machinery doubles as cache invalidation). Optional husky post-merge/
  post-checkout hooks warm the cache in the background and surface the
  unapproved-delta queue immediately after a merge — skipping them costs
  latency, never correctness. **Layout: everything lives under `.assayer/`,
  committed — baseline approval records, repo-local plugins/custom
  declarations, config — EXCEPT `.assayer/cache/`, which is the only
  gitignored path (derived, disposable).** Cold CI cache reproduces identical
  hashes by determinism.
- **D10 — Regeneration policy: merge by stable coverage ID, orphans error.**
  Config files have machine-owned zones (skeletons, covers IDs, holes) and
  author-owned zones (filled expectations, scenario content). Regeneration merges
  by ID: new items → new skeletons (error until filled); unchanged items →
  untouched; vanished IDs → orphaned case = build error demanding remap-or-delete
  with the requirement question asked explicitly. Never silent deletion, never
  silent retention, never full-file rewrite.

## Tracked Questions / Constraints / Blockers (from catalog walk)

- **Q1 — Our logic vs platform behavior (dates/Intl):** where is the line between
  testing our formatting code and testing what the browser/Intl does with a
  locale/timezone? Scope of the e2e timezone matrix (which zones, which formats)?
  Raised on the date-typed JSX entry.
- **C1 — Constraint: AST data-flow chain following (same-file minimum).** A render
  sink's generated cases must include transforms applied UPSTREAM in the chain
  (filters, sorts, mutations) that live at other lines of the same file — the
  analyzer traces source → transforms → sink, not just the sink line. Cross-file
  chains: presumed handled by per-file coverage at the module boundary (each file
  tests its own transforms) — confirm when the coverage-ID scheme is designed.
  Direct consequence for the parser epic: per-line syntax scanning is
  insufficient; intra-file data-flow analysis is a core requirement. Emerging
  principle (now three occurrences — chain transforms, optional props,
  passthroughs): obligations key off CONSUMPTION, never declaration —
  declared-but-unconsumed surface generates lint errors (R13), not tests; pure
  passthrough plumbing is PROVEN statically and never tested ("did it drill
  through" tests are unnecessary by construction); tests attach only to
  transformation and consumption sites. SCOPE SPLIT: transform-case generation
  is per-file (same-file tracing), but consumption/liveness analysis must be
  CROSS-MODULE — prop drilling and arg forwarding span files, so the
  unused-down-the-chain flag requires whole-graph reachability, not per-file.
- **C2 — Constraint: the analyzer materializes two linked graph artifacts.**
  Not ad-hoc queries — persistent, queryable indexes the whole system references:
  1. **Type/contract graph ("mind map"):** Zod + TypeScript meta-analysis over
     types, interfaces, contracts, unions, `Record<Union, Meta>` maps and their
     relationships. Referenced by case generation (valid/invalid shapes), stub
     and explorer-state presets, coverage IDs, R15 plugin callbacks, and the
     review projections. Materializes P3's "detect by type graph" into an
     actual artifact.
  2. **Bidirectional data-flow graph:** forward source → transforms → exit (C1)
     AND reverse exit → back to sources, with mutation/rebinding sites
     annotated. The reverse map powers: arrange derivation (what state to seed
     so data funnels to a given render/exit — D6's reachability made concrete),
     IMPACT ANALYSIS (a code change → exactly which observables/cases are
     affected → semantic-diff precision and targeted re-runs), and orphan
     diagnostics that name the broken hop (passthrough chain breakage).
- **C3 — Constraint: consumption-partitioned state generation (the test-data
  theory).** With the full AST walk (C1/C2) and enums/unions/mutations
  translated to enumerated values, the analyzer can compute, per entry, the
  reachable output-state space — and then shrink it to the SALIENT set by
  consumer care:
  - Each caller/call-site consumes a SUBSET of the response (different UI
    locations read different projections — C2 consumption analysis provides
    the per-site projection).
  - A field's value domain partitions by the conditionals that touch it
    anywhere down its consumer chains (enumerated branch-relevant values →
    one representative per equivalence class).
  - Fields NO logic ever branches on or mutates (plain string column, displayed
    verbatim) get randomized representative fill — their values provably don't
    matter, so x/y/z randoms suffice.
  Result: a generated, minimal-but-complete test-state matrix per entry, driven
  by what callers actually care about — this is what populates registry pairs
  (R19), explorer state presets, and arrange fills. Salience is computed, not
  guessed.
- **Q7 — R12/D14 v1 partition (Blocker #4):** R12 accumulates many product
  surfaces (projections, ledger, semantic-diff queue, render decks, state
  explorer + flow stepping, endpoint explorer, full-stack live tracing) plus
  D14's desktop app. Which subset is v1? Unruled — needs the user's cut line
  before the tooling epic.
- **Q8 — Public-API exemption for dead-surface rules:** the R13 unused/
  untested-prop and transitive-dead-surface flags false-positive on every
  library export (consumers outside the repo). Exemption mechanism
  (entry-point/public-surface config) undesigned. Raised in catalog
  Passthroughs; must ship WITH the rule or the rule can't ship.
- **Q6 — Approval authority under agent autonomy:** `assayer approve` updates
  the baseline lockfile; an autonomous agent could run it blindly. In-package
  mitigations: approve requires ENUMERATING the specific deltas being accepted
  (the acknowledgment is visible in the lockfile commit); repo-level: protect
  `.assayer/baseline/` via CODEOWNERS/branch rules. Full prevention is outside
  Assayer's control — how far do we go?
- **Q3 — Non-lexical data-flow edges (PROMOTED TO V1-BLOCKING, codex case
  study):** context Provider→useContext, store-mediated flows, AND in-process
  event buses + WS wires (`orchestrationEventsState.emit` → server handler →
  WS → web binding) break lexical chain-following. The codex session-message
  analysis showed the target repo architecture crosses two such hops in its
  core flows — R19 demanded-pair errors and C2 cross-package flow graphs
  depend on resolving this. Likely shape: declared models at bus/wire
  boundaries (event-type contract + emitter/subscriber registration as
  declarations). Must be designed before the analyzer epic is carved.
- **Q4 — Schema holes: lint vs generated tests.** For db concerns (write path
  with no conflict handling, missing constraint handling), when is the hole a
  STATIC lint callout vs a GENERATED test case asserting runtime behavior?
  Split not yet ruled; db obligation family is TO-FILL in the catalog until db
  work begins.
- **Q5 — Full-flow selection rule (R19).** Which flows MUST run full
  integration? Working heuristic: upstream logic consuming downstream-emergent
  effects (WS, polling, timing-dependent reactions) or observables spanning
  layers ⇒ full-flow; everything else glue + registry. Open: is the heuristic
  auto-detectable (analyzer sees the WS subscription in the reaction path) or
  purely user-declared, and what's the default when ambiguous?
- **Q2 — RESOLVED by D12:** tests are locked + auto-regenerated; manual
  edits/additions to generated files are build errors; authored surface =
  harness + observables/scenarios; expectations sourced externally to the
  regenerated file; waivers for false positives.

## Open Questions (to flesh out before epics)

- **Config test format (ACTIVE DISCUSSION — Blocker #2):** how a config-structure
  test expresses arrange/act/assert across the three execution contexts (see
  Glossary: unit / integration / e2e). Constrained by the artifact inventory
  (fills committed separately from assembled cache files).
- **Coverage-ID scheme (ACTIVE DISCUSSION — Blocker #3, single question):** the
  stable identifier linking a case to the testable item it covers. Current lean
  (recorded earlier in discussion): IDs derived from condition source text within
  the enclosing scope path (e.g. `processOrder/if:order.total>limit`) — survives
  reordering, breaks exactly when the logic changes, which is the desired "is the
  requirement still true?" prompt. Backend branch code is the hard case; React
  is easier. Also gates C1's cross-file presumption.
- **E2E arrange model (needs confirmation):** with D5+D6, e2e arrange appears to
  be: seed state at the real-but-controllable boundaries (db fixtures, mocked
  external responses) + navigate to the route; component props then EMERGE from
  the real app rather than being set directly. Unit arrange sets props directly.
  Same logical case, two arrange expressions — schema must hold both.
- (Router question RESOLVED by D7: pluggable seam, v1 = react-router + express
  + hono; only the non-static-routes manifest escape hatch remains tabled.)
