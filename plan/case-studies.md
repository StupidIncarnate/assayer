# Case Studies — the real incidents behind the requirements

> **⚠ SUPERSEDED-TERMINOLOGY NOTE (read before trusting mechanism details):**
> these studies were written mid-session and narrate the design AS IT EVOLVED.
> Later rulings (D15–D18) changed several mechanisms referenced below. Where a
> study says any of the following, substitute the final model:
> - "declared observable / tier-3 observable file / linked to the observable's
>   ID" → a config-shaped CUSTOM CASE inside the relevant harness (no separate
>   observable artifacts, no ID linking).
> - "approval / approved renders become baselines / unapproved delta" → NO
>   approval workflow exists; diffs are ref-to-ref views; visual comparisons
>   are runtime captures of both refs shown side-by-side; the only gate is
>   pipeline pass/fail.
> - "expectation fills / scaffolded fills" → fills DO NOT exist; expectations
>   derive from inputs/literals/models/consumer demands; humans author only
>   harnesses, named states, config.
> - "waiver (per-case)" → only GLOBAL rule/obligation toggles in config.
> The INCIDENTS, root causes, and error-message examples remain accurate — only
> the artifact/workflow vocabulary drifted.

> Purpose: `requirements.md` and `expectation-catalog.md` reference these incidents
> by shorthand ("the codex parity case", "the amalga eyelid", "H-1"). This document
> is the full, self-contained record so a session with no prior context can
> understand WHAT problem each requirement exists to solve. When splitting epics or
> judging edge cases against intent, read the relevant study here first.
>
> Repos referenced (local paths on this machine):
> - **codex** = `/home/brutus-home/projects/codex-of-consentient-craft` — the
>   "dungeonmaster" system: a multi-agent LLM orchestration app (packages:
>   orchestrator, server, web, shared). Primary target consumer for Assayer.
> - **amalga** = `/home/brutus-home/projects/amalga-victorious` — three.js
>   creature-modeling app (SDF fields → marching-cubes meshes → browser render).
> - **dungeonmaster standards** = the testing/architecture conventions enforced in
>   codex (proxies, harnesses, registerMock, strict matchers, ward quality gate).
>   Available via the dungeonmaster MCP tools (`get-testing-patterns`,
>   `get-architecture`) when that server is connected.

---

## Case Study 1 — Session-message parity (codex): 10 LLM sessions, same bug class

**The system.** Codex shows LLM session messages (agent chat output, including
nested sub-agent messages) in a web UI. Two delivery modes are REQUIRED to show
identical content:
1. **Live streaming:** while a session runs, orchestrator tails the session JSONL
   files, processes lines, emits `chat-output` events onto an in-process event
   bus; the server fans them out over WebSocket to subscribed web clients.
2. **File-load (replay):** when a user reopens a session later, the web sends a
   replay/subscribe request; the server calls into the orchestrator, which reads
   the same JSONL files from disk, processes them, and emits the same
   `chat-output` events, routed back to the requesting client.

Both modes were SUPPOSED to funnel through one integration point.

**The incident.** Across ~10 separate LLM sessions, every time an LLM changed this
area (e.g. adding support for sub-agent-of-sub-agent messages), it fixed one mode
and broke the other — streaming worked but reload showed nothing/wrong nesting, or
vice versa. The human had to manually test both modes after every change.

**Root cause (verified by two independent code-tracing agents, 2026-07-04).** The
"one integration point" (`chatLineProcessTransformer` + the single
content-item→ChatEntry mapper) is real but covers ONLY the innermost per-line
shaping step. Around it, five concerns are implemented separately per mode, with
parity enforced by nothing machine-readable:

- **A. Sub-agent correlation implemented 4×.** The agentId↔toolUseId pairing
  semantic exists (1) live-incrementally inside the processor
  (`chat-line-process-transformer.ts:209-219`), (2) in replay pre-scan PASS 1a
  (`chat-history-replay-broker.ts:248-284`), (3) replay prompt-pairing PASS 1b
  (`:297-339`), (4) live prompt-pairing in the scan broker. The processor carries
  a comment admitting it "matches replay PASS 1b's first-unclaimed semantics" —
  parity coordinated by prose. Codex's own CLAUDE.md documents "the reverse map
  is populated three ways" as design.
- **B. The declared funnel is bypassed.** Codex CLAUDE.md commands: "route lines
  through `chatStreamProcessHandleBroker`; do NOT call `chatLineProcessTransformer`
  directly." Both production paths call it directly
  (`chat-history-replay-broker.ts:165`, `quest-monitor-jsonl-watcher-broker.ts:89`).
  Prose invariants enforce nothing.
- **C. Routing metadata derived differently per mode.** Replay stamps
  questId/workItemId at emit time via a quest-list scan; live emits without them
  and the SERVER re-derives via three cascading fallbacks (caches, content
  scanning, broadcast-to-all fallback — `server-init-responder.ts:495-505,
  636-646`). Same semantic, two owners, different data sources.
- **D. Contracts duplicated and all-optional.** `chat-output-payload` is defined
  TWICE with different members (server: 4 fields + passthrough; web: 6 fields).
  Mode is latent in WHICH optional fields happen to be set; one contract
  doc-comment describing what replay carries is already stale. TypeScript cannot
  flag a mode that stops setting an optional.
- **E. Mode is a string prefix.** `'quest-replay-'` constructed/tested at 3+
  server sites; web invents a sibling convention `` `replay-${sessionId}` ``.
  Around it: a hand-rolled four-map buffering state machine whose only job is
  preventing the two transports from double-delivering
  (`server-init-responder.ts:93-118`).
- **F. Two web consumer pipelines with real divergence.** The live binding
  rewrites epoch timestamps (`use-quest-chat-binding.ts:132`); the replay binding
  does not — so live DOM order and reload DOM order can legitimately differ.
  Live logs rejected entries; replay drops them silently. A doc-comment in the
  live binding claims a sort key the shared sorter deliberately doesn't
  implement (doc drift between twins).
- **G. Parity guarded only by hand-authored per-mode e2e twins**
  (`chat-streaming-subagent-grouping.e2e.ts` vs
  `chat-replay-subagent-grouping.e2e.ts`). Nothing forces the twin to exist or
  to assert the same observable. An LLM fixing streaming passes the streaming
  twin and is done.

**The edit-site math (why local diffs look complete).** Adding nested sub-agent
support required ~3 streaming-only edit sites and ~3 file-only edit sites that
must stay behaviorally identical, with only leaf shaping shared. The consolidation
commit (`37d1d953`) touched 120 files. A change to one mode type-checks (optional
fields), passes that mode's e2e, and looks complete. The replay mirror-edit is
demanded by nothing.

**What Assayer would have done (mechanism → exact error):**
- **R19 demanded pairs:** "consumer `execution-panel` demands
  `{parentAgentId set, depth 2}`; flow `live-stream` verifies this pair; flow
  `session-load` verifies NO such pair — its verified set for fixture
  nested-subagent.jsonl still emits `{agentId: realAgentId, parentAgentId:
  absent}`." Converts "replay shows nothing again" from a user bug report into a
  build failure naming the forgotten side. This is the error missing from all
  10 sessions.
- **R10 duplicate-enumeration:** on `'quest-replay-'` (3 server sites + web
  sibling) → forces a declared `FrameOrigin` union; on the twin
  `chat-output-payload` contracts → forces one shared contract. DELETES causes
  D/E as breakage surfaces (refusal beats testing).
- **C1 transform-asymmetry:** "render sink receives `entry.timestamp` via 2
  chains; chain `live` contains hop `replace-epoch-timestamp`; chain `replay`
  reaches the same sink with no equivalent hop — declare the asymmetry (waiver)
  or hoist the hop to the shared segment."
- **R3 tier-1 holes:** every fallback branch of the server's questId cascade and
  the replay binding's silent-reject branch generate cases; uncovered = named
  build errors.
- **R12 semantic diff:** a change touching flow `live-stream` while flow
  `session-load`'s subgraph stays identical, when both feed one consumer,
  surfaces in the only-changed queue as a one-sided change.
- **R21 chain-diff failures:** instead of "waiting for request timed out":
  "flow quest-reload, step 4/6: after `replay-history`, expected chat-output
  `{parentAgentId: agent-A}` — observed at this position: chat-output
  `{agentId: realAgentId-B}`."

**The residue (human-authored surface, total):**
1. ONE tier-3 observable declaring parity intent. State half is R19-expressible
   (both flows verify into the same C3-computed consumed-state matrix — fields
   consumers branch on: uuid, timestamp, agentId, parentAgentId, type,
   workItemId). Ordering half is pure intent (should live arrival-order equal
   file order? P4 forbids deriving the answer from either implementation) → one
   declared round-trip scenario: stream fixture live → capture DOM entry
   sequence → cold reload → assert sequence equality.
2. ~3 declared full-flow scenarios for the subscribe-during-stream dedup machine
   (timing-emergent: race-lost drain, race-won drop, per-workItem mixed).
3. ONE harness-declared custom test (`live-reload-parity`: two browser phases
   with a capture between), linked to the parity observable's ID.
4. Fixture-provenance risk: replay pairing assumes "Claude CLI writes
   Task.input.prompt verbatim as subagent line 0" — a third-party-binary
   property no tier proves; fixtures can drift from the real CLI.

**Verdict.** The 10-session loop collapses to ~1 session of declaring
models/observables (which Assayer's errors nudge toward), then mechanical
error-chasing: every subsequent one-sided fix produces a named, located error on
the forgotten side.

**Caveat that changed the plan:** these chains cross an in-process event bus and
a WS wire — non-lexical hops where chain-following breaks. This promoted **Q3**
to v1-blocking: declared models at bus/wire boundaries must be designed before
the analyzer epic, or R19/C2 can't bite at exactly these seams.

**Doc lineage:** this case is why Q3 is v1-blocking; it validated R19
(demanded pairs), R10 (refusal over testing), R21 (chain-diff errors), D12
(harness custom tests), and the claim that bucket-B residue is SMALL when
mechanisms are right (1 observable + ~4 scenarios + 1 custom test, not "a lot of
manual harness tests").

---

## Case Study 2 — The eyelid that never rendered (amalga): correct math, wrong layer

**The system.** Amalga models creatures as SDF (signed distance field) math,
converted to triangle meshes by marching cubes, rendered by three.js in the
browser. Eye sockets are carved into a parent mesh; eyelids are field operators
over the socket.

**The incident.** The user asked an LLM for eye sockets with working eyelids. The
LLM wrote the SDF operators AND unit tests for them — the tests passed. The
eyelid did nothing visible. Five attempts with a weaker model, tests green every
time, feature still broken; only a stronger model eventually redid the code.

**Root cause (from commit 745977e's own message):** "A smooth socket on a
merge-group host was invisible below the group's marching cell (bear: cell ~0.08
> whole eyeball ~0.056) — the recess never rendered and lid drags changed nothing
on screen, **however correct the SDF**." The field math was genuinely right; the
discretization layer (marching cubes at a coarse cell size) quantized the entire
signal away. The tests asserted field values (the layer the LLM wrote) — they
could not disagree with the code because they tested upstream of where the
requirement lived.

**The general law this exposed:** every signal-transforming/discretizing boundary
(SDF → mesh, mesh → pixels, state → DOM) can destroy upstream correctness.
Upstream tests can SUPPORT a perceptual requirement but never DISCHARGE it.

**What Assayer would have done:**
- **R11 layer enforcement:** the requirement is an observable
  `{layer: rendered-geometry, control: lid-handle, effect: socket-region
  geometry changes / occlusion increases}`. Twenty SDF unit tests do not satisfy
  a rendered-geometry observable → build error on attempt 1: "observable
  eyelid-visibly-closes (layer: rendered-geometry) has no verification at or
  past the mesh layer — field tests do not count."
- **R11 declared correlations → perturbation obligations:** the harness declares
  the binding "data point x = handle `#data-test`" (user-confirmed: this
  declaration is what would have caught it). Generated case: perturb the lid
  handle ⇒ assert the correlated mesh region changed. Fails instantly when the
  recess doesn't march (geometry delta = 0).
- **R12 render decks:** render declared states (lid 0%/50%/100%) for human
  approval; approved renders become baselines (P4-legal: human approval converts
  output into spec).
- **Perf note:** the same commit records a rebuild budget ("bear rebuild ~0.7s
  in-browser") — the prototype for user-declared perf budgets in statics
  (R8 performance obligations; harness-declared custom test for drag latency,
  D12 carve-out).

**Doc lineage:** this case created P4 (expectations never derive from the code
under test — the LLM's tests were transcriptions of its own implementation),
R11 (observables declare their layer), the R11 correlation mechanism, and the
plugin requirement (a three.js observation vocabulary is what makes
artifact-layer assertions expressible at all — R15/R17).

---

## Case Study 3 — The transition matrix and H-1 (codex/dungeonmaster): model-derived tests and endpoint identity

### 3a. The quest-status transition matrix (5 LLM sessions)

**The incident.** Codex quests move through a status state machine (draft →
review_observables → approved → seek_scope → seek_synth → seek_walk →
in_progress → complete/blocked, plus back-edges for replanning). Getting the
transition logic right took 5 LLM sessions; the human had to repeatedly make the
LLM REDRAW the transition map, manually verify the drawing, then manually verify
the code matched it, then re-verify after changes.

**What the eventual hand-written tests look like** (`quest-flow.integration.test.ts`):
forward-path tests, back-edge tests (seek_synth→seek_scope, in_progress→seek_walk,
…), rejected-transition tests (approved→seek_walk ⇒ "Invalid status transition"),
gate-content tests (seek_scope→seek_synth without scopeClassification ⇒ rejected),
per-status field-allowlist tests. EVERY one of those cases is enumerable from
data that already exists (the transition map, the allowlists, the gate
requirements).

**What Assayer would have done:** tier-2 model derivation (R9): the transition
map declared once as data (R10) ⇒ generated matrix — every edge succeeds, every
non-edge rejects with exact error, every gate rejects when content missing —
auto-expanding when the map grows. The human's "keep redrawing the map" loop is
R12's model projection: the state diagram is DERIVED from the declared map
(truth, not LLM claim), approved once, re-approved only on semantic change.
5 sessions → review one diagram, once.

**Doc lineage:** this case created R10 (canonical semantic models + duplicate-
enumeration refusal — see also the requirements example "only terminal statuses
can be deleted": with terminal-ness encoded twice, a string list AND baked-in
transformer literals, "is the code correct?" has NO truth value; the ambiguity
itself must be the build error), R9 tier 2, and R12 model projections.

### 3b. H-1: Begin Quest must POST /start, not PATCH

**The incident (encoded in `quest-begin-transition.e2e.ts` comments).** The Begin
Quest button must POST to `/api/quests/:id/start` — the start endpoint creates
the pathseeker work item. An implementation that PATCHed the modify endpoint
instead ALSO "worked" (status changed, UI proceeded) but silently skipped
pathseeker creation — the root cause of bug H-1. Functionally-adjacent-but-wrong
endpoint identity is invisible to output-only tests.

**What Assayer would have done:** tier-3 observable `{layer: request, trigger:
begin-quest interaction, effect: POST /quests/:id/start}` — request-layer
observations are first-class in the closed vocabulary; the scenario asserts the
call identity, not just the resulting state. Semantic diff headlines any change
to a request-effect edge.

**Doc lineage:** the canonical example that request identity (which endpoint,
which method) is a requirement-layer observable, and part of why scenario
completeness rules (assert request + old-UI-gone + new-UI-appeared) are schema,
not reviewer memory.

---

## Case Study 4 — Corroborating patterns from the wider test sweep (2026-07-04)

Read: codex `floor-ordering.e2e.ts` (783 lines), `ward-execution-streaming.e2e.ts`,
amalga `model-builder-animate.spec.ts` (1432 lines). Findings that VALIDATE or
EXTEND the plan (each cross-referenced to where it landed):

1. **The driver concept already exists in the wild, hand-rolled.** Amalga's
   animate specs drive everything through dev hooks the app exposes for tests
   (`window.__poseEdit.joints()/select()/peek()/set()`, `__livePose`,
   `__animTimeline.captureStance()/scrub()/evalAt()`, `__modelCam`) and observe
   the RENDERED scene graph (quaternion angles, world matrices) — semantic
   interactions + rendered-geometry observations, exactly D4/D8/R15. Assayer
   formalizes an evolved practice, it doesn't invent one. The three.js plugin's
   observe vocabulary should essentially BE these hooks, productized.
2. **Layer allocation is already done by hand and matches our heuristics.** The
   specs explicitly split: REAL-mouse drags test only that the gesture ENGAGES
   the write path ("synthetic-drag magnitude is framing-dependent, so it's not
   asserted here — the ROM clamp is pinned by the jointPoseSolve unit tests"),
   while math/magnitude live in unit tests. New case class recorded in the
   catalog: **gesture plumbing** — one real-input engagement e2e per handle
   kind; math unit-owned.
3. **Silent coverage debt via `.skip`.** `ward-execution-streaming.e2e.ts` is
   entirely `test.describe.skip` with a comment: the architecture it tested was
   retired, "re-enable or rewrite once an e2e harness exists for the new flow."
   Nothing forces that day to come — the observable (ward output streams to the
   panel) is silently unverified. Under D12 there is no representable skip:
   retirement must pass through a WAIVER or an orphaned observable, both
   visible in the semantic diff. Recorded as a D12 addendum.
4. **Tier-2 work running as expensive e2e.** `floor-ordering.e2e.ts` seeds
   work-item DAGs and asserts floor-header ORDERING through a full browser —
   5 scenarios (cycles, dual ward modes, fallback disambiguation, retry splice)
   of what is a pure transformer (role→floor model + topo sort with
   cycle-breaking) plus graph-position-derived semantics (ward with lawbringer
   upstream = FLOOR BOSS). Under Assayer: declared model → tier-2 matrix at
   unit speed, ONE e2e for "floors render." Also note the string-munging
   (`.replace(/──+/gu)`) needed to scrape headers — closed observation
   vocabularies eliminate that fragility class.
5. **Canvas/scene worlds need settlement predicates and tolerance comparators.**
   The amalga specs are full of `waitForTimeout(60-120)` — NOT sloppiness: in a
   canvas there is no element to await, so the dungeonmaster "never sleep, wait
   for the element" rule is UNSATISFIABLE without plugin support. And every
   geometry assertion is tolerance-based (`toBeCloseTo`, `> 0.05`). Recorded:
   R11 layer vocabularies define their own comparators (exact for dom/request;
   declared-tolerance for geometry/perf), and scene-world plugins MUST ship
   awaitable settlement observations ("scene quiescent", "N frames rendered")
   or sleeps come back.
6. **Two smaller corroborations:** semantic readiness ≠ visibility (codex ward
   rows are visible but not expandable while pending — clicks are silent
   no-ops; driver interactions need readiness predicates, recorded with the
   gesture-plumbing entry); and amalga's save→reload→replay-on-a-second-
   creature test (same anim file, ROM-retargeted by declared fraction
   semantics) is a clean bucket-C exemplar: declared interpretation models make
   cross-model invariance mechanically testable.

## How to use these studies during epic/story splitout

- When sizing the **analyzer epic**: Case 1 sets the bar — C1/C2 must cross
  bus/WS boundaries (Q3) or the flagship error (R19 demanded-pair at the
  live/replay seam) can't fire. Case 1's cause list is the acceptance fixture
  wishlist: build fixture repos reproducing causes A–G and assert Assayer emits
  each mapped error.
- When sizing the **review-surface epic**: Case 3a is the acceptance scenario
  for model projections (transition map in, diagram out, approval gate); Case 1
  cause F is the acceptance scenario for one-sided-change headlines.
- When sizing the **plugin epic**: Case 2 is the acceptance scenario — an LLM
  must be able to author the three.js probe from `assayer docs` alone (R15
  LLM-authorability), and the perturbation obligation must catch a zero
  geometry delta.
- When writing **P1 error text**: the exact-error strings in these studies are
  the quality bar — every error names the mechanism, the site, the evidence,
  and what satisfies it.
