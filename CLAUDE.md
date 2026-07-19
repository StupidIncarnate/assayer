# Assayer

## Project Context

Assayer is a test enforcement + generation npm package for TypeScript repos
maintained by LLMs. It statically identifies what SHOULD be tested (rule-driven,
ESLint-style architecture), diffs that against what IS tested, and fails like a
build error. It owns and fully wraps its runners (Jest = unit/integration,
Playwright = e2e); tests are declarative config structures, not `it()` blocks.
The key move: intelligence lives in deterministic AST/type-graph analysis, not
in the LLM — expectations are DERIVED (from inputs, source literals, declared
models, consumer demands); the LLM authors only harnesses, named states, and
config, and build errors tell it exactly what to fix.

**Design source of truth is `plan/`:** `requirements.md`
(principles/requirements/decisions/glossary/artifact inventory — epic-carving
BLOCKERS are at the top; do not implement past them), `expectation-catalog.md`
(syntax → expectation classifications), `case-studies.md` (the real incidents
motivating the design — the "why"). This file summarizes decision-shaping
constraints; the plan docs win on detail. For how the ANALYZER works, read
`packages/core/CLAUDE.md` before touching it.

**Local setup:** `@dungeonmaster/*` are `file:` deps, so
`codex-of-consentient-craft` must be checked out as a SIBLING directory of this
repo. Verify with BOTH `npm run ward` and `npm run test:syntax` — the specimen
catalogue is not in ward's graph.

**Critical:** Do not document historical state. CLAUDE.md files, code comments, JSDoc, and
test descriptions should describe what the code does NOW — never "used to do", "previously",
"historically", or "before the X fix". Git is the history. If the current design needs
rationale, state the rationale in present tense ("keys on toolUseId because…") not as a
contrast with a deleted implementation. When you remove code, remove every comment that
refers to what was removed.

## Driving the desktop app by hand (an LLM can inspect the real UI)

**A plain browser at the dev URL is a dead end.** The renderer's every fact
arrives over Electron IPC via `window.assayerBridge`, injected by the preload's
`contextBridge` — there is no HTTP API behind it. Outside Electron that global
is `undefined`, so the app renders "No compiled surface" no matter what is
compiled. Do not chase that empty state in Chrome, and never stub the bridge to
make the page "work": a stubbed bridge verifies stub data, not Assayer.

**Attach to the real app over CDP instead.** Electron accepts
`--remote-debugging-port`, so one long-lived instance can be driven across many
commands — unlike the e2e harnesses, which seed a throwaway temp repo and tear
it down per test:

```bash
DISPLAY=:1 ASSAYER_DEV=1 npx electron packages/desktop/dist/bin/desktop-main.js \
  --repo /path/to/repo --remote-debugging-port=9222 &
```

Then attach with `chromium.connectOverCDP('http://127.0.0.1:9222')` and take
`contexts()[0].pages()[0]`. Playwright's own `close()` detaches CDP without
killing the window. From there the page is fully scriptable: screenshot, click
by testid, and call the bridge directly —
`window.assayerBridge.getCompiledTree()` answers over real IPC.

`--repo` picks the repo whose `.assayer/cache/` is read, and the window only
lists files a compile already wrote there. `ASSAYER_DEV=1` swaps the renderer
from the built `app/dist/index.html` to the Vite dev server, which must already
be listening (`npm run dev -w @assayer/app`) or the window loads nothing.
`ASSAYER_HEADLESS=1` creates the window hidden, which is what the e2e run needs
where no display exists.

**`npm run dev` clears the field first** (`predev` → `dev:stop`), so a second one
never stacks a window or dies against the dev server's `strictPort`. Two details
in `dev:stop` are load-bearing, not noise. The bracket in
`pkill -f '[d]esktop-main.js'` keeps the pattern from matching the shell running
it — spell it plainly and the script kills its own parent instead of the app.
And the server dies by PORT (`fuser -k 6273/tcp`) because matching on `vite`
would reach into whatever unrelated repo is also running one.

**Known defect — core is NOT publish-ready.** `npm pack` ships 359 files with
`dist/` → **0** of them, while `package.json`'s `exports` point at
`./dist/*.js`: gitignored, no `files` allowlist, no prepublish build, so a
published core resolves every export to a file that is not in the tarball. It
also ships 127 `.test.ts`. Undecided alongside it: core declares `typescript`
and `ts-jest` as hard `dependencies`, where a package installed into arbitrary
consumer TS repos conventionally makes `typescript` a `peerDependency` — else
the consumer gets a second TypeScript their own `tsc` and our ts-morph can
disagree about. Fix both before any publish.

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

**Static analysis derives from the PARSED AST, NEVER from source text — no
exceptions.** Every fact the analyzer produces — coverage IDs, map-node
identity, predicates, operands, diff correspondence keys — is computed from
AST structure: node KINDS, resolved SYMBOLS (identifier/type names via the
checker), and literal VALUES (`getLiteralValue()`, not the quoted spelling).
Source formatting MUST NEVER enter identity or analysis: quote style (`"x"`
vs `'x'`), operator spacing (`a===b` vs `a === b`), reindentation, line-wrap,
and redundant parens must all be invisible to it. A coverage ID moves ONLY
when the logic moves (operand, operator, or literal value changes) — never
when the spelling changes. The ONLY place raw source text is allowed is
DISPLAY-only fields explicitly never read by analysis (`displayLines`,
`conditionText`) and cache keys over whole-file *content* (which are about
"did the bytes change", not "what does the code mean"). If the AST can't yet
be decomposed for some syntax, the fix is to build a normalized STRUCTURAL
projection of that node (node kind + children + leaf values) — the cache IS a
translated AST — NOT to fall back to `getText()`. Pulling text for static
analysis is a bug, full stop. (Reference: `ts-morph-extract-analysis-adapter.ts`
keys coverage IDs on the identifier SYMBOL name for simple operands and the
whole condition's structural projection otherwise; predicate operator/literal
come from node kind + `getLiteralValue()`. No `getText()` reaches any ID.)

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
same hashes, byte-identical serialization. The content-hash cache, ref-to-ref
semantic diffs (any ref's maps are recomputed from git blobs on demand — never
persisted), and CI cold-start all depend on it. No timestamps, randomness, or
map-ordering nondeterminism in any derived output.

**Ownership split (D12) — never blur it.** Machine-owned: assembled test files
in `.assayer/cache/` (never committed, never colocated, no manual edits, NO
representable skip). Authored + committed: harnesses — which are SPARSE,
LINT-INVOICED GAP-FILL (D19: the surface derives from the AST — selectors
from JSX, interactions from handlers, readiness from guards; a harness file
exists only where derivation provably fails: canvas interactions, selector
overrides, state wiring, correlations, and declarations as config-shaped
custom cases — closed vocabulary, never raw asserts) — plus named states
(`assayer/states/`), config/policies, repo-local plugins. No blessed/baseline images: visual diffs RUN both refs and
capture side-by-side at diff time. **No per-site waivers exist** —
the only don't-care is a GLOBAL rule/obligation toggle in config (per-site
suppression is an LLM abuse vector; if you don't care somewhere, you care
nowhere). Everything in
`.assayer/` commits EXCEPT `cache/`. Beyond the assembled test files, `cache/` also
holds two derived import-resolution artifacts, both content-keyed and rebuilt on
demand: the resolved-import index per namespace (`cache/resolved/<namespace>.json` —
each import reconciled to its canonical definition) and the external-signature cache
(`cache/external-signatures/<declHash>.json` — one package/builtin callable's declared
input/output types, keyed on the `.d.ts` byte hash and reused by every importer).
**Map-node IDs NEVER key committed
artifacts** — they are cache-internal; committed things key on user-chosen
names + file paths. Expectations are DERIVED (inputs, source literals, models,
consumer demands) — there is no authored "answers" artifact. **There is NO approval workflow:** the semantic diff is a ref-to-ref
review view (local default: merge-base with the default branch; pipeline:
explicit refs); the only gate is whether checks pass. Humans act on diffs by
directing the LLM, never by blessing records.

**Obligations key off consumption, never declaration.** Chain-follow to
consumption sites; declared-but-unconsumed surface is a lint error, not a test.
Pure passthrough plumbing is proven statically, never tested. Tests attach only
at transformation and consumption sites.

**Refusal beats testing (R10).** When ambiguity or redundancy can be made
unrepresentable (duplicate union enumerations, string-built SQL, two contracts
for one wire event), emit a build error demanding the canonical model — do not
generate tests around the ambiguity. Prose invariants in comments/docs are
bugs: convert them to enforced rules (checklist ratchet).

**Docs state the CURRENT truth, never history.** Every doc, plan, memory and
comment describes what IS — not what was, not what changed, not who fixed it.
Git carries history; a reference doc that narrates it is noise that ages badly.
**When something is fixed, DELETE the defect language — never annotate it as
resolved.** "X was impossible (now works)" still teaches the reader X is
fragile, and the next reader re-derives the dead conclusion from the half they
remember. If the fixed thing now works as anyone would assume, the correct
amount of documentation is NONE: say nothing and let the code be the record.
Only a CURRENTLY-TRUE constraint or a CURRENTLY-REAL defect earns words. Never
state a fact the repo already states — a `file:` dep documents itself.

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

**Every specimen owes every applicable feature, and the matrix decides which.** The
smoke-repo catalogue is walked off disk, never listed, so new syntax cannot arrive
untested — an undeclared specimen fails rather than being skipped, and a suite that
skipped a file looks exactly like one that passed it. A specimen DECLARES what it is
(`specimen-registry.ts`); the harness decides what that owes. The declaration is
authored by reading the file and NEVER generated from analyzer output — the matrix
must be able to disagree with the analyzer, which is P4 one rung up. See
`packages/core/CLAUDE.md` §6 before adding syntax.

**Four admissions, never merged — they differ in WHO OWES the work.** A GAP is the
caller's: "understood, but I cannot construct it" — a harness closes it. A DARK SPOT
is ASSAYER's: "I never understood this syntax" — no harness can help, and telling
the reader to fix their own for-loop is advice they cannot act on. UNDRIVEN is
Assayer's too but a different debt: "understood perfectly, and my execution model
cannot reach it" — a module scope whose branching turns only on values welded into
its own source has no input to vary, and a private reached only through a fixed
argument has a branch decided at authoring time. A LINT is the REPO's debt: a pattern
to change — a private nothing in its file consumes is dead surface, reachable from
nowhere, so the reader deletes it or wires it up.

The call graph IS followed (same-file): a private reached by a caller that passes its
own input straight through is DRIVEN, its branch covered through that caller
(`through-caller` access, the callee's exits arranged in the caller's params), never
admitted. So an UNDRIVEN private and the welded module scope owe the same text — a
branch with one possible outcome, decided in the source, that no feature will drive —
while a private nothing calls is the LINT and a private some caller CAN steer is just
driven. Never write an admission that reads as permanent when a feature would close it,
and never write one that promises a feature that cannot exist. (An `import` callee link is
RESOLVED: a post-compile stitch reconciles each import — via TypeScript's own module
resolution — to its canonical definition, classified `local` (a sibling file, keyed by its
repo-relative definition path with re-export barrels followed through) / `package` /
`builtin`, and pulls the declared input/output types of a called package or builtin through
a second, node_modules-aware project. An import that cannot be resolved is a hard BUILD ERROR
at the call site, the same class as a parse failure — a broken specifier
(`cannot-resolve-specifier`), a dynamic/computed specifier (`dynamic-or-computed-specifier`),
or a dependency shipping no usable types (`no-usable-types`) — NOT one of the four admissions;
the reader fixes the import, not their own code. What stays admitted is cross-file DRIVING:
arranging a callee's branches through a caller across a file boundary needs the cross-file
coverage-ID scheme and is a later rung. The callee link carries `unresolved` only for what a
single-file parse genuinely cannot name — a method or computed callee, a namespace member.)

All four ride on `FileAnalysis`, not merely the run artifact: the reads-as-complete lie
lives in the ANALYSIS, so a file admits them the moment it is opened, before anything
runs. They report on separate lines and must never be merged — folding two together
destroys the only thing they say. Severity is a GLOBAL per-channel config toggle:
`darkSpots: 'warn' | 'error'` defaults to `warn` because failing a build over work only
Assayer can do punishes the wrong party (it flips to `error` once the handler set
covers the main constructs), while `deadSurface: 'off' | 'warn' | 'error'` defaults to
`error` because dead code is the repo's own debt to fix. Per-file suppression does not
exist here either — same rule as every other don't-care.

## Anti-patterns (each one broke a real repo — see case-studies.md)

- Exposing a raw runner control "just this once."
- Committing or colocating generated tests; adding a skip mechanism.
- Deriving an expected value by running the implementation.
- Detecting anything by folder/file naming convention.
- Pulling source TEXT (`node.getText()`, condition strings) into any identity,
  coverage ID, predicate, or diff key. Derive from AST kinds/symbols/literal
  values; text is DISPLAY-only. A formatting-only edit that moves an ID is a bug.
- Two encodings of one concept (mode-as-string-prefix, twin contracts,
  re-enumerated unions) — refuse, don't accommodate.
- Enforcing an invariant via comment or doc instead of a rule.
- Narrating history in a doc ("this used to…", "previously broken", "now fixed")
  instead of stating only what is true now.
- Per-test/per-harness tuning knobs (timeouts, retries) instead of global
  config.
- Per-assertion `{ timeout }` on individual e2e statements — the global
  `expect.timeout` in `playwright.config.ts` owns it (only the post-launch
  first-paint keeps an explicit 30s override).
- Per-site suppressions/waivers of any kind — don't-cares are global rule
  config only.
- Testing tier-2 derivable logic through full-browser e2e (floor-ordering
  lesson: model-derived matrices run at unit speed; ONE e2e proves rendering).
