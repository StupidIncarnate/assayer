# Assayer — Feature Buckets (system-level inventory)

> Status: planning artifact, drafted 2026-07-04 from `plan/requirements.md`
> (authoritative), `plan/expectation-catalog.md`, and `plan/case-studies.md`.
> This document answers ONE question: **what are all the big pieces that must
> exist** for Assayer to be Assayer. Buckets are functional systems, not epics,
> not implementation plans, and carry no sequencing. Cross-references are to
> requirements.md items (P#/R#/C#/D#/Q#); the COVERAGE CHECKLIST at the end
> maps every tracked item to its owning bucket(s).
>
> Current-model invariants every bucket honors (per requirements.md rulings):
> tests are generated from execution maps derived off the implementation —
> never authored, never committed; committed artifacts are ONLY source +
> harnesses + named states (`assayer/states/`) + config + repo-local plugins;
> expectations DERIVE from inputs/source literals/declared models/consumer
> demands (no "fills"); there is NO approval workflow — diffs are ref-to-ref
> views and the only gate is pipeline pass/fail; there are NO per-site waivers
> — only global rule/obligation toggles in config; ALL rules/opinions ship in
> discipline and per-tech PLUGINS (core is engine-only); map-node IDs are
> cache-internal and never key any committed artifact; the human's review
> channel is high-level flow-diagram DELTAS (D18).

Layer overview:

| Layer | Buckets |
|---|---|
| Foundation | Configuration Subsystem · Plugin System & Seam Contract · Cache Subsystem · Git Integration · Init & Onboarding · Diagnostics & Error Rendering (NEW) |
| Analysis | AST Analyzer Core · Repo Graph Builder · Entry-Point & Route Resolution · State Data System |
| Enforcement | Rule & Obligation Engine · Coverage Enforcement |
| Derivation & Execution | Harness System · Test Case Derivation & Assembly · Contract Registry & Layered Verification · Interpreter & Wrapped Runners · Environment Orchestration & Smoketest · Effect-Chain Instrumentation · Run Diagnostics & Artifact Capture |
| Comparison | Ref-to-Ref Semantic Diff Engine |
| Surfaces | Review Projections & Observable Ledger · Interactive Explorers · CLI · Desktop App · LLM Docs Surface |
| Meta | Fixture-Repo QA Infrastructure |

---

## Foundation layer

### 1. Configuration Subsystem

The loader/validator for `.assayer/config` — the single committed home for
every repo-wide declaration Assayer consumes: the environment contract,
plugin registrations with their required connection configs, mock policy,
interaction policies, rule selections/severities, and the global don't-cares
(the ONLY "deliberately unmet" mechanism in the whole system — per-site
waivers do not exist). Config is data the rest of the system reads; a config
change is a headline event in the semantic diff, never a silent knob.

Main capabilities:
- Parse + schema-validate `.assayer/config` at load with P1-grade errors
  (missing plugin connection fields, unknown keys, bad scopes).
- Hold the D16 environment contract: processes, launch commands, readiness
  checks.
- Hold plugin registrations; an unconfigured/unregistered plugin is INVISIBLE
  (no obligations, no taps, no logs — D16 gating).
- Hold D5 per-boundary mock policy defaults + scoped overrides as data.
- Hold R14 interaction policies (repo default + per-section overrides).
- Hold R2 rule selections and severities (off/warn/error) per obligation kind
  within installed plugins — the global don't-care surface.
- Hold the rare global runner controls admitted by R1's escalation ladder
  (e.g. one global timeout detail) — never per-test knobs.
- Hold entry-point/public-surface exemption config for dead-surface rules
  (Q8 — mechanism undesigned, but this is its home).
- Contribute the config hash to cache keys (D13).

Expected shape (illustrative — real schema is Blocker #2 material; added
pass 3c):

```jsonc
// .assayer/config
{
  "environment": {                          // D16 — Playwright-webServer-style
    "processes": {
      "server": { "launch": "npm -w packages/server run start:test",
                  "ready": { "httpGet": "http://localhost:4310/health" } },
      "web":    { "launch": "npm -w packages/web run dev:test",
                  "ready": { "httpGet": "http://localhost:5173" } }
    }
  },
  "plugins": {                              // registration = declaration of care (R17/D16)
    "@assayer/web":            { "obligations": { "delay-on-key": "off" } }, // global don't-care
    "@assayer/probe-postgres": { "connection": { "host": "localhost", "port": 5432,
                                 "user": "test", "database": "app_test" } }, // required fields, P1 on missing
    "@assayer/router-react-router": {},
    "./.assayer/plugins/threejs-probe": {}  // repo-local, same contract
  },
  "mockPolicy": {                           // D5 as data
    "defaults": { "unit": "mock-all-io",
                  "e2e": { "stores": "real", "external": "mock" } },
    "boundaries": { "openai": { "e2e": "mock" } }
  },
  "policies": {                             // R14 — scoped interaction policies
    "forms": { "default": "standard-submit-lifecycle",
               "sections": { "packages/web/src/admin/**": "admin-forms" } }
  },
  "rules":  { "severities": { "@assayer/web/leaked-render": "error" } },
  "runner": { "globalTimeoutMs": 30000 },   // R1 ladder step 2 — the ONLY knob shape allowed
  "publicSurface": ["packages/shared/src/index.ts"]   // Q8 home
}
```

Property reference (illustrative ranges; the binding schema is Blocker #2):

| Property | Purpose | Values / range |
| --- | --- | --- |
| `environment.processes.<key>` | One launchable process; `<key>` is a user-chosen name referenced by smoketest/errors | object per process |
| `…​.launch` | Shell command Assayer spawns (it owns launching — D16) | any command string, run from repo root |
| `…​.ready` | Readiness probe polled before tests/explorer proceed | one of `{httpGet: url}` \| `{port: n}` \| `{logLine: regex}` |
| `plugins.<id>` | Registers a plugin; PRESENCE = caring about its discipline/tech (D16 gating). `<id>` = package name or repo-local path | `{}` = defaults; else plugin-schema'd object |
| `…​.connection` | Probe's required reach-the-real-thing fields | plugin-defined; missing required field = P1 config error |
| `…​.obligations.<kind>` | THE global don't-care surface — per-obligation toggle within the plugin | `"on"` (default) \| `"warn"` \| `"off"` — no per-site form exists |
| `mockPolicy.defaults.unit` | Unit-mode boundary treatment | only `"mock-all-io"` (by design — no looser option) |
| `mockPolicy.defaults.e2e` | E2E-mode split | `{stores: "real"\|"mock", external: "mock"\|"real"}`; default real/mock |
| `mockPolicy.boundaries.<name>` | Per-boundary override; `<name>` = probe-declared boundary id | `{unit?: "mock", e2e?: "mock"\|"real"}` |
| `mockPolicy.classify.<import>` | D5 classification for probe-less third-party imports | `"io"` (boundary, mocked in unit) \| `"pure"` (always real) |
| `policies.<family>.default` | R14 interaction policy applied repo-wide | name of a plugin-shipped or repo-declared policy |
| `policies.<family>.sections` | Per-section policy override | glob → policy name |
| `rules.severities.<ruleId>` | Severity tuning for any rule from any installed plugin | `"off"` \| `"warn"` \| `"error"` |
| `runner.globalTimeoutMs` | The ONLY runner knob (R1 ladder step 2), repo-global | positive integer ms |
| `publicSurface` | Q8 exemption: exports consumed outside the repo (dead-surface rules skip them) | array of entry-file paths/globs |

(`mockPolicy.classify` added to match D5's classification rule.)

Named state (one file per state, name = user-chosen key):

```jsonc
// assayer/states/bear-model.json
{ "kind": "threejs-model",     // plugin-interpreted kind
  "data": { /* the hand-authored fixture C3 can't generate */ } }
```

| Property | Purpose | Values / range |
| --- | --- | --- |
| filename | THE state's name — the stable key harnesses wire by | user-chosen, kebab-case |
| `kind` | Which plugin/vocabulary interprets `data` | any kind an installed plugin registers (unknown kind = P1 error) |
| `data` | The fixture payload | arbitrary JSON valid for `kind` |

Builder states (`assayer/states/*.state.ts`) export a parameterized function
instead; its output contract (consumable by BOTH realizers) is an open
Blocker-#2 item.

Cross-references: implements R14 (policy storage), R20 item 2; constrained by
D5, D16, D13, R1 (escalation ladder), R2, R17 (toggles-within-plugins), Q8;
artifact inventory item 6; the no-per-site-waiver ruling (Glossary).

Dependencies: Diagnostics & Error Rendering. (Consumed by nearly every other
bucket.)

### 2. Plugin System & Seam Contract

One plugin API — the seam-plus-adapters pattern, defined once and instantiated
per domain — through which ALL opinions enter the system: effect probes,
discipline rule packs, router adapters, form-library adapters, observation
vocabularies. Core declares abstract vocabularies and owns traversal; plugins
supply detection and observation/instrumentation. This is the owner-named
"plugin management" piece plus the contract those plugins implement.

Main capabilities:
- The R15 EffectProbe contract — up to four members, phase-callback-shaped
  (shape implied by R15):

  ```
  { detect,   // syntax subscription; core calls back per match site,
              // phase-keyed: test-generation | instrumentation | display
              // | lint/rule | projection
    tap,      // runtime instrumentation → structured trace events
    observe,  // closed assertion vocabulary, R11-layered, with comparators
    display } // optional chain-log rendering (defaulted)
  ```

  | Member | Purpose | Shape / range |
  | --- | --- | --- |
  | `detect` | Syntax SUBSCRIPTION — patterns of interest; core owns traversal and calls back per match site, phase-keyed | patterns: import/call/JSX matchers; callbacks per phase: `test-generation` \| `instrumentation` \| `display` \| `lint/rule` \| `projection`, each returning that phase's contribution (cases/obligations, tap wiring, log entry spec, lint finding, projection node) |
  | `tap` | Runtime hook emitting structured trace events as effects happen | events: `{kind, label, payload, timing, correlationId}`; injected at boot (D16) |
  | `observe` | The assertion vocabulary this probe contributes (what cases may assert about its effects) | named observations + layer (R11) + comparator set (exact / declared-tolerance); scene vocabularies MUST include settlement observations |
  | `display` | How trace events render in the live chain log / detail views | OPTIONAL — label template + payload summarizer + severity; defaulted from the event when omitted |
- Discipline plugins (`@assayer/web`, `@assayer/cli`, …) carrying bucket-A
  rule sets, R13 lint families, and their domain obligation checklists;
  installing a plugin IS the declaration of care (R17).
- Per-tech adapter packages: router adapters (D7: react-router, express,
  hono for v1), form-lib adapters (R14), domain observation vocabularies
  (R11 — e.g. three.js), probe packages that SHIP their payload corpora and
  obligation checklists.
- Layer vocabularies define their COMPARATORS (exact for dom/request/
  computed-value; declared-tolerance for geometry/perf) and MUST ship
  settlement observations for canvas/scene worlds (R11).
- Repo-local plugins in `.assayer/plugins/` (committed) — same contract as
  published packages, no second-class path.
- Plugin validation: schema-check the shape, dry-run against a fixture,
  P1-grade errors — a wrong plugin is a build error the LLM iterates on.
- Core↔plugin version compatibility enforcement (peer ranges, P1-grade
  mismatch errors).
- LLM-authorability as a contract property: small, declarative, authorable
  from `assayer docs` alone (R15).

Cross-references: implements R15, R17, D7 (adapter side), R11 (vocabulary/
comparator/settlement side), R14 (adapter side), R2 (rules as plugins);
constrained by D16 (config-gated participation), P3 (no framework
prerequisite), Q4 (db probe obligation family TO-FILL); catalog Bucket A is
the discipline-plugin backlog.

Dependencies: Configuration Subsystem, AST Analyzer Core (delivers the
detect callbacks), Effect-Chain Instrumentation (hosts taps), Diagnostics &
Error Rendering, LLM Docs Surface (authoring docs + worked example).

### 3. Cache Subsystem

`.assayer/cache/` — the gitignored, disposable, content-hash-incremental home
of everything derivable: maps, repo graphs, assembled test artifacts, the
registry, run artifacts, projections, derived state presets. Determinism is
the load-bearing property: a cold cache reproduces byte-identical artifacts,
so cache loss is never a correctness event and CI persistence is purely an
accelerator.

Main capabilities:
- Content-hash keys over every derivation input: file contents, Assayer
  version, plugin versions, config (D13).
- Two-stage invalidation (coverage-ID ruling): content hash (cheap gate) →
  map rebuild → map DIFF (semantic gate) → test regen only on map delta.
- Invalidation cascades along C2 dependency edges (impact analysis doubles
  as invalidation) — enum change regens consumers' maps without their hashes
  changing.
- Per-content-hash entries let multiple refs' maps coexist; historical maps
  are never persisted — recomputed on demand from git blobs.
- Total, free regeneration (D10): nothing committed keys on cache content;
  map-node IDs live and die inside one cache generation.
- Pipeline persist/restore between runs as optimization only (D15).

Cross-references: implements D13, D10, the cache half of the artifact
inventory; constrained by D15, the coverage-ID blocker (two-stage pipeline),
the map-node-ID cache-internal ruling.

Dependencies: Configuration Subsystem (config hash), Git Integration (blob
access for ref-keyed recompute), Repo Graph Builder (invalidation edges).

### 4. Git Integration

The subsystem that makes "any ref" a first-class input: ref resolution for
diffs, recomputation of maps from arbitrary git blobs, worktree provisioning
for runtime visual diffs, similarity hints for map correspondence, and the
optional hook installs. Git is evidence and transport — never identity, never
a correctness mechanism.

Main capabilities:
- Ref resolution per D15: local/LLM runs default to merge-base with the
  default branch; pipeline runs take explicit base/head; ad-hoc arbitrary
  ref A vs ref B; no implicit comparison on the default branch itself.
- Read source at any ref (blobs) so the analyzer can derive that ref's maps
  on demand.
- Worktree provisioning at arbitrary refs for the runtime visual diff
  (Environment Orchestration boots them; the diff engine orchestrates the
  capture-and-compare — R12).
- Line-hunk mapping and git rename/similarity detection supplied to the diff
  engine as CORRELATION HINTS for bucket-(b) correspondence — never identity.
- Optional husky post-merge/post-checkout cache warmers that surface the
  fresh semantic-diff view (D13/R20 item 5) — latency only, never
  correctness.
- `.gitignore` management for `.assayer/cache/` (written by init).

Cross-references: implements the git mechanics of D15 and the coverage-ID
correspondence hints; constrained by D13 (hooks are warmers only), R12
(visual diff boots both refs), R20 item 5; branch-isolation property of R12.

Dependencies: Cache Subsystem. (Environment Orchestration & Smoketest boots
the worktrees this bucket provisions.)

### 5. Init & Onboarding

`assayer init` — everything the R20 tracked list demands, turning a bare
TypeScript repo into an Assayer-governed one without manual plugin assembly.

Main capabilities:
- Create the home layout: `.assayer/` (config, plugins/) + `assayer/states/`
  + `.assayer/cache/` with the gitignore entry (D13 layout).
- Scaffold `.assayer/config`: scopes, mock policy defaults, R14 policies,
  plugin registrations.
- Tech detection: scan package.json(s) across the monorepo, install + wire
  matching plugin packages (probes, form adapters, router adapters) — R17's
  "nobody assembles the plugin set by hand."
- Install the LLM session prehook (SessionStart-style): how Assayer governs
  tests here, where authoring info lives (`assayer docs`), the cardinal
  rules. Content ships with the package and versions with it.
- Offer (not require) the git warmer hooks.
- Initial derivation: build first maps/graphs, present projections +
  coverage report as onboarding output. No approval step — gaps surface as
  ordinary coverage errors.

Cross-references: implements R20 (all items), the init halves of R17 and D2;
constrained by D13 (layout), D16 (v1 monorepo scope assumption), R18 (prehook
points at docs).

Dependencies: Configuration Subsystem, Plugin System & Seam Contract, AST
Analyzer Core + Repo Graph Builder (initial derivation), Review Projections &
Observable Ledger (onboarding output), LLM Docs Surface (prehook content),
Coverage Enforcement (initial gap report).

### 6. Diagnostics & Error Rendering (now recorded as R22)

A single shared subsystem for composing and rendering P1-grade errors.
requirements.md states the STANDARD everywhere (P1: every failure precise,
actionable, naming what/where/what-would-satisfy; the case studies set the
exact-string quality bar); R22 names this as the owning system — every bucket
emits errors through it so the register stays uniform (errors are the LLM's
corrective instruction surface).

Main capabilities:
- Error shape: mechanism + site + evidence + satisfying action ("observable X
  (layer: rendered-geometry) has no verification at or past the mesh layer").
- Nudge support (P3): errors may suggest modeling ("declaring Record<Status,
  Meta> would derive these N tests") without requiring it.
- Did-you-mean rendering for load-time validation ("unknown interaction
  `clickAprove`, did you mean `clickApprove`").
- Consistent rendering across CLI, desktop, and reporter output.

Cross-references: implied by P1 (register), R21 (run-failure text), D17
(load-time validation quality), R15 (plugin validation errors), case-studies
"When writing P1 error text".

Dependencies: none (leaf; consumed by all error-emitting buckets).

---

## Analysis layer

### 7. AST Analyzer Core (execution-map builder)

The owner-named "AST processor of implementation code to build maps."
Parses TypeScript/TSX via the TypeScript Compiler API and builds, per source
file, the execution-roadmap map of testable nodes per rule config. Core owns
ALL traversal, chain-following, and node-ID assignment; plugins never parse —
they subscribe to syntax patterns and get phase-keyed callbacks at match
sites. Detection keys off type-graph facts, never conventions.

Main capabilities:
- Per-file execution maps: branches, render sinks, handlers, effect sites,
  boundary crossings — the testable-node inventory R3 enforces against.
- Intra-file data-flow chain following (C1): source → transforms → sink,
  including purity-boundary detection (default params, `??`, wrapping,
  rebinding, narrowing hops) per the catalog's Passthroughs rules.
- Effect enumeration for handlers and endpoints (every side effect becomes a
  required observation and a flow-projection node).
- Plugin syntax subscriptions: call registered plugins back at match sites,
  phase-keyed (test-generation / instrumentation / display / lint / projection).
- Map-node ID assignment: derived from condition source text within scope
  path, NO line/position info ever, cache-internal only, disambiguation for
  identical text at two sites (churn-matrix scenario 10). Grammar still to
  be designed (Blocker #3).
- Graceful degradation by tier (P3): declared-as-data semantics → tier-2
  inputs; imperative literals → tier-1 branch skeletons, with nudges.
- Graceful handling of unparseable files (partial results, clear context).
- TypeScript only (R4).

Cross-references: implements the detection substrate of R2, C1, R4, the
detect phase of R15, map generation in the artifact inventory (cache item 1);
constrained by P3, D10 (wholesale regeneration), the coverage-ID blocker, the
map-node-ID cache-internal ruling.

Dependencies: Configuration Subsystem (rule config), Plugin System & Seam
Contract (subscriptions), Repo Graph Builder (type facts; mutually coupled —
the analyzer also feeds it), Cache Subsystem, Diagnostics & Error Rendering.

### 8. Repo Graph Builder (C2 graphs)

Materializes the two persistent, queryable repo-level graph artifacts that
the whole system references — not ad-hoc queries. This is where Q3
(non-lexical edges — v1-blocking) must be designed: event bus, WS, stores,
and context hops break lexical chain-following, and the target repos' core
flows cross them.

Main capabilities:
- **Type/contract graph ("mind map"):** Zod + TS meta-analysis over types,
  interfaces, contracts, unions, `Record<Union, Meta>` maps and their
  relationships. Feeds case generation, explorer/state presets, coverage
  IDs, plugin callbacks, projections.
- **Bidirectional data-flow graph:** forward source → transforms → exit (C1)
  AND reverse exit → sources, mutation/rebinding annotated. Powers arrange
  derivation (what to seed so data funnels to a sink), IMPACT ANALYSIS
  (change → affected cases/observables → diff precision + targeted re-runs +
  cache invalidation), orphan diagnostics naming the broken hop.
- Cross-module consumption/liveness analysis (C1 scope split): whole-graph
  reachability for dead-surface flags; transform-case generation stays
  per-file.
- Taint tracking for security obligations (sink detection, sensitive-field
  egress — catalog R8 section).
- Q3 design home: declared models at bus/wire boundaries (event-type
  contract + emitter/subscriber registrations) so chains cross non-lexical
  hops.

Cross-references: implements C2, the cross-module half of C1; constrained by
Q3 (v1-blocking, undesigned), P3 (type-graph detection), D13 (invalidation
consumer); powers C3 and R19 pair derivation.

Dependencies: AST Analyzer Core, Cache Subsystem, Configuration Subsystem.

### 9. Entry-Point & Route Resolution

Enumerates the system's entries at the three seam kinds — web routes
(URL → component), server routes (endpoint → responder), package function
entries (exported fn with effects) — via pluggable per-tech router adapters,
and ties browser state to component entry points so e2e knows where to
navigate and which harness chain reaches the code under test.

Main capabilities:
- Client router parsing (react-router first): URL ↔ component entry points →
  D6 reachability chains down the import graph through all potentially
  rendered components.
- Server route framework parsing (express, hono): endpoint enumeration →
  route → responder/handler chain, powering backend-e2e obligations
  ("every endpoint has coverage"), endpoint-explorer lists, flow-projection
  entry mapping.
- Package entry enumeration (exports analysis / declared entry manifest) —
  entry kind #3.
- Manifest escape hatch for non-statically-analyzable routes: tabled, but
  the seam belongs here.

Cross-references: implements D6, D7, the entry-kinds glossary item; feeds
R19 (entries are the seams), R12 (endpoint explorer list), R7 (chain
targets); adapters ship per R17.

Dependencies: AST Analyzer Core, Repo Graph Builder, Plugin System & Seam
Contract (router adapters).

### 10. State Data System (C3 generation + named states)

The test-data theory made operational: computed salient state matrices per
entry, plus the committed, hand-authored named-state store that overrides
them where auto-generated data isn't good enough. Salience is computed, not
guessed; names are user-chosen, never node IDs.

Main capabilities:
- Consumption-partitioned salient-state computation (C3): per entry,
  enumerate the reachable output-state space from the AST, shrink by
  consumer care (per-call-site projections; field domains partitioned by
  consuming conditionals; one representative per equivalence class).
- Randomized representative fill for fields nothing branches on (provably
  don't-matter values).
- Derived state presets in cache feeding explorer state lists, needed-state
  gap reports, registry pair inventories.
- Named states (`assayer/states/`): committed fixtures keyed by USER-CHOSEN
  NAMES — static JSON plus `.state.ts` parameterized BUILDERS for state
  families with internal invariants (D20). Harnesses wire them by name.
- Mode-polymorphic realization (D20 — the arrange-side crosser): one semantic
  state materializes as derived mock-boundary feeds in unit (call-order and
  sinks derive from the chain — no hand-queued mocks, no hand-written
  inspectors) and as real writes in e2e (read-path inversion via the reverse
  map → probe seeders → entry-API creation → builder gap-fill, lint-invoiced).
- Gap visibility: the UX shows which states each test uses and what exists
  globally.
- Narrowed-domain propagation: downstream case generation uses domains
  narrowed by upstream guards (no impossible cases below a clamp).

Cross-references: implements C3, artifact inventory committed item 3 and
cache item 6; feeds R9 tier-1 arrange data, R19 pair inventories, R12
explorer state lists; constrained by the no-node-ID-keys ruling, D17
(states are data, name-keyed).

Dependencies: Repo Graph Builder, AST Analyzer Core, Cache Subsystem;
Harness System wires named states in.

---

## Enforcement layer

### 11. Rule & Obligation Engine

ONE engine with three output kinds: **obligations** ("you owe test case X at
site Y" — R8 shipped-categorical, R14 user-declared), **lints** ("this
implementation pattern is banned/must-change" — R13), and **refusals** ("this
state of code is an error no test can fix" — R10). All rule content arrives
via plugins; core ships the engine, not opinions. Every kind is globally
toggleable/severity-configurable — that global config IS the only don't-care
mechanism.

Main capabilities:
- Rule evaluation over maps + graphs, emitting obligations/lints/refusals
  with P1-grade errors naming the uncovered obligation at the detected site.
- R8 categorical obligations from discipline/probe plugins: injection cases
  at taint sinks (with plugin-shipped payload corpora), perf cases at
  declared-scale extremes, N+1 call-count obligations, auth obligations.
- R14 policy expansion: user-declared interaction policies (forms first),
  bound to abstract vocabularies, expanded to obligations for EVERY detected
  instance; scoped repo-default + per-section.
- R13 companion lint families: leaked-render, date/format, dead contract
  surface, spread-opacity, shared-reference mutation, perf-risk syntax,
  foreign-test-infrastructure (stray raw test files / runner configs — the
  LLM's trained bypass, caught as a build error; step-4 addition) —
  shipped inside discipline plugins, every rule toggleable.
- R10 refusals: duplicate-enumeration of union members, twin contracts,
  string-built queries — ambiguity itself is the build error; refusal beats
  testing.
- Checklist ratchet (R12): every manually-caught defect class becomes a new
  rule/obligation/lint; custom rule authoring must be easy (the human's
  personal offload path).
- Q8 public-API exemptions consumed from config so dead-surface rules can
  ship without false-positiving on library exports.
- Q4 split (db: lint callout vs generated case) lands here when ruled.

Cross-references: implements R2, R8, R10, R13, R14 (engine side), the
rule-engine glossary item; constrained by P3 (implementation-side rules
only; test-side rules are unrepresentable by schema instead), Q4, Q8, the
global-toggle-only waiver ruling; rule content arrives per R17.

Dependencies: AST Analyzer Core, Repo Graph Builder, Plugin System & Seam
Contract, Configuration Subsystem, Diagnostics & Error Rendering.

### 12. Coverage Enforcement

The build-gate: per source file, compare what the map says should be covered
(per rule config) against what the assembled cases + harness-declared cases
actually cover, and error like a build error on any gap. Continuous, not
one-time — its purpose is catching new/changed code written after tests
existed. Also owns the layer-satisfaction check and cross-layer coverage
arithmetic.

Main capabilities:
- Map-vs-cases reconciliation per file; uncovered testable node = named
  build error (R3).
- Obligation discharge tracking: every emitted obligation must have a
  covering case or fail the build.
- R11 layer satisfaction: an observable is only satisfied by an assertion at
  its layer or downstream; upstream tests support but never discharge —
  build error names the missing layer.
- "Already covered, don't rerun" as set arithmetic over the registry (R19),
  not judgment.
- No representable skip (D12): coverage cannot be silenced per-site; the
  only outs are global rule toggles (headlined in the diff) or code change.
- Coverage delta feeds the semantic diff report.

Cross-references: implements R3, the satisfaction rule of R11, the
accounting claim of R19; constrained by P1 (error quality), D12 (no skip,
no per-site suppression), the global-toggle ruling.

Dependencies: AST Analyzer Core (maps), Test Case Derivation & Assembly
(assembled cases), Harness System (declared cases), Contract Registry &
Layered Verification (cross-layer accounting), Rule & Obligation Engine
(obligations), Diagnostics & Error Rendering.

---

## Derivation & Execution layer

### 13. Harness System (REVISED per D19: derived surface + sparse gap-fill)

The surface (interactions + observations + readiness) is DERIVED by the
analyzer + plugins from the implementation itself — selectors/testids/text
from JSX, interactions from handlers, readiness from the guards gating them.
A harness file (`*.harness.ts`, colocated) exists ONLY where derivation
provably fails, and every entry in it is invoiced by a harness-completeness
lint error naming exactly what's needed. It remains the only authored code
artifact — there's just far less of it. Its authoring API is Blocker #2.

Main capabilities:
- DERIVED surface as the default (D19): no hand-written interactions/
  observations/readiness for anything the AST already contains.
- Harness-completeness lint: derivation gaps become "need this, add this"
  errors with implementation-first remedies (add data-testid > declare
  override; expose a handle hook > declare canvas interaction).
- Cross-component handle derivation (D19): wrapper components' prop →
  testid-attribute chains resolve via C1 at arbitrary depth (incl. template
  transforms) — consumers of `<Button name="approve">` derive `btn-approve`
  with no local testid.
- Third-party component resolution (D19 escalation): component-library
  adapter plugins (vendor interaction/observation contracts) → wrap-with-
  handle lint (converts to the wrapper case) → harness override last.
- Gap-fill entries (the authored residue): non-DOM interactions
  (canvas/scene/gesture), selector overrides where implementation can't carry
  a handle, unit-only/e2e-only overrides where the derived intersection is
  wrong (D4, validated at load time — D17).
- Correlation bindings: control ↔ affected-region declarations that give
  R11 perturbation obligations their concrete grip (the amalga catch).
- Named-state wiring: import committed states by name to override generated
  arrange data per-test or globally.
- CAPTURE as an observation kind (screenshot / scene render) powering render
  decks and the runtime visual diff — no baselines ever stored.
- Config-shaped custom cases (declarations): closed-vocabulary act/assert
  structures against the surface — NEVER raw asserts, NEVER raw runner
  controls; per-mode instructions supported; named with user-chosen stable
  names so they appear in ledger and diffs. Rare by design (D18) — they
  exist only where no code anchor supplies the truth.
- Harness composition: chained along the import graph (parent → child) so
  testing can target one thing versus another (R7), from route entries down
  (D6).
- Load-time validation of everything harness-declared against the derived
  surface, with did-you-mean errors; stale surface references are the only
  "orphan" left (D10).

Expected shape (illustrative — the authoring API IS Blocker #2; added pass 3d):

```ts
// lid-controls.harness.ts — GAP-FILL ONLY (D19): derivable members (a plain
// button click, a testid'd render sink, guard-derived readiness) NEVER appear
// here — the analyzer derives them. Every entry below answers a specific
// harness-completeness lint error.
export default defineHarness({
  surface: {
    interactions: {
      dragLidHandle: {                                 // canvas-bound: underivable from JSX
        run:   (h) => h.scene.dragHandle('lid-handle', { dx: 0, dy: 40 }),
        ready: (h) => h.scene.handleGrabbable('lid-handle')
      }
    },
    observations: {
      socketOcclusion: (h) => h.scene.occlusion('socket-region'), // plugin vocabulary
      capture:         (h) => h.scene.render('front-3q')          // CAPTURE → decks/visual diff
    }
  },
  correlations: [{ control: 'lid-handle', affects: 'socket-region' }],
  // ^ invoice: "correlation not visible in code" (R11 perturbation grip)

  states: {
    wire: {
      // invoice: "needed-state gap" — C3 can't build these
      'renders-max':   'bear-model',                    // static JSON state
      'replay-nested': { builder: 'nested-session',     // .state.ts BUILDER (D20):
                         with: { depth: 2,              // parameterized state FAMILY
                                 completed: [true, false] } } // w/ format invariants
    },
    realize: {
      // The arrange-side crosser (D20). UNIT realization is NEVER declared —
      // always derived (mock-boundary feeds from the chain). Declare e2e ONLY
      // on invoice: "e2e realization underivable" (read-path inversion, probe
      // seeders, and entry-API creation all failed):
      'replay-nested': { e2e: (h, state) => h.fs.writeFiles(state.files) }
    }
  },

  cases: [                                             // declarations — ONLY no-code-anchor truths (D18)
    { name: 'live-reload-parity', mode: 'e2e',
      steps: [
        { act: 'streamFixture', with: { state: 'replay-nested' } },
        { observe: 'entrySequence', as: 'live' },
        { act: 'coldReload' },
        { observe: 'entrySequence', equals: '@live' }  // closed vocabulary; never raw asserts
      ] }
  ]
});
```

Anatomy summary (each section ↔ its invoicing lint): `surface` ↔ underivable
interaction/observation (canvas/gesture/vendor); per-mode member overrides ↔
wrong derived intersection (D4); `correlations` ↔ link not visible in code;
`states.wire` ↔ needed-state gap; `states.realize.e2e` ↔ e2e realization
underivable (unit never appears here); `cases` ↔ no-code-anchor truth. A
harness with no invoiced gaps does not exist as a file.

Property reference (illustrative; binding schema is Blocker #2):

| Property | Purpose | Values / range |
| --- | --- | --- |
| `surface.interactions.<name>` | A semantic DO the analyzer couldn't derive; `<name>` = user-chosen verb, referenced by cases/diffs | object with `run` and/or per-mode impls |
| `…​.run` | Shared implementation used by every mode lacking an override | `(h) => …` using ONLY the wrapped `h.*` vocabulary (R1) |
| `…​.unit` / `…​.e2e` | Per-mode override when one shared impl is wrong (D4); a dual-mode case may reference the member only if BOTH modes resolve | same signature as `run`; omit = use `run` |
| `…​.ready` | Semantic readiness gate — interaction is a silent no-op until true (flake-killer) | `(h) => boolean` predicate |
| `surface.observations.<name>` | A semantic READ the analyzer couldn't derive | `(h) => value`; return type must fit the layer's comparators (exact for dom/request, tolerance for geometry/perf — R11) |
| `surface.observations.capture` | Reserved kind: produces an image/render for decks + runtime visual diff | `(h) => capture` via plugin vocabulary |
| `correlations[]` | Control ↔ affected-region link invisible in code; feeds R11 perturbation obligations | `{control: interaction/handle name, affects: observation/region name}` — both must resolve against surface/plugin vocabulary |
| `states.wire.<key>` | Overrides generated arrange data with a named state; `<key>` addresses a case family (grammar OPEN — Blocker #2) | state filename \| `{builder: name, with: params}` |
| `states.realize.<stateKey>.e2e` | Declared e2e writer when derivation escalation failed; UNIT KEY IS ILLEGAL (always derived) | `(h, state) => void` using wrapped write vocabulary |
| `cases[].name` | Stable user-chosen id — appears in ledger, diffs, errors | unique string per harness |
| `cases[].mode` | Execution context(s) for this declared case | `"unit"` \| `"integration"` \| `"e2e"` (single owner default, R6) |
| `cases[].steps[]` | The script (P2): ordered acts/observes | `{act: interaction, with?: {…}}` \| `{observe: observation, as?: label, <comparator>: value\|@label}` |
| step comparators | Closed assertion vocabulary — never callbacks | `is`/`equals`, `absent`, `calledWith`, `closeTo(tol)`, … (final list = Blocker #2); `@label` references a prior `as` capture |

All names load-time-validated against the derived surface (did-you-mean
errors, R22); `h.*` helpers are the wrapped closed vocabulary (R1) supplied by
core + plugin vocabularies. OPEN DETAILS surfaced by this sketch (Blocker #2):
the wire-key scope grammar (what case families/tests a `wire` key addresses)
and the builder-output contract (what a `.state.ts` builder returns so both
realizers can consume it).

Cross-references: implements R7, D4, D8, D9 (the declaration schema lives in
Assayer, authored here), the custom-test carve-out of D12, the harness lines
of D17, R11 (correlation declarations), R9 tier 3 (authoring vehicle);
constrained by R1 (closed vocabulary, no raw-runner passthrough), D18
(declarations are not protection mechanisms), Blocker #2 (authoring API
undesigned); artifact inventory committed item 2.

Dependencies: AST Analyzer Core (derived surface for validation),
Entry-Point & Route Resolution (chaining), State Data System (named-state
wiring targets), Plugin System & Seam Contract (observation vocabularies the
surface builds on), Diagnostics & Error Rendering.

### 14. Test Case Derivation & Assembly

The machine-owned zone: assemble, in cache, the complete runnable case sets —
map skeleton ⊕ derived expectations ⊕ arrange data (C3, or named states where
the harness wires them) — plus each case's execution-mode classification.
Expectations derive from inputs, source literals, declared models, and
consumer demands; NEVER from executing the implementation and recording its
output (P4 — the anti-snapshot law). Nothing here is authored; nothing here
is committed; regeneration is total and free.

Main capabilities:
- Tier-1 derivation: branch/render/handler cases straight from the map, per
  the catalog's Bucket-A families (conditional renders, list quartets
  empty/one/many/max-many, async resolve/reject, boundary-value cases,
  error paths).
- Tier-2 derivation from declared models: transition-map matrices (every
  edge, every non-edge, every gate), Record<Union, Meta> exhaustive wiring
  matrices, Zod accept/reject cases, route-config cases, role-matrix access
  cases.
- Tier-3 intake: harness-declared config cases merged into the assembled
  set (their assertions still closed-vocabulary against the surface).
- Script-shaped cases (P2): arrange → act, assert, act, assert — state and
  async are first-class; boundary traffic over time is the input/output
  definition.
- R6 mode classification across the three execution contexts (unit /
  integration / e2e), including the DSL rule (SQL/regex/ESLint-selector
  logic validated by the real engine, integration mode) and the emerging
  single-owner allocation heuristics; schema supports per-mode instructions
  NOW, full ruleset later.
- Dual arrange expression for the same logical case (open question): unit
  sets props directly; e2e seeds boundaries + navigates and lets props
  emerge.
- Plumbing exemption: pure passthroughs get NO cases — static proof
  replaces tests; cases attach only at transform/consumption sites.
- Trigger-path derivation: for handlers reached via callback props/event
  chains, the C2 reverse map computes the minimal real stimulus (child
  interactions + branch-selecting boundary arranges) so owner-scope cases
  drive the REAL composition — app code is never mocked to fire a prop.
- Locked output (D12): assembled artifacts are cache-resident, unmergeable,
  uneditable, unskippable.
- Q1's line (our formatting logic vs platform/Intl behavior; timezone
  matrix scope) gets ruled here.

End-to-end pipeline workflow (added pass 3e):

1. File saved → content-hash gate (D13): unchanged inputs short-circuit.
2. Changed files' maps rebuild; invalidation cascades along C2 edges (an enum
   edit rebuilds consumers' maps).
3. Map diff (semantic gate): no map delta ⇒ no regen; delta ⇒ affected slice
   re-derives.
4. Derivation: tier-1/2 cases + obligation cases + harness-declared cases
   merge; mode classification routes each to unit/integration/e2e; C3
   supplies arrange data, named states override where wired.
   - **Failure path A:** a case needs data C3 can't build and no named state
     is wired ⇒ needed-state coverage error naming the entry and the missing
     shape ("add a state to assayer/states/ and wire it").
5. Assembly into cache (skeleton ⊕ derived expectations ⊕ data) + shims.
6. Execution: static validation first (config/harness/plugin/state refs);
   then unit/integration via wrapped Jest; e2e boots the declared environment
   (D16), applies mock policy + timer compression, injects taps;
   registry-dependent glue runs after its downstream suites (R19 ordering).
   - **Failure path B:** a step's expected effect doesn't occur ⇒ R21 chain
     diff (step, expectation, what happened instead, artifacts pullable).
7. Reporters map results to map nodes; coverage reconciles map-vs-cases (R3);
   exit codes + report emitted; run artifacts land in cache for `detail`.

Cross-references: implements R5, R6, R9, P2, P4, the assembly line of the
artifact inventory (cache item 2), the plumbing principle; absorbs D3
(generation always produces the cases); constrained by D10, D12, D17, Q1,
the E2E-arrange open question; catalog Bucket A is its derivation spec.

Dependencies: AST Analyzer Core, Repo Graph Builder, State Data System,
Rule & Obligation Engine (obligation-driven cases), Harness System (declared
cases + wiring), Contract Registry & Layered Verification (verified pairs as
glue stubs), Cache Subsystem.

### 15. Contract Registry & Layered Verification

The run-scoped derived registry of **verified pairs** (input ⇒ output state +
effects, proven by a downstream layer's own suite) and **demanded pairs**
(what upstream consumers declare they rely on), reconciled in both
directions. Nothing registry-related is committed; pair definitions derive
statically, verification status is produced by dependency-ordered execution
within the same run.

Main capabilities:
- Pair derivation: per entry, the C3-computed salient state matrix defines
  the candidate pair inventory.
- Dependency-ordered run scheduling: downstream suites execute before the
  upstream glue that stubs against their verified pairs.
- Glue-test support: upstream cases assert (a) correct call made (url/args/
  payload) + (b) correct handling of a REGISTRY-VERIFIED downstream state —
  P4-safe by construction, never a hand-invented mock.
- Coherence enforcement: a stub may only be a verified pair; downstream
  behavior change ⇒ stale-pair consumers become named build errors
  (mock-drift eliminated deterministically).
- Inverse direction: every upstream-demanded pair must be verified by a
  downstream test state, or build error naming the seam (the codex parity
  flagship error).
- Full-flow exception (Q5): declared full-flow scenarios reserved for
  downstream-emergent behavior (WS pushes, timing, confirmations-after-flow);
  selection heuristic open (auto-detectable vs declared).

Cross-references: implements R19, the registry glossary item, cache item 3
of the artifact inventory; constrained by P4, Q5, Q3 (demanded-pair errors at
bus/WS seams need non-lexical edges), C3 (pair states).

Dependencies: State Data System, Test Case Derivation & Assembly, Interpreter
& Wrapped Runners (execution ordering + results), Repo Graph Builder
(cross-layer seams), Cache Subsystem.

### 16. Interpreter & Wrapped Runners

The D1 execution model: runners consume declarative cases directly at
runtime — no compiled/emitted test files ever. Assayer owns Jest and
Playwright as version-locked dependencies; consumers never touch them; the
wrapped surface is a closed allowlist with an escalation ladder for
additions. This is where "tests as data" becomes actual execution.

Main capabilities:
- The interpreter: executes assembled case sets (map + named states +
  harness, including declared cases) at runtime across the three contexts —
  unit (Jest, boundaries mocked), integration (Jest + real external engine,
  the DSL rule), e2e (Playwright full stack / entry-driven chains).
- Trivial generated shims in `.assayer/cache/` — existing only so
  Jest/Playwright have discoverable entries; they hand off to the
  interpreter.
- Custom reporters mapping results back to map nodes; raw runner output is
  never shown (D17).
- EXCLUSIVE wrapping discipline (R1): no raw Jest/Playwright control leaks
  anywhere — configs, harnesses, custom cases; additions go vocabulary →
  global config control → new wrapped capability, never passthrough.
- D5 mock-policy application at run time per mode (unit mocks all I/O; e2e
  real stores, mocked externals), including boundary CLASSIFICATION (probe-
  classified I/O vs pure-compute libs that always run real; unclassified
  third-party imports on tested chains are lint errors) and the rule that app
  code/pure deps are unmockable by construction — no vocabulary exists.
- Boundary-behavior realization is mode-polymorphic (D5/D20): unit = derived
  in-process mock feeds; e2e = queued responses on probe-shipped mock
  runtimes (fake servers/binaries, env-wired at boot). Probes ship both
  realizers; harnesses never mock anything.
- D11 timer compression: declared delays (statics) auto-overridden — env
  injection for e2e, fake timers for unit; expected-timeout handholding;
  tests never wait wall-clock.
- No representable skip; manual edits to generated artifacts are build
  errors (D12).
- Underlying runner tech swappable later because nothing consumer-visible
  names it (R1 rationale).

Cross-references: implements D1, R1, the runtime half of R5, D11, the
runtime application of D5, the shim/reporter lines of D17; constrained by
D12 (lock), R6 (three contexts), Blocker #2 (runtime contract: interpreter +
reporter is part of the interface-contract draft).

Dependencies: Test Case Derivation & Assembly, Harness System, Environment
Orchestration & Smoketest, Effect-Chain Instrumentation, Configuration
Subsystem, Cache Subsystem, Diagnostics & Error Rendering.

### 17. Environment Orchestration & Smoketest

Who boots the world (D16): the repo's config declares its processes (launch
command + readiness check, Playwright-webServer-style); Assayer OWNS the
launching — required for mock-policy env wiring, timer compression, and tap
injection into consumer processes — but does NOT provision infrastructure
(stores exist because the repo/dev/CI made them exist).

Main capabilities:
- Process lifecycle per config: launch, readiness checks, teardown, for
  test runs, explorers, and visual-diff boots.
- `assayer smoketest` (D2): boot the declared environment, run every
  readiness check, verify every configured plugin reaches its target
  (mongo answers on the declared port) — P1-grade errors naming exactly
  which piece of the world is missing.
- Environment injection: D5 boundary wiring, D11 compressed-timer env
  overrides, R15 tap injection into launched processes.
- Boot arbitrary refs (via git worktrees) for the runtime visual diff and
  ad-hoc review.
- v1 scope: npm monorepos with `packages/*`, single operator; per-repo env
  config without apology.
- Parallel-worker isolation + world reset (Q9 — UNDESIGNED): per-worker
  ports/store namespaces/tmp dirs and fast reset-between-tests per store
  tech; without it, parallel full-stack e2e is a flake generator.

Cross-references: implements D16, the smoketest line of D2; enables D5, D11,
R15 (tap side), R12 (visual-diff/explorer boots); constrained by the
no-provisioning ruling and the v1 target-repo scope assumption.

Dependencies: Configuration Subsystem, Plugin System & Seam Contract
(connectivity checks, taps), Git Integration (worktrees), Diagnostics &
Error Rendering.

### 18. Effect-Chain Instrumentation

The shared tracing subsystem: ONE instrumentation layer whose structured
trace events feed BOTH test assertions and human display (live chain log,
run artifacts, chain diffs) — two consumers, one source, so what the
explorer shows can never drift from what tests verify.

Main capabilities:
- Host plugin taps (R15): structured trace events — kind, label, payload,
  timing, correlation id — emitted as effects happen, across the wire
  (interaction → request → server chain → db calls with results →
  third-party mock captures → response → UI update).
- Correlation across process boundaries so a chain reads as one causal
  sequence.
- Capture of per-effect rich data on success AND failure (http
  headers/request/response; db query+rows; redis key+value; mock captures)
  into run artifacts.
- Per-boundary call counts per request (fan-out/N+1/vendor-overload
  visibility; feeds semantic-diff headlines).
- Serve both consumers: assertion evaluation (observe vocabularies) and
  display (live log, `detail <runId>`, desktop zoom).

Cross-references: implements the shared-subsystem paragraph of R12, the tap
member of R15, the capture substrate of R21; feeds the catalog's
boundary-call-count tracking.

Dependencies: Plugin System & Seam Contract (taps are plugin-supplied),
Environment Orchestration & Smoketest (injection), Cache Subsystem (run
artifacts).

### 19. Run Diagnostics & Artifact Capture

Flow-anchored execution feedback (R21): every run — pass or fail — captures
the observed effect chain; a failure is a CHAIN DIFF against the expected
chain, step-pinpointed, with pullable per-step artifacts. The end of
non-obvious timeout errors.

Main capabilities:
- Expected-vs-observed chain per run, recorded via the shared
  instrumentation.
- Chain-diff failure rendering: steps that happened (green), the expected
  step that didn't (red, zoomed), what was observed INSTEAD at that
  position, prior steps completed — P1-grade, names step / expectation /
  actual ("flow begin-quest, step 3/6: expected POST /quests/:id/start —
  observed [PATCH /quests/:id]").
- Per-runId result storage in cache; `assayer detail <runId>` pulls any
  step's artifacts (ward's detail pattern).
- Failure payload for the desktop app: the failed run IS the flow diagram
  with the failure step highlighted; click a step, see its artifacts.

Cross-references: implements R21; constrained by P1; consumes cache item 4
of the artifact inventory; display counterpart lives in Desktop App / CLI.

Dependencies: Effect-Chain Instrumentation, Interpreter & Wrapped Runners,
Cache Subsystem, Diagnostics & Error Rendering.

---

## Comparison layer

### 20. Ref-to-Ref Semantic Diff Engine

The requirement-space comparison machine: derive the semantic model at two
git refs (deterministically, from blobs, on demand), graph-diff them, and
render the delta. It is a VIEW, never a gate — there is no approve action
anywhere; the only enforcement in the system is pipeline pass/fail on the
compared state. Diagram-delta signal-to-noise is P1-grade core product
because human attention is the scarce resource the security model budgets
around (D18).

Main capabilities:
- Ref resolution via Git Integration (merge-base default locally; explicit
  in pipeline; arbitrary A-vs-B ad-hoc; none implicit on default branch).
- Map-vs-map three-bucket correspondence matcher: (a) exact node-key match →
  nothing shown; (b) unambiguous 1:1 within a changed region → modified
  node; (c) ambiguous → bounded old-vs-new block (good output, not
  failure). Git hunk/rename data used as correlation hints, never identity.
- Churn-matrix conformance (the 10 scenarios): formatting shows nothing;
  reorder shows nothing; condition edit shows one modified node; extraction
  shows a move; producer silent when only consumer changes.
- Semantic diff report content: model edges added/removed; observables
  added/changed/WEAKENED (headline, never buried); coverage delta;
  obligations delta; new/removed boundaries per flow ("flow save-quest now
  writes to redis"); per-request call-count changes; global don't-care
  config changes (a rule turned off is a headline).
- Only-changed view: lists ONLY artifacts whose subgraph changed; each as a
  change diff with callouts and before/after toggle.
- Runtime visual diff: boot BOTH refs (worktree + declared environment),
  capture the same states via harness CAPTURE, show side by side. On-demand
  only; tolerance comparators absorb GPU noise; no blessed/baseline images
  exist anywhere.
- One-sided-change surfacing: a change touching one flow while its twin
  feeding the same consumer stays identical (the codex cause-F acceptance
  scenario).
- Empty semantic diff + green checks = nothing to review.
- **Headline ordering is part of the signal-to-noise contract (added pass
  3f):** the report leads with the classes most likely to be silent intent
  drift — new/removed boundaries, weakened/removed declarations, rules turned
  off, call-count jumps — before coverage arithmetic. D18 makes this
  ordering product-critical, not cosmetic.
- **Version pinning rule (added pass 3f):** BOTH refs derive under the
  CURRENTLY-INSTALLED Assayer + plugin versions (recomputed from blobs with
  today's analyzer) — never mixed historical tool versions — so a delta is
  always a CODE delta, never a tool-upgrade artifact. (Corollary: upgrading
  Assayer/plugins can legitimately change maps; that shows as a delta with a
  tool-version cause label, not silent noise.)
- Pipeline report emits markdown-renderable form for PR display (with the
  exit codes carrying the only gate).

Cross-references: implements the semantic-diff and visual-diff paragraphs of
R12, D15, D18, the correspondence mechanics and churn matrix of the
coverage-ID blocker; Q6 resolved-by-removal lands here (no approval
machinery); preconditioned on D13 determinism and stable derivation.

Dependencies: AST Analyzer Core + Repo Graph Builder (models at each ref),
Cache Subsystem, Git Integration, Environment Orchestration & Smoketest +
Harness System (visual diff), Coverage Enforcement (coverage delta),
Rule & Obligation Engine (obligations delta).

---

## Surfaces layer

### 21. Review Projections & Observable Ledger

The static human-facing renderings — deterministic views over maps and
declarations, regenerated per request, never stored as truth. Humans review
requirement-space, never test files: projections are derived from
declarations, so they're truth, not LLM claims.

Main capabilities:
- Model projections: state diagram from a transition map, flag tables from
  Record<Union, Meta> — the "review one diagram delta instead of redrawing
  the map across 5 sessions" surface.
- Flow projections: scenario chains as event/causality graphs, from scenario
  configs + handler effect enumeration, with AUTONOMOUS edges (timer/
  effect-driven transitions) as first-class branches.
- Observable ledger: every declared requirement with status — verified
  (layer, cases), unverified, orphaned; measured-vs-budget for perf
  observables.
- Copy projection: extracted user-facing-strings table for human review.
- Render decks: declared/named states rendered via harness CAPTURE for
  perceptual review — runtime-generated, diffed only ref-to-ref, never
  committed.
- Projection diffs feed the semantic diff engine (same artifacts, delta
  view).

Cross-references: implements the projection/ledger/deck paragraphs of R12;
constrained by D18 (low-information, high-signal — noise breaks the security
model); cache item 5 of the artifact inventory; R21 note that the flow
projection and the executed flow are ONE artifact.

Dependencies: AST Analyzer Core, Repo Graph Builder, Harness System
(captures, declared cases), Coverage Enforcement (ledger status),
Ref-to-Ref Semantic Diff Engine (delta rendering), Cache Subsystem.

### 22. Interactive Explorers (state, endpoint, live tracing)

The manual-testing surfaces: full-stack interactive harness UIs where the
human sanity-checks states, fires entries, and watches the real effect chain
live. Interacting in the explorer executes the real stack exactly as e2e
mode does — same harness, same mock policy — so exploration can't drift from
testing. The manual-testing pain being solved is state SETUP.

Main capabilities:
- State explorer (frontend): pick any declared/derived state, see the view;
  the arrange declarations from test configs ARE the state list (no separate
  authoring); standard state sets per component kind (lists: empty /
  representative / max-many / per-filter-sort); granular flow-state stepping
  — build the state at any point along a flow, watch records transition as
  it progresses.
- Endpoint explorer (backend): list endpoints AND package function entries
  with their flow projections; fire requests including extreme presets at
  declared max scale; expected-vs-actual effects panel (expected db write →
  actual rows from the real store; mocked third party → exact captured
  calls); per-boundary call counts per request.
- Live effect-chain log: Cypress-command-log-style but crossing the wire
  with deeper hooks — the full interaction → request → server → db →
  boundary → response → UI chain, rendered from the shared instrumentation.
- Backstop role in the D18 safety chain (manual testing via the explorer is
  layer 3).
- **Copyable feedback references (gap filled, pass 3a):** every explorer
  position is addressable — state name + entry + flow step — and copyable, so
  "state X is wrong" is a precise handle the human pastes to the LLM, not a
  description. (R12 promises "precise LLM feedback"; this is its mechanism.)
- v2 boundary: record-centric inspection UX beyond the per-request
  effects panel is explicitly deferred.

Cross-references: implements the explorer paragraphs of R12 (state,
endpoint, full-stack ruling, live log); powered by C3 (state lists), D5/D16
(real stack semantics), R15 display members; scoped by Q7 (v1 partition
unruled) and the v2 deferral.

Dependencies: Harness System, State Data System, Environment Orchestration &
Smoketest, Effect-Chain Instrumentation, Entry-Point & Route Resolution,
Test Case Derivation & Assembly (shared effect enumeration).

### 23. CLI

The bundled command-line surface — the LLM's primary interface and the only
path to test execution (consumers never touch Jest/Playwright). Ward is the
prior art: one entry point, quality gates, detail-by-runId.

Main capabilities:
- Execution commands: `check`, `unit`, `e2e` — bundle-capable, scopeable by
  file paths/globs (D2), plus a changed-scope shortcut (working tree vs
  comparison ref — the map invalidation already knows the changed slice).
- `check` runs a STATIC VALIDATION phase before anything executes (gap
  filled, pass 3b): config schema, harness surface references (did-you-mean),
  plugin shapes, state references — so an LLM that only touched a harness
  gets its P1 errors in seconds, without booting runners.
- Plugin validation command (gap filled, pass 3b): the R15 "schema-check +
  dry-run against a fixture" needs a CLI home — validate a repo-local or
  package plugin and report P1-grade contract violations.
- `init` (delegates to Init & Onboarding), `smoketest` (delegates to
  Environment Orchestration).
- `assayer cases <file>` — list all generated + declared cases for a file
  (required because generated tests aren't colocated).
- `assayer detail <runId>` — pull run artifacts per step.
- `assayer docs <topic>` / `explain <topic>` (delegates to LLM Docs
  Surface).
- Ref arguments for diff views (compare A vs B; merge-base default).
- States visibility: list the states a test uses and what exists globally
  (generated + named) — state-gap finding from the CLI, mirroring the UX.
- Pipeline-mode report emission (D15/D18): PR runs emit the semantic-diff
  report as a pipeline artifact alongside pass/fail exit codes.
- P1-grade output register throughout: every failure precise, located,
  actionable.

Typical loop: LLM edits code → runs `assayer check` → gets named build
errors (coverage gap / obligation / refusal / stale demanded pair) → fixes →
green. Human never enters this loop unless the semantic diff shows a delta.

Cross-references: implements D2, the CLI halves of D14, R1 (all execution
mediated), R21 (`detail`), R18 (docs exposure), D15 (ref passing);
constrained by P1.

Dependencies: Interpreter & Wrapped Runners, Coverage Enforcement, Run
Diagnostics & Artifact Capture, Ref-to-Ref Semantic Diff Engine, Init &
Onboarding, Environment Orchestration & Smoketest, LLM Docs Surface,
Diagnostics & Error Rendering.

### 24. Desktop App

The Electron/Tauri-class application (explicit user preference — no
browser-tab workflow) that hosts every human-facing surface. Because
generated tests aren't colocated with source, the app is how a human
browses, runs, reviews, and manually tests. Q7 (which surfaces are v1) is
the open cut line.

Main routes/views (each named by the docs):
- **Repo tree / file view:** file/folder tree → click a file → its case
  list (generated + harness-declared, states each test uses), launch its
  tests, or jump into manual testing from its entry points (D14).
- **Run/results view:** the failed run rendered AS the flow diagram with
  the failure step highlighted; click a step → its captured artifacts
  (R21 zoom view).
- **Review/diff view:** the only-changed queue; per-artifact change diffs
  with added/removed callouts and before/after toggle; semantic diff report
  (headlines first); arbitrary ref-picker (webstorm/github-style A vs B).
  No approve button exists — the human acts by directing the LLM.
- **Projections & ledger views:** model diagrams, flow diagrams, observable
  ledger, copy tables.
- **State explorer view** and **endpoint explorer view** (hosting bucket
  22's UIs, including the live effect-chain log).
- **Render-decks view:** state captures, and the side-by-side runtime
  visual diff.

- **Cross-surface deep links (gap filled, pass 3a):** the D18 safety chain
  (diagram review → manual backstop) requires the HOP to be one click: a
  changed node in the diff view links to the explorer booted at that
  flow/state; a ledger row links to its deck; a failed run step links to its
  artifacts. Without deep links the backstop costs a context rebuild and
  won't be used.

Workflow (post-change manual check): LLM lands a change → human opens the
review/diff view → only-changed diagrams listed → clicks a changed flow node
→ explorer boots the real stack at that state → human plays, watches the live
chain log → if wrong, copies the state/step reference and directs the LLM.

Cross-references: implements D14 and the hosting requirements of R12 and
R21; constrained by Q7 (v1 partition), D18 (review ergonomics are the
security model), D15 (ad-hoc ref comparison).

Dependencies: Review Projections & Observable Ledger, Interactive Explorers,
Ref-to-Ref Semantic Diff Engine, Run Diagnostics & Artifact Capture,
Interpreter & Wrapped Runners, Coverage Enforcement, Cache Subsystem.

### 25. LLM Docs Surface

Assayer's shipped, versioned, CLI-exposed instruction surface for LLMs — the
constructive counterpart to P1's corrective build errors. Both are product
surfaces, not afterthought docs.

Main capabilities:
- `assayer docs <topic>` / `assayer explain <topic>`: one-off config
  changes; declaring R14 policies and observables; authoring R15 probes /
  R2 rules / seam adapters; concepts (tiers, plumbing principle, coverage
  IDs, mock policy).
- LLM register: dense, exact, example-driven, contracts/schemas inline
  (dungeonmaster get-architecture/get-testing-patterns as the model).
- Complete worked plugin example (R15 LLM-authorability corollary; the
  case-study acceptance test: an LLM authors the three.js probe from docs
  alone).
- Versioned with the package — docs always match the installed schema.
- Supplies the session-prehook content Init installs (R20 item 4).
- Later candidate: same topics over MCP; CLI is the v1 requirement.

Cross-references: implements R18, the docs half of R15's authorability
constraint, content for R20 item 4; symmetry with P1.

Dependencies: Plugin System & Seam Contract (schemas/contracts inlined).
(The CLI is the exposure path — CLI depends on this bucket, not the
reverse.)

---

## Meta

### 26. Fixture-Repo QA Infrastructure (Assayer's own tests)

Assayer's own verification — deliberately conventional. Assayer produces a
new kind of test content for consumers, but verifies ITSELF with pure
Jest/Playwright under dungeonmaster standards (proxies, harnesses,
registerMock, strict matchers, ward — per this repo's CLAUDE.md). No
bootstrapping: Assayer never verifies itself with its own config format.

Main capabilities:
- Fixture repos as the integration/e2e substrate: run the Assayer
  CLI/analyzer against fixture repos, assert on outputs (maps, build
  errors, coverage reports, assembled cases).
- Case-study acceptance fixtures: reproduce codex parity causes A–G and
  assert each mapped error fires; transition-map fixture for tier-2
  derivation; amalga-shaped fixture for layer enforcement.
- Churn-matrix fixtures: the 10 correspondence scenarios executed as
  diff-output assertions.
- Error-text assertions held to the case-studies quality bar.
- Dogfooding against real consumer repos as a validation activity — not the
  test suite.

Cross-references: implements R16; guided by case-studies "How to use these
studies" and CLAUDE.md testing standards.

Dependencies: none in-product (development infrastructure; exercises all
buckets from outside).

---

## COVERAGE CHECKLIST

Every principle, requirement, constraint, decision, and tracked question,
mapped to owning bucket(s). "Owner" = the bucket that implements or houses
the item; secondary owners in parentheses.

| Item | Owner bucket(s) | Notes |
| --- | --- | --- |
| P1 (precise actionable errors) | Diagnostics & Error Rendering | Register enforced across all error-emitting buckets |
| P2 (tests as data; script unit) | Test Case Derivation & Assembly | Script shape: arrange → act/assert chains |
| P3 (standalone; type-graph detection; degradation) | AST Analyzer Core (Repo Graph Builder, Rule & Obligation Engine) | Nudges rendered via Diagnostics |
| P4 (expectations never from code under test) | Test Case Derivation & Assembly (Contract Registry) | Registry stubs P4-safe by construction |
| R1 (npm dist; runner-owning; wrapping discipline) | Interpreter & Wrapped Runners (CLI, Configuration Subsystem) | Escalation-ladder global controls live in config |
| R2 (rule-based detection) | Rule & Obligation Engine (AST Analyzer Core, Plugin System) | Rules ship as plugins; core = engine |
| R3 (coverage as build error) | Coverage Enforcement | |
| R4 (TypeScript only) | AST Analyzer Core | |
| R5 (declarative cases; map is the definition) | Test Case Derivation & Assembly (Interpreter & Wrapped Runners, Harness System) | Only authored form: harness config cases |
| R6 (per-case mode classification) | Test Case Derivation & Assembly | Schema support now; ruleset later (deferred list) |
| R7 (harness per file; composition) | Harness System (Entry-Point & Route Resolution) | |
| R8 (categorical obligations) | Rule & Obligation Engine (Plugin System) | Corpora ship with probe/rule packages |
| R9 (three provenance tiers) | Test Case Derivation & Assembly (Harness System for tier 3) | |
| R10 (canonical models; refusals) | Rule & Obligation Engine | |
| R11 (layered observables; comparators; correlations; settlement) | Plugin System & Seam Contract (Coverage Enforcement for satisfaction; Harness System for correlation bindings) | |
| R12 (review surfaces) | Review Projections & Observable Ledger, Interactive Explorers, Ref-to-Ref Semantic Diff Engine, Desktop App (Effect-Chain Instrumentation shared subsystem; Rule & Obligation Engine ratchet) | |
| R13 (companion lint layer) | Rule & Obligation Engine (Plugin System — ships in discipline plugins) | |
| R14 (interaction policies) | Rule & Obligation Engine (Configuration Subsystem storage; Plugin System adapters) | |
| R15 (effect-probe contract) | Plugin System & Seam Contract (Effect-Chain Instrumentation for taps; LLM Docs Surface for authorability) | |
| R16 (conventional self-tests) | Fixture-Repo QA Infrastructure | |
| R17 (lean core + plugin packages) | Plugin System & Seam Contract (Init & Onboarding for auto-install) | |
| R18 (LLM docs surface) | LLM Docs Surface (CLI exposure) | |
| R19 (layered verification; registry) | Contract Registry & Layered Verification (Coverage Enforcement for set arithmetic) | |
| R20 (init spec) | Init & Onboarding | |
| R21 (flow-anchored diagnostics) | Run Diagnostics & Artifact Capture (Effect-Chain Instrumentation; Desktop App rendering; CLI `detail`) | |
| C1 (data-flow chain following; consumption keying) | AST Analyzer Core (same-file), Repo Graph Builder (cross-module liveness) | |
| C2 (two linked graph artifacts) | Repo Graph Builder | |
| C3 (salient state generation) | State Data System | |
| D1 (interpreter execution model) | Interpreter & Wrapped Runners | |
| D2 (CLI surface) | CLI (Init & Onboarding, Environment Orchestration for smoketest) | |
| D3 (scaffolding — ABSORBED) | Test Case Derivation & Assembly | Historical; generation always produces cases |
| D4 (unified per-file driver) | Harness System | |
| D5 (per-boundary mock policy) | Configuration Subsystem (declaration), Interpreter & Wrapped Runners (application) | |
| D6 (route-config parsing for reachability) | Entry-Point & Route Resolution | |
| D7 (pluggable route seam, both sides) | Entry-Point & Route Resolution (Plugin System adapters) | |
| D8 (interactions/observations terminology) | Harness System | |
| D9 (Assayer owns declaration schema) | Harness System | Declared cases are config-shaped, in-harness |
| D10 (total free regeneration) | Cache Subsystem (Test Case Derivation & Assembly; Harness System load-time orphan errors) | |
| D11 (timer compression) | Interpreter & Wrapped Runners (Environment Orchestration injection) | |
| D12 (locked generated tests; authored surface; no skip) | Test Case Derivation & Assembly (Harness System custom-case carve-out; Coverage Enforcement no-skip) | |
| D13 (content-hash cache; hooks as warmers) | Cache Subsystem (Git Integration hooks) | |
| D14 (CLI + desktop vehicles) | Desktop App, CLI | |
| D15 (two modes; ref-to-ref comparison) | Ref-to-Ref Semantic Diff Engine (Git Integration resolution; Cache Subsystem CI persistence) | |
| D16 (environment contract; smoketest; config-gated plugins) | Environment Orchestration & Smoketest (Configuration Subsystem declaration) | |
| D17 (no human config format; map is the test definition) | Harness System (authoring), Interpreter & Wrapped Runners (shims/reporters), Test Case Derivation & Assembly (assembly) | |
| D18 (implementation is spec; diagram is contract) | Ref-to-Ref Semantic Diff Engine (Review Projections & Observable Ledger; Interactive Explorers as backstop) | Signal-to-noise = core product property |
| Q1 (our logic vs platform/Intl) | Test Case Derivation & Assembly | Open; ruled at derivation time |
| Q2 (RESOLVED by D12/D17/D18) | Test Case Derivation & Assembly, Harness System | Resolution recorded; no residual work beyond D12 owners |
| Q3 (non-lexical edges — v1-BLOCKING) | Repo Graph Builder | Must be designed before analyzer epic |
| Q4 (db holes: lint vs test) | Rule & Obligation Engine (Plugin System — db probe family TO-FILL) | |
| Q5 (full-flow selection rule) | Contract Registry & Layered Verification | |
| Q6 (RESOLVED by removal — no approval) | Ref-to-Ref Semantic Diff Engine | Diff is a view; only gate is pipeline pass/fail |
| Q7 (R12/D14 v1 partition — BLOCKER) | Desktop App (Interactive Explorers, Review Projections & Observable Ledger) | Needs the user's cut line |
| Q8 (public-API dead-surface exemption) | Rule & Obligation Engine (Configuration Subsystem home) | Must ship WITH the rule |
| Blocker: interface contract (harness API + persistence schemas + runtime contract) | Harness System (Interpreter & Wrapped Runners, State Data System, Configuration Subsystem) | Gates the format work |
| Blocker: coverage-ID scheme | AST Analyzer Core (ID grammar), Cache Subsystem (two-stage invalidation), Ref-to-Ref Semantic Diff Engine (correspondence + churn matrix) | Cache-internal only |
| Open: e2e arrange model | Test Case Derivation & Assembly (Environment Orchestration seeds boundaries) | Two arrange expressions, one logical case |
| R22 (shared diagnostics/error rendering) | Diagnostics & Error Rendering | Added from this doc's first pass |
| Q9 (parallel isolation & world reset) | Environment Orchestration & Smoketest | Undesigned; recorded from D16 discussion |
| D19 (derived surface; harness as lint-invoiced gap-fill) | Harness System (AST Analyzer Core derivation; Rule & Obligation Engine completeness lint) | Supersedes "every file gets a harness" |

No tracked item is unowned. The former NEW flag (Diagnostics & Error
Rendering) is now recorded as R22; Q9 was added to requirements from the
step-2 correction pass.
