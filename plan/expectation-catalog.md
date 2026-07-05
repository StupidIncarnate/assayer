# Expectation Catalog

> **Reading order:** read `requirements.md` first — all R#/C#/D#/Q# references,
> the Glossary (tiers, harness/driver, rule kinds, execution contexts, "the DSL
> rule", entry kinds), and the artifact inventory resolve there. Incident
> shorthands (codex parity, amalga eyelid, H-1) resolve in `case-studies.md`.
>
> Living document. Classifies concrete implementation examples into three buckets:
>
> - **A — Implicit:** always tested because of how the code is written. These become
>   the DISCIPLINE PLUGINS' rule content (trigger syntax → generated cases —
>   `@assayer/web`, `@assayer/cli`, per-tech probes; core ships no opinions, R17).
>   This bucket is the plugin rule-set backlog.
> - **B — User-expected:** nothing functionally wrong, but wrong to the user. Cannot
>   be derived from code; must be a declared observable. Each entry names the
>   TOOLING CONCEPT that would prove to a human their requirement is met.
> - **C — Repo-specific:** feature/domain declarations no generic tool can
>   anticipate. Each entry names the CUSTOM-DECLARATION mechanism it requires.
>
> Classification test for new examples:
> 1. Can the analyzer see it in syntax/types? → A
> 2. Is the code branch-complete and model-conformant, but the gap is between what
>    was built and what was wanted? → B
> 3. Does expressing it require domain vocabulary that only this repo knows? → C

## Bucket A — Implicit (base rule backlog)

Format: `trigger (what the analyzer sees)` → `generated expectation(s)`

### React / JSX
- **Dynamic JSX value** `{user.name}` → renders the funneled data (unit); a declared
  state exists that funnels this data to this render (e2e reachability check).
  - Mode allocation (R6 heuristic #1): ONE e2e case proving the value shows in the
    browser with state funneled end-to-end; branch/variant cases are unit-only.
  - Manual test: open the page, see the info listed; not every state re-checked if
    coverage is known. → Replaced by: state explorer (R12) + coverage ledger.
- **Nullable/optional-chained JSX value** `{user?.name}` → leaked-render family:
  nullish leaks render blank, or `"null"`/`"undefined"` in string contexts, and
  `{count && <X/>}` renders a literal `0` — silent user-facing defects. R13 lint
  (react/jsx-no-leaked-render-style) enforces an explicit `??` fallback / else
  render. With that guaranteed, auto cases: renders value (unit + the one e2e);
  renders the declared fallback when nullish (unit only).
- **Date-typed JSX value** → TS cannot express the format in the type, so R13 lint
  enforces explicit formatting at the implementation (no raw Date-to-string). Auto
  cases: formatted value renders (unit + e2e in browser); e2e timezone-variation
  cases where the format is timezone-sensitive. The format choice itself is spec
  (statics) — format changes surface as ref-diff deltas the human reviews once
  per change, not by repeated eyeballing ("do I like the format").
  - OPEN QUESTION (tracked in requirements): the boundary between testing OUR
    formatting logic vs the browser/Intl platform behavior; timezone matrix scope.
- **Conditional render** `{isOpen && <Modal/>}`, ternaries → case per side: renders
  with X data flow, absent with Y data flow.
  - The driving state is HETEROGENEOUS from a code perspective (button-set state,
    URL state, functionality/derived state) but the user question is uniform:
    "does doing X make Y appear/disappear for me." The flow test owns that
    unification; the analyzer must trace which state source feeds the condition.
  - Mode allocation (R6 heuristic #2, TENTATIVE): state-driven element
    presence/absence → e2e for sure; unit may be overkill — needs more examples.
    (Contrast heuristic #1: value VARIANTS are unit-only; state-driven PRESENCE
    is user-perceivable flow, hence e2e.)
  - Manual test: play with it in the browser. → state explorer for state setup +
    flow projection (R12) for spot-checking "x then y" without playing.
- **Event handler prop** `onClick={handleSave}` → interaction case: firing it
  produces the handler's declared effects (callback emitted / state change / request).
  - Analyzer enumerates ALL side effects in the handler body (requests, state
    writes, callbacks, navigation). EVERY effect becomes (a) a required
    observation in the case — partial effect assertion is a coverage gap — and
    (b) a node in the flow projection so the human sees the full consequence set
    of the interaction in the diagram, not in code.
- **Callback prop invocation** `props.onSave(data)` → observation case: emitted
  with exactly the right args (closed vocabulary, full-args match).
- **List render** `items.map(...)` → empty / one / many / **max-many** cases
  (auto set confirmed by user). Max-many is mandatory because of browser
  nonsense — wrapping, overflow, scroll — so it is BOTH an auto case and an
  always-present state in the visual deck/state explorer.
  - **Chain following (analyzer constraint C1):** the data source may be
    filtered/sorted/mutated upstream of this line within the same file — the
    analyzer must trace the data-flow chain from source to render sink and
    generate cases for every transform found along it (filter: representative
    included + excluded items; sort: order asserted — promotes to tier 2 when
    the sort key is declared data).
  - **Perf (R8 + R13):** the max processed count is a declared scale (statics);
    perf lint flags risky syntax on the chain (nested iteration in render,
    unmemoized transforms); e2e extreme-data case at the declared max.
  - Manual test: visually check filtered/sorted results, the empty state, and
    max-many. → Explorer standard state set for list-bearing components: empty,
    representative, max-many, and per-filter/sort variations; coverage ledger
    vouches for the logic, human eyeballs only layout/visual sanity.
- **Component with optional props** → cases derive from CONSUMPTION, not
  declaration: per consumed optional prop, present/omitted cases keyed to what
  omission does at each consumption site (fallback branch, leaked-render guard,
  conditional). An optional prop that is declared but never consumed generates
  NO tests — instead an R13 lint error: unused/untested prop (dead contract
  surface). Distinct from TypeScript's unused checks, which don't flag a typed
  prop that parents pass but the component body never reads.
  (Passthrough/forwarding cases: see the dedicated Passthroughs section below.)
- **useState consumed in render** → interaction that mutates state has a case
  asserting the render output changed accordingly.
  - Mode: user flows for sure (per user) — these live in flow/e2e territory,
    with unit time-advance/interaction cases as support.
- **Timer/debounce usage** (`setTimeout`, `debounce`) → time-advance cases
  (before-threshold: no effect; after: effect). Mode: flow/e2e for sure; unit
  fake-timer cases as support.
- **Pointer-gesture handles (canvas/scene/drag interactions — case-studies §4):**
  the gesture→handler→state-write path cannot be statically proven (hit-testing,
  pointer capture, screen space), so it earns exactly ONE real-input engagement
  e2e per handle kind: real mouse press+drag ⇒ the write path engaged (state
  changed at all). Magnitude/math is unit-owned (tier 1/2) — never asserted
  through synthetic drags (framing-dependent). Driver interactions must encode
  **semantic readiness predicates** (grabbable/expandable), not just
  visibility — a click on a visible-but-not-ready element is a silent no-op
  and a classic flake source.
- **Effect-driven navigation / ejection** (`useEffect` or timers that change the
  URL — auth redirects, inactivity timeouts, splash ejects — possibly before the
  user technically sees the content) → auto cases per driving condition:
  navigates to X under condition A, stays under condition B; time-advance case
  for timer-driven ejects (inactive for T ⇒ flow goes to X instead of Y).
  - **Transient visibility obligation (proposed):** analyzer detects a
    render-then-navigate effect ⇒ demands a declaration of intent for the
    transient content — "user never sees it" vs "user sees it up to T" — since
    the right assertion is opposite in each. Undeclared transient renders are
    flagged, not guessed.
  - **Flow projection impact:** these are AUTONOMOUS edges — transitions caused
    by time/effects, not interactions. The flow diagram must render them as
    first-class branches ("after T inactive → X instead of Y") or the human
    spot-checking the diagram sees an incomplete causality picture.
  - **Mode + runtime (user-confirmed):** e2e definitely — "did X render instead
    of Y" — E2E-OWNED, likely no unit duplicate (see R6 single-owner direction).
    Requires **timer compression** (D11): declared delays live in statics, so
    the Assayer e2e runtime auto-injects env overrides — a 60s inactivity
    timeout becomes milliseconds under test; tests never wait wall-clock, with
    expected-timeout handholding built into the runner.

### Forms ("a specific monster")
- **Submit interaction** → analyzer enumerates the submit path: request issued
  with exact payload derived from field state (happy path), plus every
  policy-declared lifecycle obligation (see R14): blocking UI appears on submit,
  loader hidden on settle, error surfaced on failure. LLMs reliably forget the
  project-standard steps ("hide the loader") — the DECLARED POLICY generates
  these obligations for every detected form; nothing is left to LLM memory.
- **Required/validated fields** → per required/constrained field, auto case:
  submit attempted with field empty/invalid ⇒ NO request issued (explicit
  zero-requests observation, not a negated matcher) AND the validation message
  renders. Derivable from the validation schema (Zod/required attrs) when
  declared as data. Happy-path counterpart: all fields valid ⇒ exactly one
  request with the exact payload.
- **Auto-submit on change (debounced)** → time-advance cases: no submit before
  the declared delay; exactly one submit after; rapid successive changes
  coalesce into one submit. Delay value must live in statics (no magic numbers).
- **Form policy variance** → different apps AND different sections within an app
  have different form expectations — policies are SCOPED declarations (repo
  default + per-section override), not one global.
- **Form-library adapters (interface, per user)** → repos use different form libs
  (react-hook-form, formik, custom — not just native browser validation), so
  R14 policies are written against an ABSTRACT form vocabulary, and the repo
  declares an adapter (interface / abstract-class contract) supplying:
  - **Detection** (analyzer side): what a form/field/validation-schema looks
    like in this lib's idioms (e.g. `useForm` + resolver → links the Zod schema
    for required-field derivation).
  - **Observation** (runtime side): how states manifest — "form invalid",
    "field X invalid", "submitting", "settled" — as concrete predicates
    (aria-invalid, error element, disabled state) per lib.
  Assayer ships adapters for common libs (same pluggable seam as D7 routers);
  policies and generated cases never mention the lib — swap the adapter, keep
  every test.
- Mode allocation: unassigned pending more examples (validation-block cases feel
  unit-heavy with one e2e proving the blocking UI, but not yet ruled).

### Passthroughs & data-flow plumbing

Core principle (user-established): **static proof replaces tests for pure
plumbing.** Tests attach only to transformation and consumption sites; the
analyzer proves forwarding happens (and flags dead surface), so "did it drill
through" tests are unnecessary by construction.

- **Pure prop/arg passthrough** (values forwarded through functions/components,
  especially optional ones) → NO tests for the plumbing. Never consumed anywhere
  down the chain → R13 flag (transitive dead surface). Consumed → cases exist
  only at the end consumption branch.
- **The purity boundary — what turns plumbing into a transform (and earns
  cases):** a hop stops being pure the moment it touches the value: default
  parameter (`x = 3`), `?? fallback`, conditional forwarding (`cond ? a : b`),
  wrapping a callback with extra args (`onClick={() => onSave(id)}`),
  destructure-and-reassemble into a new object, non-null assertion/narrowing,
  or in-place mutation (`items.push(...)`). Each such hop is a transform site
  with its own cases (the default-used case, both conditional sides, the
  called-with-wrapped-args observation). In-place mutation of passed-in values
  is additionally an R13 lint candidate (shared-reference mutation is a defect
  class of its own).
- **Mid-chain rebinding (passthrough mutates into a different passthrough
  variable)** → the analyzer tracks value IDENTITY across renames: a pure alias
  (`const label = props.name`, forwarded as `label`) is still plumbing — proof
  and dead-surface analysis follow the new name. A value-changing derivation
  (`const total = price * qty`, then plumbed) is a transform hop with its own
  cases, after which a NEW plumbing segment begins; downstream consumption
  cases assert the TRANSFORMED value, not the original.
- **Mid-chain constraint / narrowing hops** → a layer that constrains the value
  (clamps to a range, filters to allowed members, validates) earns cases at
  that hop (in-range passes through / out-of-range handled). Downstream case
  generation then uses the NARROWED domain — no impossible out-of-range cases
  generated below a guard that provably excludes them.
- **Mid-chain side-effect triggers (e.g. value condition ⇒ redirect)** → a
  passthrough layer that reacts to the value (redirects, throws, notifies) is
  simultaneously plumbing AND an effect site: effect cases attach there (value
  X ⇒ redirect, value Y ⇒ continues + flows on), the flow projection gains the
  conditional edge, and the chain analysis records that only non-ejected values
  flow past.
- **Spread forwarding** (`{...props}`, `fn(...args)`) → spread membership must be
  resolvable from types for static proof to work; an unresolvable/opaque spread
  defeats the whole plumbing analysis → R13 lint error rather than silent
  degradation. (Spreading unknown surplus props onto DOM elements is the classic
  leak.)
- **Children/slot passthrough** (`{children}`) → one structural case: the slot
  renders what's given. The CONTENT of children belongs to the file that
  authored them, not the component that slots them.
- **Render props / component-as-prop** → the passer owes one observation: the
  render prop is invoked with the right args. What it renders belongs to the
  supplier's file.
- **Callback passthrough (wiring down, firing up)** → downward wiring proven
  statically like any plumbing; the FIRING is tested at the interaction site
  (child: "interaction ⇒ callback observed with args", per branch-selecting
  boundary arrange — success: called with derived args; failure: called zero
  times); the handler's BEHAVIOR is tested at its owning file. Wrapped
  callbacks are transforms (see purity boundary).
  - **Trigger-path derivation (how the owner's behavior case gets its
    stimulus):** the C2 reverse map computes the minimal REAL chain from the
    handler back to the nearest user interaction — parent case = mount parent
    with real child, arrange the boundaries the chain crosses (derivable:
    the chain knows them), act the child's interactions, assert the PARENT's
    effects. Never "call the prop directly" — that's mocking app code.
- **Boundary-terminated chains** → a value passed into an npm/external call has
  its consumption site AT the boundary: the case is the boundary observation
  (called with exact args), per D5. Chains never dangle — they end at a
  consumption site, a render sink, or a declared boundary.
- **Chain breakage semantics** → when a hop stops forwarding (prop removed,
  arg dropped), static proof FAILS as a build error naming the exact hop and
  the stranded consumer — strictly better than a failing test, which names
  only the symptom's location.
- **E2E implication** → because intermediate hops are statically proven, e2e
  funnel verification needs only two ends: state seeded at entry, value
  observed at the end render. No intermediate assertions, ever.
- **Consideration — public API exemption (tracked as Q8):** exported/library
  components have consumers outside the repo; the dead-surface flag needs
  entry-point/public-surface exemptions (config), or every library prop reads
  as "unconsumed." The exemption must ship WITH the rule.
- **OPEN (tracked Q3) — non-lexical edges:** context Provider → useContext and
  store-mediated flows (zustand/redux) break lexical chain-following; these
  edges need dedicated resolution (context linkage) or a declared model at the
  store boundary before the plumbing principle can apply there.

### TypeScript functions
- **Branches** if/else, switch (every case incl. default), ternary, `?.`, `??`,
  early returns → case per path.
- **try/catch, thrown errors** → error-path case per throw site; catch-path case.
- **Async** → resolved + rejected cases.
- **Loops over input collections** → 0 / 1 / many / **max-extreme** (mirrors the
  list-render quartet). Extremes exist at EVERY layer independently: the browser
  may submit extremes to the server; the server deals with extremes in
  isolation. One declared scale (statics) drives all layers — frontend
  max-many render, max payload submission, backend loop extremes — so the
  layers can't disagree about what "max" means.
- **Numeric/string boundary logic** (comparisons against limits) → min / within /
  max / just-outside cases; limits must come from statics (no magic numbers).

### Backend endpoints
- **Endpoint e2e shape (user-defined):** starts by hitting the endpoint, then
  asserts side effects ALONG THE CHAIN — response shape, db writes (observed at
  the real store), boundary calls (observed at the mock for external systems,
  per D5 policy). The chain of effects comes from the analyzer's effect
  enumeration, same as handler enumeration on the frontend.
- **Extreme-payload case** → endpoint hit at the declared max scale (R8);
  shared statics with the frontend extremes (see loops entry).
- **Shipped effect probes (bakeable, initial list):** each backend effect kind
  Assayer can detect, instrument, assert on, and display out of the box:
  - **HTTP response** — status, contract-validated shape.
  - **SQL / document stores** — writes+reads via driver/ORM adapters (pg, mysql,
    mongo, prisma/typeorm/knex): rows written, queries issued.
  - **Redis / caches** — get/set/del with keys+TTLs; hit vs miss visible in the
    chain log (a silent cache miss storm is a classic invisible defect).
  - **Transactions** — begin/commit/rollback observed. AUTO-CASE: if a
    transaction is detected, the error-mid-chain case asserts rollback — no
    partial writes survive a failure.
  - **Outbound HTTP (third parties)** — mock captures + per-request call counts.
  - **Queues / jobs** — enqueues (payload, queue name), scheduled work.
  - **Logging** — structured emissions (level, message, context) as observable
    effects; policy hooks: R14 "error paths must log with context"; R8
    obligation candidate: no secrets/PII reach log sinks.
  - **Email / notifications / webhooks-out; WS/SSE broadcasts; filesystem;
    child processes; metrics emissions; auth/session mutations (cookie set,
    token issue).**
- **Boundary call-count tracking (proposed):** per endpoint, the analyzer +
  runtime record how many calls each boundary receives per request ("does one
  submit fan out into N vendor calls?"). Changes in per-request call counts
  surface in the semantic diff as headlines — accidental third-party overload
  becomes a reviewable delta, not a production surprise.
  - Manual test: submit max items to an endpoint for peace of mind; check
    third-party connections aren't overloaded. → endpoint explorer (R12) with
    extreme presets + the call-count panel.

### Database — schema-derived obligations (TO FILL — user flagged as not yet articulable)
Table definitions are another declared model (tier-2 source): migrations/schema
drive derived cases. Seeded families, to be completed when we reach db work:
- **Duplicate write semantics (user's example: post, then post again)** → what
  SHOULD happen — second record, overwrite, or error — is INTENT the schema only
  partly declares (unique index = declared; upsert-vs-reject = code path).
  Pattern holds: declare the idempotency/uniqueness intent, then AUTO cases:
  repeat-write ⇒ declared outcome (error surfaced / record overwritten / both
  records present), never silent corruption.
- **Constraint families (derivable from schema):** unique violation ⇒ handled
  error case; FK violation + cascade behavior; not-null rejects; defaults
  applied on omission.
- **OPEN (Q4):** which schema holes are LINT callouts (write path with no
  conflict handling detected statically) vs generated TEST cases — split not yet
  ruled.
- **Note (R15):** every tech domain carries its own obligation checklist like
  this one — probe packages SHIP their domain's bucket-A entries; this catalog's
  section structure extends into plugin packages.

### Package entry points (function entries — not web, not server)
- **Entry kind #3 (user: codex orchestrator):** a package whose entries are
  exported FUNCTIONS with side effects (redis writes, etc.). D7 extends: package
  entries are enumerated (declared entry manifest / exports analysis) like
  routes are.
- **E2E shape: identical to endpoints** — invoke the entry fn, assert effects
  along the chain via probes (redis entries written, work items created,
  return value contract-valid).
- **Explorer: trigger like endpoints** — the manual UX lists package entries
  next to routes; firing one shows the same live effect-chain log.

### Layered verification — glue vs full-flow vs already-covered (R19)
Worked examples (codex-shaped):
- **Glue is enough (web ↔ server):** quest list page calls `GET /api/quests`.
  The server's own e2e already verified: seeded db ⇒ that route returns state S.
  Web's test asserts (a) the request was made correctly, (b) rendering of the
  VERIFIED state S — served from the contract registry, not a hand-written mock
  (P4-safe: the pair was proven by the server suite, not invented). Server+db
  do NOT rerun for every render variation.
- **Glue is enough (server ↔ orchestrator):** `POST /quests/:id/start` calls
  `orchestrator.startQuest()`. The orchestrator package e2e verified:
  `startQuest(questId)` ⇒ redis effects + returns R. The server route test
  stubs the entry with verified R, asserts the correct call + its OWN effects
  and response mapping. Orchestrator innards never rerun upstream.
- **Full-flow required (emergent cross-layer behavior):** Begin Quest — web
  clicks Begin ⇒ server POST /start ⇒ orchestrator creates work items ⇒ server
  broadcasts WS quest-modified ⇒ web swaps panel LIVE. The panel swap consumes
  a DOWNSTREAM-EMERGENT effect (WS push contingent on orchestrator completing);
  a registry pair can't represent the timing/reaction chain ⇒ declared
  full-flow scenario. Confirmations-after-flow are the general class.
- **Rule of thumb (pending Q5):** glue = request/call correctness + handling of
  verified downstream states; full-flow = only where upstream logic reacts to
  downstream-emergent effects (WS, polling, timing) or a declared observable
  spans layers; already-covered = anything the downstream layer's own suite
  proved, tracked by the registry so "don't rerun" is checkable, not vibes.
- **Cross/inverse contracts (user):** the UI publishes DEMANDED pairs ("when I
  send this, I expect these results") into the registry; the server suite must
  contain states that verify into every demanded pair, or build error. Demands
  and verifications reconcile in both directions.
- **Salient state generation (C3):** which registry states exist isn't guessed —
  per entry, the state space enumerates from the AST (unions/mutations →
  enumerated values), then shrinks by consumer care: each UI call site consumes
  its own subset, so its cases need only the values ITS branches distinguish;
  fields nothing branches on get randomized fill (provably don't matter).

### Contracts / models (tier 2)
- **Zod schema** → accept case per valid shape; reject case per constraint
  (min/max/regex/enum member); brand round-trip.
- **`Record<Union, Meta>` + consumer code** → exhaustive matrix: every union
  member, expected value computed from the meta property; wiring verified through
  the real caller.
- **Transition map (declared state machine)** → every edge succeeds; every
  non-edge rejects with exact error; every gate rejects when its content is missing.
- **Allowlist per state** → forbidden-field rejection case per state.
- **Route config** → each route renders its entry component; unknown path →
  declared fallback.

### Boundaries (D5)
- **Import crossing into node_modules (I/O)** → boundary must be declared in mock
  policy; failure-mode cases owed (http non-200/network error; fs ENOENT/EACCES).
- **Nondeterministic global** (`Date.now`, `crypto.randomUUID`, `Math.random`) →
  must be controlled in arrange; at least one case proving the value flows (not
  hand-constructed — P4).

### Injection & security obligations (R8)

Split pattern: **AUTO** = analyzer detects the sink via chain/taint analysis
(C1/C2) and generates cases from shipped payload corpora (versioned artifacts
OWNED BY the relevant probe/rule packages per R15/R17 — installing the SQL probe
installs its injection corpus). **USER** = declares the security model; cases
derive from it.

- **SQL sink** → R13 lint FIRST: string-built queries banned outright
  (parameterize or don't compile — refusal beats testing). Where dynamic SQL is
  legitimate: AUTO injection cases (quote-break, comment, UNION payloads)
  through the real path, asserting no effect + handled error — integration
  mode per the DSL rule.
- **HTML/XSS sink** (`dangerouslySetInnerHTML`, raw insertion) → R13 lint
  demands a sanitizer on the chain; AUTO case: script payload renders inert.
- **Form-level stored XSS (user: "when seeing a form, can an XSS attack
  happen")** → form detected ⇒ AUTO round-trip case: submit script payload
  through the form, then assert it renders INERT everywhere that value is
  later displayed (C2 reverse map finds the display sites). Covers stored XSS,
  not just sink-local escaping.
- **Shell/exec sink** (child_process with interpolated input) → R13 lint: arg
  arrays, never interpolation; AUTO case: metacharacter payload not interpreted.
- **Path sink** (fs ops fed by user input) → AUTO traversal cases (`../`
  payloads ⇒ denied/normalized).
- **Object-merge of user input** → AUTO prototype-pollution case (`__proto__`
  payload inert).
- **User-input regex** → R13 lint flag + AUTO ReDoS budget case (catastrophic
  backtracking input completes within budget).
- **Endpoint auth** → AUTO: endpoint detected without auth middleware ⇒
  unauthenticated-request case (401) owed; USER declares the role/permission
  matrix as data ⇒ per-role access cases become tier-2 AUTO (every role ×
  every endpoint, expected from the matrix).
- **Sensitive data egress** → USER declares sensitivity on contract fields
  (branded contracts carry the marking); then AUTO: cases assert marked fields
  never reach logs, responses they don't belong in, or third-party payloads —
  taint-tracked via C2.

### Performance obligations (R8)

- **Declared-scale extremes** → USER declares the max scale once (statics);
  AUTO cases at every layer (max-many render, max payload, backend loop
  extremes) — already per the loops/list entries.
- **N+1 detection** → AUTO: a loop whose body crosses a boundary (query, http)
  ⇒ obligation case asserting call count does NOT scale with item count
  ("2 items vs 20 items ⇒ same query count, batched").
- **Boundary call budgets** → AUTO tracking per request (see endpoint section);
  USER may pin budgets; changes headline in the semantic diff either way.
- **Render perf** → R13 lint (unmemoized transforms in render, nested iteration
  over props) — refusal/warning, not tests.
- **High-frequency handlers** (input/scroll firing requests) → R13 lint demands
  debounce/throttle; AUTO coalescing case (per the forms auto-submit entry).
- **Time budgets on critical paths** → USER declares which flows are
  perf-critical and their budgets (e.g. amalga's rebuild ≤ 1s, in statics);
  AUTO measured cases enforce them — converts "feels responsive" into a
  measurable, diffable number.

### Refusals (R10 — errors, not tests)
- **Duplicate enumeration of union members in impl code** → build error
  demanding derivation from the declared model. Refusal, not a generated test.

## Bucket B — User-expected (observable + tooling concept per entry)

Format: example → why tests pass while the user is unhappy → observable declaration
→ tooling surface that proves it to the human.

- **Eyelid visibly closes (amalga; full record: `plan/case-studies.md` §2)** →
  SDF math correct, discretization destroyed the signal → observable `{layer: rendered-geometry, control: lid-handle, effect:
  socket-region geometry changes; occlusion increases}` → three.js plugin
  perturbation test + state-render deck for human perceptual review (runtime
  ref-to-ref side-by-side captures — no committed baselines, per D15/R12).
  - User confirmation: the catching declaration is the HARNESS BINDING — "data
    point x = handle `#data-test`" declared in the harness ties the control to
    its test handle; the perturbation obligation then has a concrete grip.
    Correlation declarations live in the harness.
- **"Begin Quest starts the quest" hits the right endpoint (dungeonmaster H-1)** →
  a PATCH also "worked" but skipped pathseeker creation → observable `{layer:
  request, trigger: begin-quest interaction, effect: POST /start}` → observable
  ledger row + scenario request-observation; semantic diff headlines any change.
- **Panel swaps live via WS, no reload** → a reload also shows the right panel →
  observable `{layer: dom, constraint: no-navigation during transition}` →
  scenario completeness schema (old-gone + new-visible + no-reload observation).
- **Drag rebuild feels responsive (~<1s, amalga)** → correct output, 30s rebuild
  would still pass → observable `{layer: perf, budget: rebuild < 1000ms}` → R8
  perf obligation + budget in statics; ledger shows measured vs budget.
  - User ruling: no obvious baked-in generator (triggered by user event,
    measurement is bespoke) → HARNESS-DECLARED CUSTOM TEST (D12 carve-out):
    authored pointer-sequence + latency measurement, linked to the perf
    observable so it lands in the ledger. Candidate to graduate into a plugin
    observation (input-to-render latency) if the pattern recurs.
- **Error message is helpful / labels are right** → any string passes a
  functional test → observable `{layer: copy}` → projection: extracted
  user-facing-strings table for human review; semantic diff on copy changes.
- **List ordering matches user expectation (recency)** → unordered list is
  functionally "complete" → declare ordering in the model (sort key as data) →
  becomes tier 2 (moves to bucket A once declared).
- **What I typed survives save/reload** → save succeeded, hydration dropped a
  field → round-trip scenario pattern (write → cold read → observe equality) —
  candidate for PROMOTION to bucket A as a derived obligation wherever a
  contract has both a persist and a fetch path.
- **Keyboard/focus behavior** → mouse path works, tab order broken → a11y
  obligation rules + a11y observation vocabulary (candidate base plugin).
- **Session-message parity (codex, CANONICAL WORKED EXAMPLE — 10 failed LLM
  sessions; FULL SELF-CONTAINED RECORD: `plan/case-studies.md` §1):** two delivery modes (live WS stream, file-load on reopen) must
  show identical content; supposed single funnel real only at the innermost
  step; correlation logic ×4, contracts ×2, mode-as-string-prefix ×3+, one-sided
  timestamp rewrite — parity existed only in prose comments, so one-sided fixes
  type-checked and passed one-sided e2e twins. Assayer decomposition:
  - STATE half → R19: both flows must verify into the same C3-computed
    consumed-state matrix (catches replay emitting realAgentId where live
    emits toolUseId, and the depth-2 gap at max-depth states). AUTO once
    declared.
  - ORDERING half → intent, not derivable (P4): ONE tier-3 round-trip scenario
    `{stream fixture live → capture DOM entry sequence → cold reload → assert
    sequence equality}`.
  - Timing-emergent dedup (subscribe-during-stream buffering) → ~3 declared
    full-flow scenarios (Q5 class).
  - ONE harness custom test (live-reload-parity, two browser phases, linked to
    the parity observable).
  - Everything else: generated (R3 branch holes on fallback cascades) or
    REFUSED (R10 on prefix + twin contracts; prose invariants ratcheted into
    R2 custom rules).
  - Caveat: chains cross event-bus + WS hops → Q3 (v1-blocking) must resolve
    for the demanded-pair machinery to bite at those seams.

### The B-review loop (what the human actually inspects)
1. Observable ledger: every B entry above is a row — verified/unverified/orphaned.
2. Semantic diff: additions/changes/WEAKENING of any observable is a headline.
3. Render decks: perceptual rows carry a deck link; the visual diff runs both
   refs and shows captures side-by-side — the human's eyes at diff time are
   the check; nothing is blessed or stored.
4. Green gate + empty semantic diff = nothing to look at.

## Bucket C — Repo-specific (custom declaration mechanisms)

- **Rig handle ↔ geometry region correlation (amalga)** → declared correlation map
  (`control → affected-region`) → generic perturbation obligation; three.js plugin
  supplies observations. Mechanism: **declared correlations** (R11).
- **Marching-resolution contract (amalga: "every smooth socket marches at
  childR/CELLS_PER_CHILD_R or finer")** → repo-declared invariant over derived
  artifacts → custom rule asserting it across all models/references. Mechanism:
  **custom invariant rule** (R2 plugin API).
- **taskPrompt exact format (dungeonmaster)** → repo-specific contract on
  generated strings → belongs in a contract + tier-2 derivation, but the FORMAT
  itself is repo-chosen. Mechanism: **contract-as-model**.
- **Ward splice semantics ("spiritmender is ALWAYS spliced, retry never bare")** →
  regression-born invariant over workflow output → declared observable +
  scenario; provenance links to the incident. Mechanism: **regression observable
  with provenance metadata**.
- **Domain math properties (SDF sign/continuity)** → property-style invariants
  needing domain vocabulary. Mechanism: custom rule pack (candidate three.js/
  geometry plugin content).

## Intake process

When a new example surfaces (any repo, any session): classify via the test above,
add the entry, and note PROMOTIONS — B entries become A entries when a declaration
pattern is found that makes them derivable (see list ordering, round-trip). The
goal over time: A grows (baked in), B shrinks to genuine intent, C reveals what the
plugin API must express.

**Promotion-state convention:** an entry mid-promotion is marked in place
("candidate for PROMOTION" / "moves to bucket A once declared") and STAYS in its
current bucket until the enabling declaration pattern is a shipped rule — at
which point the entry MOVES to bucket A with a one-line provenance note. For
epic scoping: only entries physically IN bucket A are base-rule-set candidates;
mid-promotion entries are not (currently: list-ordering, persist/fetch
round-trip).
