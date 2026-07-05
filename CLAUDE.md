# Assayer

## Project Context

Assayer is a test enforcement + generation npm package for TypeScript repos
maintained by LLMs. It statically identifies what SHOULD be tested (rule-driven,
ESLint-style architecture), diffs that against what IS tested, and fails like a
build error. It owns and fully wraps its runners (Jest = unit/integration,
Playwright = e2e); tests are declarative config structures, not `it()` blocks.
The key move: intelligence lives in deterministic AST/type-graph analysis, not
in the LLM — the LLM only fills pre-structured expectation values and authors
declared intent (observables), and build errors tell it exactly what to fix.

**Status: planning. No implementation exists.** Source of truth is `plan/`:
`requirements.md` (principles/requirements/decisions/glossary/artifact
inventory — epic-carving BLOCKERS are at the top; do not implement past them),
`expectation-catalog.md` (syntax → expectation classifications),
`case-studies.md` (the real incidents motivating the design — the "why").
This file summarizes decision-shaping constraints; the plan docs win on detail.

## Constraints that shape every implementation decision

**Error text is product surface (P1).** Every failure must name what's wrong,
where, and what satisfies the check — written for an LLM to act on without a
human. A vague error is a bug. Exact error strings are asserted in tests.

**Detect by type graph, never by convention (P3).** No folder-name, file-name,
or architecture assumptions in detection logic — TypeScript type-graph facts
only. Assayer must work standalone in any TS repo; dungeonmaster-shaped repos
are best-case input, never required input. Graceful degradation: declared-as-
data semantics ⇒ tier-2 exhaustive generation; imperative literals ⇒ tier-1
branch skeletons. Nudge toward declaration in errors; never require it.

**Expectations never derive from the code under test (P4).** Generated expected
values come from inputs, declared models, observables, or consumer demands —
NEVER from executing the implementation and recording output. That's a snapshot
test; it cannot disagree with the code. This rule is why regeneration is safe.

**Wrapping discipline (R1) — exclusive allowlist.** Raw Jest/Playwright
controls are never exposed: not in configs, not in harnesses, not in custom
tests. Escalation ladder for capability requests: (1) express in the closed
vocabulary; (2) global repo-level config control (e.g. timeouts — per-test
timeout knobs must never exist); (3) last resort, a new WRAPPED capability.
Every leaked raw control is an LLM escape hatch and blocks runner swapping.

**Determinism is load-bearing everywhere.** Same code ⇒ same derived artifacts,
same hashes, byte-identical serialization. Baselines (approval records), the
content-hash cache, semantic diffs, and CI cold-start all depend on it. No
timestamps, randomness, or map-ordering nondeterminism in any derived output.

**Ownership split (D12) — never blur it.** Machine-owned: assembled test files
in `.assayer/cache/` (never committed, never colocated, no manual edits, NO
representable skip). Authored + committed: harnesses, observables/scenarios,
expectation fills (keyed by coverage ID), waivers, config/policies, baseline
records, repo-local plugins. Everything in `.assayer/` commits EXCEPT `cache/`.

**Obligations key off consumption, never declaration.** Chain-follow to
consumption sites; declared-but-unconsumed surface is a lint error, not a test.
Pure passthrough plumbing is proven statically, never tested. Tests attach only
at transformation and consumption sites.

**Refusal beats testing (R10).** When ambiguity or redundancy can be made
unrepresentable (duplicate union enumerations, string-built SQL, two contracts
for one wire event), emit a build error demanding the canonical model — do not
generate tests around the ambiguity. Prose invariants in comments/docs are
bugs: convert them to enforced rules (checklist ratchet).

**One rule engine, one plugin pattern.** Rules emit obligations, lints, or
refusals — one engine, three output kinds. All extension goes through the
seam-plus-adapters pattern (detect/tap/observe/display; R15): plugins are
SUBSCRIBERS — they declare syntax patterns and answer phase-keyed callbacks;
the core owns all traversal, chain-following, and ID assignment. Plugins never
parse.

**The plugin contract must be LLM-authorable.** A user will point an LLM at
`assayer docs` and say "write me a three.js plugin." If authoring a plugin
requires core-internals knowledge, the API design has failed. Assayer validates
plugins with P1-grade errors so a wrong plugin is just another fixable build
error.

**Lean core, per-tech packages (R17).** Core never depends on consumer tech
(no pg/mongo/react-hook-form imports in core). Tech integrations ship as
separate `@assayer/*` packages; `assayer init` auto-detects and wires them.
Core owns plugin version compatibility (peer-range enforcement, P1-grade
mismatch errors).

**Assayer's own tests are conventional (R16).** Plain Jest/Playwright under the
injected dungeonmaster standards — Assayer never verifies itself with its own
config format. Integration shape: run the CLI/analyzer against fixture repos,
assert outputs (generated skeletons, EXACT error text, coverage reports).

## Anti-patterns (each one broke a real repo — see case-studies.md)

- Exposing a raw runner control "just this once."
- Committing or colocating generated tests; adding a skip mechanism.
- Deriving an expected value by running the implementation.
- Detecting anything by folder/file naming convention.
- Two encodings of one concept (mode-as-string-prefix, twin contracts,
  re-enumerated unions) — refuse, don't accommodate.
- Enforcing an invariant via comment or doc instead of a rule.
- Per-test/per-harness tuning knobs (timeouts, retries) instead of global
  config.
- Testing tier-2 derivable logic through full-browser e2e (floor-ordering
  lesson: model-derived matrices run at unit speed; ONE e2e proves rendering).
