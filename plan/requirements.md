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

1. **Q3 (blocking):** non-lexical data-flow edges (event bus, WS, stores,
   context) must be DESIGNED before the analyzer epic is carved — the target
   repos' core flows cross these hops. **(RESOLVED at design level 2026-07-05 —
   see D24: plugins elaborate the core map with channels; dark spots + package
   classification cover the rest. Per-tech plugin internals remain implementation.)**
2. **Interface contract (ACTIVE DISCUSSION below; reshaped by D17):** the
   authored-data persistence schemas + harness authoring API + runtime
   contract (interpreter/reporter). Gates the format epic; the artifact
   inventory constrains it but the draft doesn't exist yet. (Formerly "config
   test format" — D17 killed human-facing config files.)
3. **Coverage-ID scheme (ACTIVE DISCUSSION below):** "coverage ID" is used as
   settled vocabulary throughout — it is NOT yet designed. Cache-internal only;
   gates case addressing, diff-view correspondence quality (D18), and cross-file
   case DRIVING (arranging a callee's branches through a caller across a file
   boundary — the module-boundary EDGE resolution C1 presumed is already built,
   the import resolver).
4. **Q7 (below):** R12 lists many product surfaces + D14's desktop app — which
   subset to build was in question. **(RESOLVED BY REMOVAL — there is no
   phasing/subset; every review surface and tooling piece is core functionality,
   so there is no partition to rule. See Q7 below.)**
5. **Q4 / db section:** the database obligation family is TO-FILL; a db-probe
   epic cannot be scoped yet (same status as Q3 for the analyzer, stated here
   explicitly).

## Glossary (terms used throughout; canonical definitions)

- **Tiers (R9 — provenance of a test case):** tier 1 = syntax-derived, tier 2 =
  model-derived, tier 3 = intent scenarios/observables. P3 uses the same
  numbers as graceful-degradation levels: semantics declared as data get tier-2
  generation; undeclared semantics fall back to tier-1 branch skeletons. Same
  axis, both senses.
- **Observable (D9/R11; "tier-3 observable" = "declaration" = same thing):** a
  declared requirement — "state S + trigger T ⇒ effects E" — carrying a LAYER
  (computed-value, dom, request, rendered-geometry, visual, perf, copy…). The
  layer list is OPEN — layers arrive with the plugins that own them (web brings
  dom/request; three.js brings rendered-geometry), consistent with "core ships
  the engine, not opinions" (R17).
  **Authored as a config-shaped custom case INSIDE the relevant harness**
  (closed vocabulary against the surface — never raw asserts), not as a
  separate data file. Exists only where no code anchor supplies the truth
  (D18).
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
- **Coverage ID / map-node ID:** the identifier of a testable item, INTERNAL TO
  THE CACHE GENERATION it belongs to — used for case addressing, run results,
  and diff computation, always regenerated with the maps. **NEVER a key in any
  committed artifact** (user ruling: node IDs are unstable by design and
  unreliable machine-to-machine). Committed artifacts key on user-chosen names
  (states, declared cases) and file paths (harnesses). The ID grammar
  still needs design (Blockers #3) but only for cache-internal addressing and
  diff-correspondence quality.
- **Waiver: DOES NOT EXIST per-site (user ruling).** The only "deliberately
  unmet" mechanism is GLOBAL rule/obligation configuration — a kind is on, off,
  or severity-adjusted for the whole repo (at most section-scoped like R14
  policies). Rejected because caring is not site-local and per-site
  suppression is an LLM abuse vector. Misfires are rule bugs or code smells,
  never exemptions. Config changes headline in the semantic diff.
- **Statics:** dungeonmaster's folder-type for immutable declared constants —
  the "no magic numbers" home. Assayer requires declared values (scales, delays,
  budgets) to live in analyzable constant declarations; the dungeonmaster folder
  convention is NOT required (P3) — any type-graph-visible const declaration
  counts.
- **Ward:** dungeonmaster's quality-gate CLI (lint+typecheck+tests, one entry
  point). Referenced as prior art for D2's bundled CLI and R21's
  `detail <runId>` pattern.
- **Buckets A/B/C:** the expectation-catalog's classification — A: always tested
  based on code (auto-derivable; ships inside discipline plugins per R17), B:
  user-expected (right code, wrong for the user — the human's diagram-review
  territory, plus rare harness-declared cases), C: repo-specific (custom
  declarations/plugins). Defined fully in the catalog preamble.
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

## Artifact inventory — what commits to git vs what lives in cache (line-by-line)

**The rule generating this list:** git holds SOURCE and AUTHORED INTENT (things
the machine cannot rebuild); cache holds everything DERIVABLE (things the
machine rebuilds deterministically from git content). Nothing else exists.
No artifact is a protection mechanism (D18) — committed means "survives machine
loss and travels with branches," nothing more.

### Committed to git

1. **The repo's own source code** — the root input. Maps derive from it at any
   ref; it is the spec (D18).
2. **Harness files** (`*.harness.ts`, colocated with source) — the ONLY
   authored Assayer artifact, and the single home for ALL authored test
   content. Contains: the surface (interactions = how to do things;
   observations = how to read things — ALL testid/selector/scene-hook
   knowledge lives here and nowhere else), semantic readiness predicates,
   correlation bindings (control ↔ affected region), named-state wiring, and
   **declarations: custom test cases expressed as CONFIG** — declarative
   closed-vocabulary case structures (act/assert against the surface), NEVER
   raw test asserts. This is where the config format lives (user ruling):
   the no-code-anchor invariants (live/replay ordering, transient-flash) are
   authored here as config cases, not in separate data files.
3. **States** (`assayer/states/` folder) — named state fixtures for when C3's
   auto-generated data isn't good enough: static JSON for simple shapes AND
   `.state.ts` parameterized BUILDER functions for state families with
   internal invariants (D20 — e.g. a valid multi-file nested-session for any
   params; a three.js model JSON).
   Keyed by USER-CHOSEN NAMES — never by map-node IDs (node IDs are unstable
   by design and NEVER key committed artifacts; they live cache-internal
   only). Harnesses import states by name to override state loading for
   specific tests or globally; the UX shows which states each test uses and
   what exists globally so gaps are visible. Expectations themselves are NOT
   authored — they derive from inputs, source literals, declared models, and
   consumer demands. There is no committed "answers/fills" artifact.
4. *(Declarations are not a separate artifact — they live in harnesses as
   config-shaped custom cases; see item 2. They exist ONLY where no code
   anchor can supply the truth; rare by design (D18); never ceremonial.)*
5. **Global don't-cares (rule/obligation config — there are NO per-site
   waivers, user ruling).** "If you don't care about delay-on-key in one
   place, you care nowhere" — don't-cares are GLOBAL toggles/severities on a
   rule or obligation KIND, living in config (item 6), at most scoped per
   app section like R14 policies. Per-site/per-test waivers were rejected
   outright: LLMs would overuse them (the `eslint-disable-next-line` abuse
   pattern). A rule that misfires on one site is a rule bug (ratchet a fix)
   or evidence the code should change — never a site exemption.
6. **`.assayer/config`** — environment contract (processes + launch + readiness,
   D16), plugin registrations WITH their required connection configs (mongo
   port/user/password — unconfigured plugin = invisible), D5 mock policy
   defaults + scoped overrides, R14 interaction policies, R2 rule
   selections/severities ("I care about ternaries, not static text").
7. *(Expected-render/blessed-image artifacts DO NOT EXIST — user ruling.
   Harnesses expose a CAPTURE capability (screenshot / scene render) as an
   observation kind; the visual diff RUNS both refs — boots source and target,
   captures each, shows the two images side by side. Because the diff range is
   arbitrary (any ref vs any ref), the comparison target is always computed at
   diff time from the target ref, never stored. Renders are cache/run
   artifacts like everything derived.)*
8. **Repo-local plugins** (`.assayer/plugins/`) — custom probes/rules/adapters
   the LLM authored for this repo (R15 contract, not published as packages).
9. **The `.gitignore` entry** for `.assayer/cache/` (written by init).

### Generated into `.assayer/cache/` (gitignored, disposable, rebuilt on demand)

1. **Maps** — the execution-roadmap graphs per source file (testable nodes per
   rule config) plus the repo-level C2 graphs (type/contract "mind map";
   bidirectional data-flow graph). Keyed by content hash; a map for ANY git
   ref recomputes from that ref's blobs (never persisted historically).
2. **Assembled test artifacts** — the runnable output: trivial Jest/Playwright
   shim files (exist only so runners have discoverable entries) + assembled
   case sets (map skeleton ⊕ derived expectations ⊕ C3 data or named states
   where the harness wires them) that the D1 interpreter executes. Locked: no manual edits, no skips (D12);
   being cache-resident, they can never merge-conflict and never tempt the
   LLM.
3. **The registry (R19)** — verified pairs + demanded pairs + their
   reconciliation, run-scoped: pair definitions derive statically; verified
   status is produced by dependency-ordered execution within the run.
4. **Run artifacts** — per-runId results, effect-chain traces (R21), captured
   boundary data (http headers/request/response, db rows, redis keys, mock
   captures) powering `assayer detail <runId>` and failure chain-diffs.
5. **Projections** — rendered flow diagrams, model diagrams, ledger views,
   ref-to-ref semantic diffs. Pure views over maps; regenerated per request.
6. **Derived state presets (C3)** — salient state matrices per entry, feeding
   explorer state lists, needed-state gap reports, and registry pair
   inventories. Hand-authored states (committed, named) OVERRIDE these where
   wired in the harness.
7. **Resolved-import index** (`cache/resolved/<namespace>.json`) — the DERIVED
   stitch output: every import reconciled to its canonical definition
   (`local` repo-relative path / `package` / `builtin`), with call-site
   positions. Keyed on repo layout + tsconfig hash, rebuilt when the file set or
   tsconfig changes; per-file blobs stay pure (raw references only), so a file
   move re-resolves without re-parsing.
8. **External-signature cache** (`cache/external-signatures/<declHash>.json`) —
   one package/builtin callable's declared input/output types
   (`{ params, returnType }`), read once through the second, node_modules-aware
   project and keyed on the `.d.ts` byte content (machine-independent, not the
   version string), reused by every importer.

**Pipeline note (D15):** CI may persist/restore `cache/` between runs purely as
an accelerator; a cold cache reproduces byte-identical artifacts (D13
determinism), so cache loss is never a correctness event.

**The D10/D12 resolution restated (supersedes the "fills" framing):** the
author-owned zone is STATES + declarations + harness wiring — all keyed by
user-chosen names and file paths, never by map-node IDs. The machine-owned zone
is everything assembled in cache: structure from implementation, arrange data
from C3 (or named states where the harness wires them), expected values derived
from inputs/source literals/models/consumer demands. Node IDs exist only inside
the cache generation they belong to (case addressing, run results, diff
computation) — regenerated together, never persisted, never a git key. D3
remains ABSORBED: generation always produces the cases; the only authored
inputs are states (when auto-data is insufficient), declarations (when no code
anchor exists), and harness code.

## Vision

Assayer is an npm package installed into TypeScript repos (like ESLint) that:

1. Statically identifies every piece of syntax that **should** be tested, according to
   configurable rules.
2. Generates and executes the tests itself from derived execution maps, failing
   like a build error when something testable is uncovered or broken — catching
   new code written after tests existed. (D21 scopes what "broken" means:
   structural/flow reachability and consumption in the assembled system — never
   the isolated value-correctness of a typed pure function.)
3. Runs everything through fully wrapped runners (Jest unit/integration,
   Playwright e2e) driven by the maps — **no test files are authored or
   committed**; humans author only harnesses, named states, and config
   (D17/D18).

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
  rules ship as DISCIPLINE plugins (`@assayer/web`, `@assayer/cli` — see R17;
  core ships the engine, not opinions), with new rules addable as packages.
- **Initial focus:** the discipline plugins' initial rule sets + the plugin seams.
- **Extension point:** full third-party rule/package extensibility — the
  architecture must not preclude it.

### R3 — Coverage enforcement as a build-style error
- For each source file, compare what its map says should be covered (R2 rules)
  against what the assembled cases + harness-declared cases actually cover.
- If something that should be covered isn't, **error like a build error**.
- Purpose: catch new/changed code after tests were originally written. Enforcement is
  continuous, not one-time generation.

### R4 — TypeScript only
No plans for plain JS or other languages.

### R5 — Declarative test cases (REFRAMED by D17: the map is the test definition)
- Test cases are declarative structures interpreted at runtime — never
  traditional Jest `it()` code, never authored/committed test files.
- One DERIVATION serves all execution systems (Jest unit/integration,
  Playwright e2e); mode assignment per R6.
- The only authored case form is the config-shaped custom case inside a
  harness (closed vocabulary against the surface); it must support per-mode
  instructions where one logical case needs different mechanics per runner.

### R6 — Per-test execution-mode classification
- Each test case is classified as: unit-only, e2e-only, or both.
- Assayer should intelligently determine (or the config should express) which modes
  apply. Examples from discussion:
  - Values rendering correctly in a component → unit **and** e2e
  - Button/interaction tests → unit **and** e2e
  - Display variations driven by a parent-provided value → potentially unit-only
- The granular classification rules will be worked through case-by-case; the
  test-case config schema must support per-mode instructions **regardless**.
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
  5. **(RULED — D23) Execution enumeration policy.** e2e is salient-shrunk by
     DEFAULT: a flow is not run against members of a value set it does not
     branch on (a role-indifferent flow is not run per-role); a per-HARNESS
     override forces full-collection runs where extra assurance is wanted. unit
     is salient by default with an OPT-IN full-collection "battle-test" mode.
     unit's dedicated high-value role is PERF; e2e owns holistic reachability.
     Per-member completeness lives in the MAP (D22), not in execution — so
     shrinking execution loses no review signal. Firms the single-owner
     direction.

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
1. **Syntax-derived** — analyzer generates the cases deterministically (value
   renders, conditional renders, branches), with expectations DERIVED from
   inputs/source literals and arrange data from C3 — overridable by named
   states wired in the harness. Nothing is hand-filled.
2. **Model-derived** — when high-level behavior is declared as data (state
   machines / transition maps, allowlists, route configs, Zod contracts), Assayer
   derives obligations from the model: every edge tested, every non-edge rejected,
   every gate's missing-content case covered.
3. **Intent scenarios** — workflow cases encoding truths no code anchor can
   supply ("state S + trigger T ⇒ effects E"; see `case-studies.md` §1/§3).
   Not derivable. Authored as CONFIG-SHAPED CUSTOM CASES inside harnesses
   (D17/D18) with schema-enforced completeness rules; rare by design; any
   weakening/removal surfaces in the ref-diff for the human's diagram review.

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
  from the declaration, so they're truth, not LLM claims. Model changes show up
  in the ref-to-ref semantic diff as projection diffs; the human reviews the
  diagram delta and directs the LLM if it's wrong. (Replaces the "redraw the
  map across 5 sessions" loop with: review one diagram delta per change.)
- **Observable ledger:** every requirement with status — verified (layer, cases),
  unverified, orphaned.
- **Semantic diff report:** per change, in requirement-space only — model edges
  added/removed, observables added/changed/WEAKENED (headline, never buried),
  coverage delta, obligations delta, **new/removed boundaries per flow** ("flow
  save-quest now writes to redis" — catches wrong-tech choices no test can),
  and global don't-care config changes (a rule turned off is a headline).
  Empty semantic diff + green checks = nothing to review.
- **State-render decks (plugin capability) — runtime-diffed, never committed:**
  harnesses expose CAPTURE (screenshot / scene render) as an observation; decks
  render declared/named states for human perceptual review. The visual diff is
  a RUNTIME ref-to-ref diff: boot the app at source ref and target ref
  (worktree + D16 environment), capture the same states at each, show the
  images side by side. On-demand only (booting two refs is expensive);
  correctness depends on render determinism per state — tolerance comparators
  (R11) absorb GPU-level noise. No blessed/baseline images exist anywhere;
  the human's eyes on the side-by-side ARE the perceptual check, same
  attention channel as diagram deltas (D18).
- **Semantic-diff mechanics (ref-to-ref comparison — NO approval machinery,
  user ruling):** the diff is NOT a git text diff and NOT a gate. Assayer
  derives the requirement-space model at two git refs (determinism: any ref's
  map recomputes on demand from its blobs) and graph-diffs them. **There is no
  "approve" action anywhere** — if the human dislikes something in the diff,
  they direct the LLM to change the code. The ONLY enforcement is: do the
  tests/coverage/lint checks pass on the compared state.
  - **Ref resolution:** local/LLM runs default to comparing against the
    MERGE-BASE with the default branch (what this branch branched off);
    pipeline runs pass refs explicitly; ON the default branch there is no
    implicit comparison — but the UI/CLI supports arbitrary "compare ref A vs
    ref B" (webstorm/github-style), e.g. reviewing a week of main.
  - **UI: only-changed view** — lists ONLY artifacts whose subgraph changed
    between the two refs; each renders as a CHANGE DIFF (added nodes/edges
    marked — a redis boundary appears with a callout; removals marked;
    before/after toggle). A wrong-tech swap is caught by the human READING the
    PR's semantic-diff report, not by a block.
  - **Branch isolation is free:** the committed authored surface (harnesses,
    named states, config) travels with each branch, and diffs anchor to
    merge-base — so a branch is always compared against what it branched
    from, never a sibling. Two branches' INTERACTING changes surface
    naturally in the post-merge state's diff vs its merge-base.
  - Preconditions (load-bearing): deterministic derivation/serialization and
    stable artifact IDs (same philosophy as coverage IDs).
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
Assayer's discipline plugins (R17) carry lint rules (own + curated third-party)
enforcing testability preconditions on IMPLEMENTATION code — constraints that make
the generated tests meaningful and the failure modes representable (installing
the discipline plugin brings its lint family; every rule toggleable):
- Leaked-render family: nullable values in JSX require explicit `??` fallback /
  else render (blank, `"null"`/`"undefined"`, and `{count && ...}` → `0` leaks).
- Date/format family: no raw Date-to-string in render paths; formatting must be
  explicit (TS cannot type the format).
- **Foreign test infrastructure (added from the step-4 guardrail pass):** stray
  raw test files (`*.test.ts`, `*.spec.ts`) or runner configs/dependencies
  (jest.config, direct jest/playwright deps) appearing in a consumer repo →
  error: "tests are generated; declare in the harness instead." Without this,
  an LLM's trained instinct to write raw Jest silently bypasses the whole
  system while appearing to add coverage.
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
- **Even the "base rule set" ships as DISCIPLINE plugins (user ruling):**
  `@assayer/web` (leaked-render, forms, routes, DOM obligations), `@assayer/cli`
  (stdout/exit-code/args obligations), etc. — each declares the common tests of
  its discipline, every obligation kind individually turn-offable. **Installing
  a plugin IS the implicit declaration of what you care about**; the global
  don't-cares (see artifact inventory) are per-obligation toggles WITHIN
  installed plugins ("mongo: pk checks off"). Core ships the engine, not
  opinions — all opinions arrive via plugins and are config-toggleable.
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
  accepts. (Candidate later: expose the same topics over MCP; the CLI is the
  required surface.)
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
1. **Home dir:** create `.assayer/` (committed: config, plugins/) +
   `assayer/states/` + `.assayer/cache/` with the .gitignore entry (D13
   layout).
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
   surface the fresh semantic-diff view (D13) — offered, not required.
6. **Initial derivation:** build the repo's first maps/graphs and present the
   derived model (projections, coverage report) as onboarding output — the
   human's first look at what Assayer sees. No approval step exists; gaps
   surface as ordinary coverage errors.

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

### R22 — Shared diagnostics & error-rendering subsystem
(Added from the features-doc pass: P1 states the standard everywhere; this
names the owner.) One shared framework composes and renders every error in the
system — CLI, desktop, reporters — in a uniform register, because errors are
the LLM's corrective instruction surface:
- Error shape: mechanism + site + evidence + satisfying action.
- P3 nudge support (suggest modeling, never require it).
- Did-you-mean rendering for load-time surface validation (D17).
- Exact error strings are asserted in Assayer's own fixture tests (R16) — the
  case-studies error texts are the quality bar.

## Non-goals / Deferred

- **Deferred (owner-chosen): record-inspection UX** — a record-centric
  verification surface ("did my records do what I needed them to, across
  operations") beyond the endpoint explorer's per-request expected-vs-actual
  effects panel. User wants to manually spot-check records even knowing tests
  exist; UX shape unclear — explicitly deferred by user.
- Third-party rule packages (initial build lays groundwork only; the architecture
  must not preclude full extensibility) — R2
- Granular unit-vs-e2e classification ruleset (initial focus is schema support;
  the full ruleset is still to be designed) — R6
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
  Plus `smoketest` (D16): boots the declared environment and verifies every
  process readiness check and every configured plugin's connectivity.
  Plus states visibility (user requirement): list the states a given test
  uses and what exists globally (generated + named), so state gaps are
  findable from the CLI as well as the UX.
  Plus pipeline-mode output (D15/D18): in PR runs, emit the ref-to-ref
  semantic-diff REPORT as a pipeline artifact alongside pass/fail exit codes —
  the report the human reads is produced by the run, not assembled by hand.
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
  services). The policy is data, not convention. Extensions (from the
  mocking-detail pass):
  - **Boundary CLASSIFICATION:** not every npm import is a boundary. Probes
    classify their packages as I/O; node built-ins (fs/http/child_process) are
    inherently I/O; pure-compute libraries (lodash/zod/date-fns) run REAL —
    mocking them is forbidden and meaningless. An UNCLASSIFIED third-party
    import on a tested chain is a lint: "classify `some-sdk` as io|pure in
    config, or install its probe."
  - **Everything else runs REAL — as Assayer's own rule, not dungeonmaster
    inheritance:** app code (components, brokers, transformers) and pure deps
    are never mockable; no vocabulary exists to mock them (unrepresentable,
    not discouraged). Mocking is exhausted by the declared boundary set.
  - **Boundary behavior is mode-polymorphically realized (mirrors D20):** a
    case's boundary declaration ("vendor POST resolves with X") realizes as a
    derived in-process mock feed in unit, and as a queued response on the
    probe's SHIPPED MOCK RUNTIME in e2e (fake server / fake binary with
    response queue, env-wired at boot per D16 — the codex
    wardMock.queueResponse pattern, productized). Probes ship BOTH realizers.
  - **Harnesses never mock anything.** No mock wiring is harness content;
    there is no invoice for it.
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
  Initial set: react-router, express, hono. Manifest escape hatch for
  non-statically-analyzable routes: still tabled.
- **D8 — Terminology:** drivers expose **interactions** (things a test does —
  click, type, submit) and **observations** (things a test reads — text, presence,
  emitted calls). Together: the driver's **surface**. Replaces the earlier "op"
  shorthand.
- **D9 — Assayer owns the declaration schema.** Forced by P3: since no external
  framework can be assumed, the declared-case form ("state S + trigger T ⇒
  effects E" — authored as config-shaped custom cases inside harnesses per
  D17/D18) is Assayer's own schema. External systems (e.g. dungeonmaster
  quests) map INTO it via the pluggable seam.
- **D11 — Timer compression in test runtimes.** Because delays/timeouts must live
  in statics (no magic numbers), the Assayer runners auto-inject environment
  overrides for declared time values — a 60s inactivity timeout runs as
  milliseconds under test. Tests never wait wall-clock for declared delays; the
  runner provides expected-timeout handholding. Applies to e2e (env injection)
  and unit (fake timers) alike; another payoff of R10's declare-as-data pressure.
- **D12 — Tests are locked and generated; harness/states/config are the
  authored surface (RESOLVES Q2).** Every file gets a harness (authored; may be
  empty/default for pure files) and a generated test file — **generated into
  `.assayer/cache/`, NOT colocated with source and NOT committed (D14)**: the
  committed surface is harness (incl. its config-declared custom cases) +
  named states + config; generated cases rebuild deterministically from those
  plus the implementation. Manual changes or additions to generated test files are build
  errors (and being cache-resident, they're also out of the LLM's line of
  temptation and can never merge-conflict). Rules that make the lock
  safe:
  - Expectations are always sourced from something OTHER than pure execution
    of the changed code (consumer code, declared models, source literals,
    named states, demanded pairs) — same-file regeneration ratifies same-file
    bugs otherwise. Implicit breakage is caught exactly when the expectation's
    source and the change live in different places; same-file intent changes
    are the human's diagram-delta review (D18).
  - Leaf code with no in-repo consumers is the exposed class → tier-3
    observables + review surface are load-bearing there.
  - "Explicit" changes are safe because R10 forces the semantics into
    declarations whose diffs headline for human approval — generation itself
    cannot distinguish intent from accident.
  - Carve-outs: declarations are authored, never locked; against analyzer
    false positives the ONLY legal moves are global — turn the rule/obligation
    kind off/down in config (headlines in the diff) or fix the rule (ratchet).
    No per-site suppression exists. Extra desired cases route to declarations
    or new rules, never manual test edits.
  - **Harness-declared custom tests (user addition):** for truly unique cases
    no generator can bake in (e.g. drag responsiveness measured through a
    pointer sequence), the HARNESS may declare custom tests — authored,
    isolated from generated files, therefore easy to review in isolation.
    Constraints: config-vocabulary-first with measured escape hatches; named
    (user-chosen, stable) so they appear in the ledger and diffs — never
    linked by machine IDs (cache-internal only).
  - Residual risk lives in the authored harness (an observation wrong the same
    way as the implementation co-signs the bug) → harness ops stay constrained
    to closed vocabulary / plugin primitives.
  - **No representable skip:** generated tests cannot be skipped; retiring a
    flow/architecture surfaces as map deltas + declaration removals + global
    config changes in the ref-diff — all diagram-visible, never a silent
    `.skip`. (Motivating find: a codex e2e suite sitting at
    `describe.skip` for a retired architecture, "re-enable once a harness
    exists" — silently unverified observables with nothing forcing the return.
    Case-studies §4.)
- **D15 — Two operating modes; comparison is always ref-to-ref (user ruling).**
  - **Local (LLM loop):** run anytime, committed or not; Assayer auto-resolves
    the comparison origin as the merge-base with the default branch. On the
    default branch itself: no implicit comparison; tests/coverage still run.
  - **Pipeline (PR):** refs passed explicitly (base/head); the pipeline may
    persist/restore `.assayer/cache/` between runs; no cache ⇒ full regen,
    always correct (D13 determinism).
  - **Ad-hoc:** UI/CLI accept arbitrary ref A vs ref B for historical review
    ("what changed in main this week").
  - Maps for any ref are recomputed from git blobs on demand (never
    persisted); the cache retains per-content-hash entries, so multiple
    refs' maps coexist naturally.
  - **No approval workflow exists.** The semantic diff informs; tests enforce.
- **D18 — The implementation is the spec; the DIAGRAM is the human's contract
  (user ruling).** Derived-from-implementation is the default truth: code says
  POST ⇒ map says POST ⇒ tests assert POST. Intent is protected by exactly one
  mechanism: **the human reading high-level code-flow/testing-flow diagram
  DELTAS** — not harnesses, not files, not committed "pins."
  - **No committed artifact is a protection mechanism.** The LLM can remove or
    rewrite ANY committed declaration with a plausible justification; a
    removed declaration is just another diff line. Pretending commitment =
    enforcement is self-deception. Declarations (observables, correlations)
    exist where derivation needs them (no-code-anchor invariants like
    live/replay ordering), never as safety devices.
  - **The safety chain is:** (1) diagram delta review — the human evaluates
    HIGH-LEVEL flow changes, deliberately low-information; (2) implicit drift
    caught by tests whose expectation source is unchanged code elsewhere
    (D12); (3) manual testing via the explorer as backstop; (4) fix-forward —
    if all three miss (H-1 style), it ships and gets fixed when found.
  - **Design consequence (product requirement):** diagram/diff
    signal-to-noise is P1-grade core product — the review surface must stay
    small, high-level, changes-only, drill-down on demand, because HUMAN
    ATTENTION IS THE SCARCE RESOURCE the entire model budgets around. A noisy
    diagram breaks the security model, not just the UX.
  - No mandatory scenario/observable coverage floors; enforcement applies
    only to what is declared, and declarations are as revisable as code.
- **D20 — Mode-polymorphic state realization + parameterized state builders
  (from reading codex's real harnesses/proxies).** One semantic state must
  MATERIALIZE differently per mode — that is the arrange-side crosser:
  - **Unit realization (derived):** feed the state through mocked boundaries —
    the broker's boundary-crossing ORDER is in the code, so mock queueing
    derives (kills codex-proxy-style hand-maintained queue bookkeeping);
    sink inspection = probe tap capture (kills hand-written inspectors).
  - **E2E realization (derived-first, escalating):** invert the app's own
    READ paths via the reverse map (the code that reads
    `<guild>/sessions/<id>.jsonl` tells us where to write) → probe seeders
    (db rows via the store plugin) → entry-API creation → builder/harness
    gap-fill, lint-invoiced per D19.
  - **State BUILDERS are an authored artifact kind:** `assayer/states/*.state.ts`
    parameterized, invariant-preserving generators (codex's
    createNestedSubagentSessionFiles: monotonic timestamps across files,
    prompt-verbatim-line-0, completion-pairing) — state FAMILIES static JSON
    cannot express. P4-legal: they encode third-party FORMAT knowledge, not
    expected outputs. This is also where fixture-provenance risk concentrates
    (case-studies §1 residue 4).
  - Largely answers the open "E2E arrange model" question: seed through real
    channels (derived-first) + navigate; props emerge from the real app.
- **D19 — The surface is DERIVED; the harness is a sparse, lint-invoiced
  gap-fill layer (user re-evaluation).** The analyzer + plugins derive the
  default surface from the implementation itself: interactions from JSX
  handlers/elements (selector, testid, text, event type are IN the code),
  observations from render sinks + their enclosing element paths, readiness
  predicates from the guards/conditions gating each handler. Nobody hand-writes
  what the AST already contains.
  - **A harness file exists ONLY when its gap-fill content is non-empty**, and
    every entry in it is traceable to a specific derivation-gap lint error:
    1. No stable handle on a testable element → error with
       IMPLEMENTATION-FIRST remedy ("add data-testid — preferred, stays
       derivable — or declare an observation override").
    2. Non-DOM interaction surface (canvas/scene/gesture) → "expose a handle
       hook or declare interaction X" (amalga's __poseEdit dev hooks are this
       pattern, productized via the domain plugin).
    3. Named-state wiring where C3 data is insufficient.
    4. Custom cases (no-code-anchor truths, D18 — rare).
    5. Correlations not visible in code.
  - **Handle derivation is CROSS-COMPONENT data-flow, not per-file syntax:**
    an in-repo wrapper (`<Button name="approve">` where Button renders
    `data-testid={\`btn-${name}\`}`) derives via C1 chain-following into the
    wrapper — prop → transform hops → attribute sink — at arbitrary depth.
    Only genuinely dynamic, domain-unresolvable values fall to the lint.
  - **Third-party components (vendor DOM invisible to the AST) — three-tier
    escalation:** (1) component-library ADAPTERS (`@assayer/ui-mui`-style —
    the seam pattern's next instance, generalizing R14's form-lib adapters):
    per-component interaction vocabulary, observation anchors from the
    vendor's documented role/aria contract, readiness semantics; (2)
    wrap-with-handle LINT ("wrap it in a repo component carrying a stable
    handle, or install/author an adapter") — converts the problem to the
    in-repo wrapper case and invoices good architecture; (3) harness gap-fill
    override as last resort.
  - **Harness-completeness lint** is the driving mechanism: derivation gaps
    are named build errors saying exactly "need this, add this" — the LLM
    never guesses what a harness requires. Inverse lint already exists (stale
    surface references, D10).
  - Supersedes the "every file gets a harness" phrasing in D12/R7: every file
    gets a derived SURFACE; harness files are the exception, not the unit.
- **D17 — No human-facing config format; the map is the test definition (user
  ruling).** Nobody reads test artifacts — humans use the CLI/UX, LLMs are
  mediated by schemas and errors — so file ergonomics is NOT a design input.
  Consequences:
  - Authored persistence: named states (`assayer/states/`, data) and config
    (incl. global don't-cares) — keyed by user-chosen names and file paths,
    NEVER node IDs — plus the harness, which carries declarations as
    config-shaped custom cases (closed vocabulary, no raw asserts). The UX is
    the pretty rendering for all of it.
  - The HARNESS is the only authored code artifact (it contains
    implementations). Everything else is data.
  - Runner integration: trivial generated shims in `.assayer/cache/` exist
    only so Jest/Playwright have discoverable files; they hand off to the D1
    interpreter (map + named states + harness, incl. its declared cases, at
    runtime). Custom reporters map results back to map nodes (R21) — runner
    output is never shown raw.
  - D4's "type-checked claim" RELOCATES: surface-reference validation moves
    from tsc to Assayer load-time validation against the derived surface
    (P1-grade "unknown interaction `clickAprove`, did you mean
    `clickApprove`" beats a squiggle in a file nobody opens).
  - The pre-epic deliverable is accordingly an INTERFACE-CONTRACT draft, not a
    config-format doc: (a) authored-data persistence schemas, (b) the harness
    authoring API, (c) the runtime contract (interpreter + reporter). Churn
    matrix + two worked rewrites remain its acceptance tests.
- **D16 — Environment contract: declared processes + smoketest; plugins
  participate only when configured (user ruling — resolves the "who boots the
  world" question before it needed a Q-number).**
  - **Playwright-webServer-style lifecycle:** the repo's Assayer config
    declares its processes (launch command + readiness check per process —
    same model as Playwright's `webServer` and codex's existing e2e launch).
    Assayer OWNS the launching (required for D5 env wiring, D11 timer
    compression, and R15 tap injection into consumer processes) but does NOT
    provision infrastructure — stores exist because the repo/dev/CI made them
    exist (docker-compose, local install, whatever).
  - **`assayer smoketest` (D2):** validates the declared environment — boots
    processes per config, runs readiness checks, verifies each configured
    plugin can reach its target (mongo answers on the declared port, etc.).
    P1-grade errors name exactly which piece of the world is missing.
    Required per-repo configuration is acceptable.
  - **Plugin participation is config-gated:** adding a probe plugin (e.g.
    mongo) REQUIRES its config (port/user/password/…) — schema-validated at
    config load with P1-grade errors on missing fields. An unconfigured/
    unloaded plugin is INVISIBLE: no obligations, no taps, no logs, no
    verification calls. (Generic D5 boundary handling still applies to
    unprobed boundaries — the mock policy must cover them; only the
    probe-specific richness is absent.)
  - **Target-repo scope assumption:** consumer repos are npm monorepos
    with `packages/*` layout, single human operator. Environment configs are
    authored per-repo without apology; generalization beyond this shape is
    out of scope.
- **D14 — Tooling vehicles: CLI + desktop app (Electron/Tauri-class, no
  browser-tab workflow — explicit user preference, not a technical derivation).**
  Because generated tests aren't colocated, the tooling must make them browsable:
  - **CLI:** list all cases for a file (`assayer cases <file>`), run scoped
    tests, pull run artifacts (`assayer detail <runId>` — ward-style).
  - **Desktop app:** repo file/folder tree → click a file → its case list,
    launch its tests, or jump into manual testing from its entry points; hosts
    the review surfaces (semantic-diff view, projections, explorer, decks).
- **D13 — Cache: content-hash incremental; git hooks are warmers, never the
  correctness mechanism.** Every derivation input is hashed (file contents,
  Assayer version, plugin versions, config); any invocation recomputes exactly
  the stale subset — merges/rebases/checkouts/direct writes need no special
  handling. Invalidation propagates along C2 dependency edges (the impact-
  analysis machinery doubles as cache invalidation). Optional husky post-merge/
  post-checkout hooks warm the cache in the background and surface the
  fresh semantic-diff view immediately after a merge — skipping them costs
  latency, never correctness. **Layout: everything lives under `.assayer/`,
  committed — repo-local plugins, config — EXCEPT `.assayer/cache/`, which is
  the only gitignored path (derived, disposable); named states live in
  `assayer/states/`; harnesses colocate with source.** Cold CI cache reproduces identical hashes by
  determinism; the pipeline MAY persist/restore the cache between runs as an
  optimization (D15), with cold full-regen always correct.
- **D10 — Regeneration is total and free (SUPERSEDED FRAMING — original
  merge-by-ID/orphaned-fills machinery retired with fills, D17/D18).** Maps and
  cases regenerate wholesale from source; nothing committed keys on them. New
  testable item → new generated case (coverage error only if its data can't
  derive and no named state is wired); removed item → its cases vanish with the
  map node; every change surfaces as a diagram/ref-diff delta for the human.
  Harness custom cases referencing surface members that no longer exist fail
  load-time validation with P1-grade errors — that's the only "orphan" left.

- **D21 — The implementation is the documentation; generated tests verify
  STRUCTURE/FLOW, not isolated value-correctness (sharpens D18; scopes the
  Vision's "broken", P2, P4).** Traditional tests are hand-authored documentation
  of expected outputs — a blind stab from chosen input angles. Assayer inverts
  this: the analyzer derives the execution map FROM the implementation, and that
  map — the total compendium of states and flows the system needs to function —
  IS the documentation the human reviews for holes. Consequences:
  - **What a generated test asserts is structural/flow, never the isolated
    value-correctness of a typed pure function.** TypeScript already guarantees
    the return type, and a side-effect-free function is a static value that
    cannot cause harm until it flows somewhere. "Broken" means: a declared path
    is unreachable in the ASSEMBLED system, a consumer fails to consume an
    effect, or a salient flow does not execute. (The amalga eyelid and the H-1
    endpoint are flow/layer failures, not arithmetic failures — case-studies
    §2/§3b.)
  - **Value-correctness is a HUMAN-REVIEW concern, not a generated assertion.**
    The human catches "the discount rate is wrong" / "the new status falls into
    the wrong else" by reading the MAP delta and by driving states through the
    explorer (D18's diagram-delta + manual backstop) — never by a red test.
    This is WHY P4 forbids deriving expected values from the code: generated
    tests do not assert computed values at all, so there is no authored
    "answers" artifact to protect.
  - A generated test failing therefore means "the code disagrees with itself
    across the assembled system" (e.g. a guard elsewhere hides a modal this
    handler renders). Which side is correct is the human's/LLM's call; Assayer
    surfaces the conflict, it does not adjudicate it.
- **D22 — Two decoupled shrink policies: the MAP is per-member complete;
  EXECUTION is salient-shrunk; and the map declares its own blind spots.** The
  map/compendium and the runnable case set are separate artifacts with OPPOSITE
  enumeration policies, on purpose:
  - **Map/compendium (C2 type-graph + dataflow) — enumerated PER-MEMBER.** Every
    member of a bounded value set is its own node; a new member (new enum value,
    or a new value-distinction minted by new branch logic anywhere) is a NEW node
    whose flow is traced to whatever branch consumes or swallows it. This
    GUARANTEES a visible diagram delta on the review surface when a
    value-distinction appears — exactly where the human catches "new value
    swallowed by an existing else / one side of the system not updated"
    (case-studies §1, §3a). Cheap: static derivation, not execution.
  - **Test-case generation (execution) — salient-shrunk per C3** (one
    representative per consuming-conditional equivalence class; randomized fill
    for don't-care fields). The map must NOT reuse C3's collapsed output: if the
    map collapsed members the way execution does, a new member could land inside
    an existing equivalence class and produce NO delta, silently hiding the very
    bug the review exists to catch.
  - **"Surfaced to the human" ≠ "executed as a test."** Review completeness lives
    in the per-member map; execution minimality lives in salient case
    generation. Governed independently.
  - **Map blind-spot honesty (HARD requirement — the map is the product).** Where
    the analyzer cannot trace a flow (a non-lexical hop — Q3; dynamic dispatch;
    an unresolvable spread), the map must VISIBLY MARK "not followed here," never
    silently omit the edge. A map that looks complete but dropped a flow is worse
    than none: the human spot-checks it, sees no hole, and wrongly trusts it.
    This promotes Q3 to a completeness property of the PRODUCT (not an analyzer
    nicety) and extends the analyzer's graceful degradation from "unparseable
    files" to "parsed-but-unprovable flows."
- **D23 — Execution enumeration policy + unit/e2e role split (firms R6's
  single-owner direction).** Because per-member completeness lives in the map
  (D22), running every value against every flow adds cost, not signal:
  - **e2e: salient-shrunk by DEFAULT** — a flow is not executed against members
    of a value set it does not branch on (a role-indifferent flow is not run
    per-role). A per-HARNESS override forces full-collection runs where a human
    wants extra assurance on a specific surface.
  - **unit: salient-shrunk by default,** with an OPT-IN "battle-test" mode that
    runs components against the full derived state collection — an assurance
    dial, not a necessity (the map is built regardless). Its exact cross-product
    scoping is an assurance-mode detail, not epic-gating.
  - **Role split:** e2e owns holistic reachability ("can every declared path
    execute in the assembled system" — where LLMs err most). unit's dedicated
    high-value role is PERF (plugin-dependent), plus cheap exhaustive exercise of
    tier-2 model matrices and the DSL rule. Confirms R6: most side-effecting
    categories are e2e-owned, unit as support only where it adds distinct value.

- **D24 — Non-lexical edge resolution (RESOLVES Q3 at the design level,
  2026-07-05).** Runtime-mediated hops (WebSocket/SSE wires, in-process event
  buses, stores, React context) break lexical chain-following. Resolution:
  - **Core builds the base implementation map; plugins ELABORATE it.** A
    plugin's minimum new power is adding CHANNELS — a link between an
    emit/write/publish site and its subscribe/read site (WS server↔web,
    provider→useContext, store write→read), keyed on the channel's discriminant
    (event name / message type / action type / slice) and payload contract.
    More generally a plugin may add domain "color" to the map where core cannot
    derive it. Plugins do NOT build maps wholesale — core still parses, owns all
    node/edge IDs, and does every downstream chain-follow THROUGH the
    plugin-supplied edge; the plugin supplies only the domain join-rule, core
    materializes and traverses. (Widens the R15 plugin contract from
    cases/obligations/taps/display to ALSO include graph/channel contributions.)
  - **Dark spots are marked by default; the mark is globally hideable, never
    deleted.** Where a flow's next hop cannot be traced (no plugin bridges the
    channel, or the target is genuinely opaque), the map records a DARK SPOT
    ("end of connection flow") and shows it by default. A global config toggle
    can hide dark spots visually for a repo that doesn't care — the data stays
    in the map (blind-spot honesty, D22), only the display is suppressed.
    TypeScript input/output types at the dark spot are still known, so the
    boundary shape is never lost.
  - **Package classification: curated defaults + repo list + error on the
    unknown.** Assayer ships a CURATED pre-classification of common packages
    (pure — lodash/zod/date-fns run real; io — mocked boundary) so users don't
    start from zero. The repo config maintains its own list. A newly-seen import
    on NEITHER list is a HARD ERROR the LLM must reconcile ("classify `some-sdk`
    as mock (io boundary) or real (pure)"). Keeps the mock/boundary policy (D5)
    complete without a plugin per package.
  - **When a plugin is needed vs not:** a plugin is required ONLY to (a) bridge a
    non-lexical edge, (b) richly probe/instrument an effect, or (c) supply a
    domain observation vocabulary. Everything else is a typed BLACK BOX — the
    chain terminates at its input and resumes at its typed output, no plugin and
    no dark spot beyond the ordinary boundary. (Lodash never gets a plugin.)
    **BUILT for import boundaries.** The cross-file / npm resolver realizes this
    typed black box for imports: a call to an imported name resolves to its
    definition (`local` / `package` / `builtin`), a called package or builtin
    resumes at its pulled declared signature (`{ params, returnType }` read out of
    band via the second, node_modules-aware project) — the typed output — and an
    import that resolves to nothing, or ships no usable types, is a hard BUILD
    ERROR at the call site rather than a dark spot.
  - **Instance scope:** a channel/provider/store is assumed to be a single
    module-global per token. Multiple live instances (nested providers,
    per-render stores) are a dark spot rather than fully tree-resolved.
  - **Twin contracts for one wire** (two payload contracts for the same channel)
    → refusal: reconcile to one shared contract (same canonical-model pressure
    as R10). Ambiguity is a build error, not a suppressible dark spot.

- **D25 — Plugin architecture: TypeScript is core; a layered seam/adapter stack
  enriches the base map (2026-07-05).**
  - **TypeScript analysis is CORE, not a plugin.** Core parses TS/TSX and builds
    the base map (code routing, types, data-flow, base metadata). There is no
    "language plugin" — Assayer is TS-only (R4), so the language is not a
    swappable seam. (Drops the earlier abstract-language / language-typescript
    idea.)
  - **Plugins enrich the base map in layers, each running after core:**
    - **System plugins** = execution/rendering PARADIGMS that define entry
      points and the flow model. `react` (web system), `hono` (server
      system). Multiple systems coexist in one repo (codex is both).
    - **Library plugins** = extensions within/around a system. NOT one seam —
      several seam KINDS, all running in the library layer:
      - *router* (entry enumeration): `react-router`
      - *component-library* (stable handles + interaction/observation vocab for
        vendor components whose DOM core can't see): `mantine`
      - *effect probe* (detect effect site → obligations + tap + assertion
        vocabulary + display): `redis`, `postgres`
      - *cross-system wire* (join emit↔subscribe across two systems into one
        channel): `websockets`
  - **Entry/connection points, two sources.** Core enumerates PACKAGE FUNCTION
    ENTRIES (a package's exported functions, via its exports/index) as
    connection points through pure exports analysis — no plugin needed, it is
    part of core TS processing. Framework-specific entries are plugin-supplied:
    server endpoints ← hono, browser routes ← react-router. All three are the
    SAME kind of node in the map — a place the outside enters the system, with
    effects flowing out — so flows, effects, and the verified/demanded contract
    tracking key off them uniformly. (Refines the entry-kinds glossary + D7:
    kind #3 is core; #1/#2 are plugins.)
  - **Naming — seam + adapter (existing vocabulary):** the abstract contract is
    a SEAM (web-system seam, server-system seam, effect-probe seam, …); the
    concrete implementation is an ADAPTER (react, hono, postgres, …).
  - **Plugins self-declare when they run** — "every file" or "when you see this
    syntax shape" — NOT per-plugin glob config (explicitly not the ESLint
    model). Core decides which files are dirty (change detection); the plugin
    decides whether it cares.
  - **Two-phase engine (consequence of the architecture):** per-file passes MARK
    nodes and channel ENDPOINTS; core JOINS endpoints across files/packages
    (`websockets` is the canonical cross-package join); a final pass RESOLVES
    flow/reachability/consumption over the COMPLETED graph — because cross-file
    channels complete flows no single-file pass can see. **The cross-file import
    resolver is the first concrete instance of this two-phase model:** the per-file
    walk MARKS raw `import` references + module edges (specifier value + imported
    name, never opening the other file); a post-compile stitch JOINS them across
    files/packages to canonical repo-relative definition keys (barrels followed
    with a seen-set, tsconfig-aware module resolution). Cross-file DRIVING over the
    joined graph remains a later rung.
  - **"Layer" (ordering) and "contribution kind" are separate axes.** A plugin's
    layer sets when it enriches the map; a plugin may contribute several kinds
    (map structure, channels, test-case definitions, instrumentation,
    observations). The react plugin building structure and the web test-opinions
    (blank-render leaks, list edge cases) are different jobs even if co-shipped.
  - **Plugin set to build (codex's stack):** react, react-router, hono,
    mantine, redis, postgres, websockets. Abstract seams are EXTRACTED from
    building these, not designed up-front (build-first). Other domains (e.g.
    three.js/geometry) are additional adapters on the same contracts.

- **D26 — Layered verification is a QUERY OVER THE MAPS; only its policy is
  fixable before the maps exist (2026-07-05 owner ruling; refines R19).** What
  links to what, what a change regenerates, and what may be reused vs. must
  rerun are all DERIVED FROM the implementation maps — the registry (R19) is not
  a separately-designed subsystem, it is a read over the map's cross-layer
  dependency edges. Its mechanics therefore cannot be designed before the maps.
  What CAN be fixed now (and constrains what the maps must expose):
  - **Reuse / coherence:** an upper layer reuses a lower layer's PROVEN
    (input ⇒ result + effects) pair as a stub; a stub may ONLY be a pair the
    lower layer actually proved; when the lower layer's proven set changes,
    every upper consumer of a now-stale pair breaks loudly.
  - **Both directions:** upper layers also publish what they DEMAND; a demand
    nothing lower proves is a build error.
  - **Ordering:** lower-layer suites run before the upper-layer glue that reuses
    them.
  - **Glue vs full-flow:** reuse-a-proven-pair (glue) is the default; run the
    whole chain only where an upper layer reacts to something a lower layer
    emits ASYNCHRONOUSLY (a live push, a timing-dependent reaction).
  - **"Proven"** = a passing lower-layer assertion of an input ⇒ result +
    effects pair.
  - **Forward requirement on the maps:** they must expose cross-layer dependency
    edges, entry-point input ⇒ result + effects pairs, and which entries react
    to async emissions — otherwise the registry cannot be computed. This is the
    only part of layered verification worth working before the maps exist.
- **D27 — Incremental adoption via glob-scoped enforcement (2026-07-05 owner
  ruling).** The CLI MUST support glob-based running so Assayer can be introduced
  one sub-package at a time on an existing repo. The scoping applies to ALL
  enforcement — coverage gaps, lints, AND the stray-hand-written-test detection —
  not just which tests execute; a package outside the active glob is simply
  not-yet-governed (like an uninstalled plugin), consistent with the global-
  toggle model and NOT a per-site waiver. Target-repo assumption stays npm
  packages/monorepo (D16); other monorepo shapes are a deferred scope concern.
  OPEN (Q12): whether a within-package "enforce only new/changed code" ratchet is
  also offered, so enabling a package doesn't surface its entire existing
  coverage backlog on day one.

- **D28 — Base map contents (DIRECTIONAL working model; finalized line-by-line
  in implementation, NOT frozen on paper — owner ruling 2026-07-05).** The
  per-file map is a typed data-flow + effect graph rooted at that file's
  connection points. Core (TypeScript) writes the connections; plugins
  elaborate. Directional vocabulary:
  - **Nodes:** connection points (entries + typed inputs); values (with the
    specific per-member distinctions the code makes on them); transforms
    (mutate / map / model-lookup / construct / narrow); branches & exits
    (partition a value; return/throw); effects (boundary crossings, ordered,
    plugin-owned); outputs (typed, per exit).
  - **Edges:** data-flow (value → transform → sink/effect/output); links (where
    inputs come from / where outputs + effects go — cross-file, channel, or a
    dark spot when unresolved); consumption (which downstream sites actually use
    a value). **Cross-file IMPORT links are BUILT:** the resolver reconciles each
    to a canonical repo-relative definition key (or a `package`/`builtin` target
    with its pulled signature); an import link that cannot resolve is a build
    error, not a dark spot (a channel link with no bridging plugin still is).
  The map must be QUERYABLE IN BOTH DIRECTIONS, because two concrete jobs need
  it:
  - **Arrange derivation (forward walk):** from an entry, walk the transitive set
    of things it calls plus the condition on each hop, and compute the input
    STATE STUBS needed to drive the full flow / exercise its conditions. Stubs
    are built from file-by-file usages of the data types (the distinctions each
    file makes), unioned along the flow. Requires links + per-hop branch
    conditions stored as first-class, queryable data.
  - **Consumer-demand / inverse contract (reconcile across a link):** a consumer
    that branches on a response's distinctions (e.g. a form: 200 → reads `{a,b}`,
    does X; 400 → reads `{error}`, does Y) records those distinctions as DEMANDS;
    the map reconciles them against what the producer (the endpoint) can actually
    return — "does the server return everything the web connection needs?"
    Mismatch = build error. This is the concrete grounding of the
    demanded-vs-proven pairs (D26 / R19).
  - **Pipeline (confirmed):** build full maps → on change, regen only the changed
    files' map pieces → run static PRECHECKS (build-error-style signaling) → run
    tests/etc. per the CLI command.
  The precise node/edge schema is discovered by going logic-line-by-logic-line
  with real cases during implementation; this entry is the directional target,
  not a spec.

## Tracked Questions / Constraints / Blockers (from catalog walk)

- **Q1 — Our logic vs platform behavior (dates/Intl):** where is the line between
  testing our formatting code and testing what the browser/Intl does with a
  locale/timezone? Scope of the e2e timezone matrix (which zones, which formats)?
  Raised on the date-typed JSX entry.
- **C1 — Constraint: AST data-flow chain following (same-file minimum).** A render
  sink's generated cases must include transforms applied UPSTREAM in the chain
  (filters, sorts, mutations) that live at other lines of the same file — the
  analyzer traces source → transforms → sink, not just the sink line. Cross-file
  chains: handled by per-file coverage at the module boundary (each file tests its
  own transforms), now BACKED by the import resolver — each import at the boundary
  reconciles to a canonical file-qualified definition key (repo-relative path +
  imported symbol), and `package`/`builtin` boundaries are typed by their pulled
  declared signatures, so the module boundary is a resolved, typed edge rather than
  a presumption. Cross-file DRIVING of a callee's branches through a caller remains
  a later rung. Direct consequence for the parser epic: per-line syntax scanning is
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
  (R19), explorer state presets, and generated arrange data (overridable by
  named states wired in harnesses). Salience is computed, not guessed.
  - **Scope (D22):** C3 governs EXECUTION state generation ONLY (minimal
    runnable cases). It does NOT govern the map/compendium, which enumerates
    every bounded member per-member so a new member always produces a review
    delta. The two artifacts carry opposite, decoupled shrink policies.
- **Q7 — RESOLVED BY REMOVAL (Blocker #4):** R12 accumulates many product
  surfaces (projections, ledger, semantic-diff queue, render decks, state
  explorer + flow stepping, endpoint explorer, full-stack live tracing) plus
  D14's desktop app. There is no phasing/subset — every one of these surfaces is
  core functionality, so there is no partition to rule.
- **Q8 — Public-API exemption for dead-surface rules:** the R13 unused/
  untested-prop and transitive-dead-surface flags false-positive on every
  library export (consumers outside the repo). Exemption mechanism
  (entry-point/public-surface config) undesigned. Raised in catalog
  Passthroughs; must ship WITH the rule or the rule can't ship.
- **Q6 — RESOLVED BY REMOVAL (user ruling):** there is no approval
  functionality, so approval authority is moot. The semantic diff is a review
  VIEW; the only gate anywhere is the pipeline's "do all checks pass on the
  committed changes." Humans act on diffs by directing the LLM.
- **Q3 — Non-lexical data-flow edges (PROMOTED TO BLOCKING, codex case
  study):** context Provider→useContext, store-mediated flows, AND in-process
  event buses + WS wires (`orchestrationEventsState.emit` → server handler →
  WS → web binding) break lexical chain-following. The codex session-message
  analysis showed the target repo architecture crosses two such hops in its
  core flows — R19 demanded-pair errors and C2 cross-package flow graphs
  depend on resolving this. Likely shape: declared models at bus/wire
  boundaries (event-type contract + emitter/subscriber registration as
  declarations). Must be designed before the analyzer epic is carved.
  **RESOLVED (design level, 2026-07-05) — see D24.** Shape: non-lexical edges are
  bridged by per-tech PLUGINS that elaborate the core-built map with CHANNELS
  (emit/write site ↔ subscribe/read site, keyed on discriminant + payload
  contract); core owns IDs and all traversal through the plugin-supplied edge.
  Unbridged hops become MARKED dark spots (default-visible, globally hideable,
  data retained); packages get curated/repo-listed classification with a hard
  error on the unknown; twin wire contracts are a refusal. The design assumes a single
  module-global instance per channel/provider/store. Per-tech plugin internals
  and full multi-instance/tree resolution remain implementation detail.
- **Q9 — Parallel-worker isolation & world reset (raised in the D16
  discussion, never ruled).** Full-stack e2e under parallel runners needs
  per-worker isolation (ports, store namespaces/databases, tmp dirs) and a
  fast, reliable reset-between-tests strategy per store tech (truncate vs
  re-provision vs snapshot) — "each test owns its state" at full-stack scale.
  Codex dodges via file-based tmp dirs; a postgres-backed repo can't. Likely
  home: the D16 environment contract (per-repo config), but the strategy and
  what Assayer ships vs demands are undesigned. Without it, parallel e2e is a
  flake generator. **(Owner ruling 2026-07-05: DEFERRED to implementation time —
  designed when the execution layer is built, not before epic carving.)**
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
- **Q2 — RESOLVED by D12 (as later refined by D17/D18):** tests are locked +
  auto-regenerated; manual edits/additions to generated files are build
  errors; authored surface = harness (incl. declared cases) + named states +
  config; expectations derived, never authored; false positives handled by
  GLOBAL rule toggles only.

- **Q10 — Declared state-space constraints & impossible-path flagging (RAISED
  2026-07-05, undesigned).** A user/LLM may constrain the state space (e.g. "a
  user whose email ends in bork.net can never be admin"); Assayer should then
  FLAG implementation that no legal state can reach (a dead branch / a
  contradiction between the declared constraint and the code). Open: WHERE such
  cross-field state-space constraints live (Zod refinement / D20 state-builder
  invariant / config) and the D18 tension (the constraint is an authored
  declaration an LLM can delete, taking the flag with it). Downstream of the D22
  map model. Not resolved this session.

- **Q11 — Does map-delta review stay legible at scale? (owner ruling 2026-07-05:
  not determinable on paper; validated when built.)** The safety story leans on a
  human reading map/diagram deltas. Whether that stays high-signal on a large,
  honest change (e.g. a 40-file refactor) is a build-time validation, not a paper
  design question — recorded so it is not forgotten during implementation.
- **Q12 — Within-package adoption ratchet? (raised 2026-07-05, from D27.)**
  Glob-scoping (D27) governs WHICH packages Assayer enforces; within a
  newly-enabled package, day one still surfaces that package's entire coverage
  backlog. Open: whether Assayer also offers an "enforce only new/changed code,
  grandfather the rest" ratchet for a gentler on-ramp, or whether "enable a
  package, clear its gaps" is the intended discipline.

## Open Questions (to flesh out before epics)

- **Interface contract (ACTIVE DISCUSSION — Blocker #2):** the harness
  authoring API (surface, wiring, custom-case schema — the only config format
  left, D17), the states/config schemas, and the runtime contract
  (interpreter + reporter) across the three execution contexts (see Glossary:
  unit / integration / e2e). Constrained by the artifact inventory.
- **Coverage-ID scheme (ACTIVE DISCUSSION — Blocker #3, single question):** the
  stable identifier linking a case to the testable item it covers. Current lean
  (recorded earlier in discussion): IDs derived from condition source text within
  the enclosing scope path (e.g. `processOrder/if:order.total>limit`) — survives
  reordering, breaks exactly when the logic changes, which is the desired "is the
  requirement still true?" prompt. Backend branch code is the hard case; React
  is easier. Also gates cross-file case DRIVING (C1's module-boundary EDGE
  resolution is already built — the import resolver — but arranging a callee's
  branches through a caller across a file boundary awaits this scheme).
  **Architecture ruling (user, sanity-checked): two-stage invalidation; IDs are
  map-node identities.** Pipeline: file/config content hash (cheap gate, D13) →
  rebuild maps (C2) → map DIFF (semantic gate) → test regen only on map delta.
  Consequences: coverage IDs contain NO line/position information ever — lines
  are presentation-only, resolved node→location at report time; formatting
  churn is structurally incapable of touching tests; invalidation cascades
  cross-file along C2 edges (enum change regens consumers' maps without their
  hashes changing). What remains hard: MAP-NODE CORRESPONDENCE across
  generations (changed node vs deleted+added) — the churn matrix below now
  applies to map diffing, not source text.
  **Correspondence mechanics (user-designed; PURPOSE REVISED by the no-fills
  ruling): three-bucket matcher + git as evidence, not identity. Correspondence
  now serves DIFF-VIEW QUALITY ONLY — no committed data migrates.**
  - Map-vs-map diff with exact-match nodes as anchors. Buckets: (a) exact
    node-key match → unchanged, shows NOTHING in the delta; (b) unambiguous
    1:1 correlation within a changed region → shown as a MODIFIED node;
    (c) ambiguous → the region is shown as an old-vs-new block — bounded,
    well-presented uncertainty IS good diff output, not a matcher failure.
    The churn matrix grades how often common edits land in (a)/(b) — i.e.
    diagram-delta signal-to-noise, which D18 makes a core product property.
  - Git integration: line-hunk mapping and git rename/similarity detection are
    CORRELATION HINTS for bucket (b) (and cross-file moves) — never identity
    (formatting produces hunks with no map change; working-tree edits
    accumulate between commits).
  - Old maps are NEVER persisted: determinism (same content ⇒ same map) means
    any historical map is recomputed on demand from the git blob at the
    reference commit. Cache stays disposable.
  - ONE "old" anchor: the resolved comparison ref (D15: merge-base locally,
    explicit in pipeline, arbitrary ad-hoc). No fill-migration anchor exists —
    fills don't. Branch isolation is free: authored artifacts (harnesses,
    states, config) are committed and travel with the branch, and diffs anchor
    to merge-base — never a sibling branch.
  **Acceptance rubric — the churn matrix (REPURPOSED: grades diff-view
  signal-to-noise, since no committed data migrates).** Walk these
  implementation-change scenarios on paper; required outcome per scenario is
  now about what the DIAGRAM DELTA shows (nothing / a clean modified node / a
  clean old-vs-new region — never noise, never a silently-absorbed semantic
  change):
  1. Formatting/whitespace-only change → delta shows NOTHING (IDs must not
     hash raw text).
  2. Sibling branch added → delta shows exactly one new node.
  3. Branches reordered → delta shows NOTHING.
  4. Condition edited (`>limit` → `>=limit`) → delta shows that node modified,
     old vs new condition.
  5. Variable renamed within a condition → DECIDE: nothing (C2 rename
     tracking) or modified-node; pick one and justify.
  6. Function renamed (scope path changes) → DECIDE: nothing (symbol tracking)
     or a rename-suggested delta.
  7. Logic extracted to a same-file helper → delta shows a move, not a
     delete+add pair.
  8. Logic moved to another file → delta shows a cross-file move suggestion.
  9. Consumer changes while producer doesn't → producer's subgraph shows
     NOTHING; only consumer nodes delta.
  10. Identical condition text at two sites in one scope → cache-internal IDs
      still unique (disambiguation rule needed).
- **E2E arrange model (largely answered by D20; confirm the residue):** e2e
  arrange = realize the semantic state through real channels (read-path
  inversion → probe seeders → entry-API creation → builders) + navigate; props
  EMERGE from the real app. Unit arrange = the SAME state realized as derived
  mock-boundary feeds. One semantic state, two derived realizations — the
  schema holds one state reference, not two arrange expressions.
- (Router question RESOLVED by D7: pluggable seam, initial set = react-router + express
  + hono; only the non-static-routes manifest escape hatch remains tabled.)
