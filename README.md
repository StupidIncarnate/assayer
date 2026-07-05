# Assayer

A test enforcement and generation tool for TypeScript repos maintained by LLMs.

Assayer statically identifies what *should* be tested, compares it against what
*is* tested, and fails like a build error when the two disagree — so an LLM
working in the repo gets told exactly what it broke and what satisfies the
check, instead of a human re-verifying every change by hand.

## Status

**Planning phase. There is no implementation yet.** The previous stub-generator
prototype was scrapped and this repo was reset; the current design supersedes
it entirely.

All current thinking lives in `plan/`:

| Doc | Contents |
|---|---|
| `plan/requirements.md` | Principles, requirements, decisions, open questions, glossary, artifact inventory — start here (blockers for epic carving are at the top) |
| `plan/expectation-catalog.md` | Concrete syntax → expectation classifications: what gets auto-tested, what needs declared intent, what's repo-specific |
| `plan/case-studies.md` | The real incidents motivating the design — read these first for the "why" |

## Design summary (decided, not built)

- npm package installed per-repo; TypeScript projects only.
- Owns and fully wraps its test runners (Jest for unit/integration, Playwright
  for e2e) — consumers never touch raw runner APIs.
- Tests are declarative config structures, not `it()` blocks; one test file
  drives multiple execution modes.
- Coverage enforcement is rule-driven (ESLint-style architecture): a base rule
  set plus pluggable per-tech packages, with build-error output written for LLM
  consumption.
- Generated tests are machine-owned and locked; humans and LLMs author only
  harnesses, declared observables/requirements, and expectation values.
- Review surfaces (model projections, semantic diffs, state/endpoint explorers)
  let a human verify requirement-level changes without reading test files.

None of the above exists as code yet.
