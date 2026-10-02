# Assayer

## What Assayer is

Assayer is an npm package for TypeScript repos maintained by LLMs. It enforces
and generates tests.

Assayer reads a repo's parsed syntax tree and its type graph (how types and
symbols connect across files, as TypeScript's own checker sees them) to work
out, on its own, what SHOULD be tested. This is the same move ESLint makes:
fixed rules run over the parsed code, not a human's judgment call. Assayer
then compares what SHOULD be tested against what IS tested, and fails the
build when they disagree, the same way a broken compile fails the build.

Assayer owns its test runners and wraps them completely. Jest runs unit and
integration tests. Playwright runs end-to-end tests. A test in Assayer is
never a hand-written `it()` block. It is a declarative config structure that
Assayer builds and hands to the runner.

The core idea: intelligence lives in deterministic AST and type-graph
analysis, never in the LLM's judgment. Assayer derives its expected test
values from the code's own inputs, from source literals, from declared
models, and from what consumers of the code demand. It never derives an
expected value by running the code and recording what happened. An LLM
working in a repo with Assayer only authors three things: harnesses (small
hand-written files that supply what Assayer's analysis could not derive on
its own), named states, and config. When something is wrong, Assayer's build
error tells the LLM exactly what to fix.

## Where the design is written down

The `plan/` folder is the source of truth for Assayer's design:

- `plan/requirements.md` holds the principles, requirements, decisions, a
  glossary, and an inventory of artifacts. Some requirements are marked as
  BLOCKERS near the top. Do not implement past a blocker.
- `plan/expectation-catalog.md` maps syntax patterns to the kind of
  expectation Assayer generates for each one.
- `plan/case-studies.md` records the real incidents that motivated the
  design. It is the reasoning behind each rule.

This file summarizes the constraints that shape every implementation
decision. Where this file and a plan doc disagree on detail, the plan doc
wins.

Read `packages/core/CLAUDE.md` before touching the analyzer, the part of
Assayer that does the AST and type-graph work.

## Local setup

`@dungeonmaster/*` packages are `file:` dependencies. That means
`codex-of-consentient-craft` must be checked out as a sibling directory, next
to this repo, on disk.

Verify a change with both `npm run ward` and `npm run test:syntax`. Run
both commands. The specimen catalogue (the example files under
`smoke-repo/packages/syntax-repository` that exercise Assayer's supported
syntax) is not part of `ward`'s test graph, so `ward` alone will not catch a
regression there.

## Write in plain language, everywhere

Write plainly in chat replies, every file under `plan/`, this file, error
text, code comments, JSDoc, and commit messages. There is no place in this
project where dense writing is the right call.

Four rules make a violation checkable:

1. One idea per sentence. An em-dash holding two clauses together means
   split it.
2. Do not use a term of art without defining it right there, or avoid the
   term. Words like "specimen-able", "pinning", "folded private", "the
   invoice", "owed" mean nothing to a reader who has not read this file
   today.
3. Name who does what. Not "the invoice is filed against the host" but
   "Assayer reports the error on the outer function".
4. Lead with what changed and what it means for the reader. Background
   second.

A doc nobody can parse does not do the job a doc exists for. Dense writing
can look like precision. It is not. It reads as explanation while telling
the reader nothing, and that is exactly what makes it hard to notice.

## Describe only the current state

CLAUDE.md files, code comments, JSDoc, and test descriptions describe what
the code does now. Never write "used to do", "previously", "historically",
or "before the X fix". Git already holds the history. A doc does not need to
repeat it.

If the current design needs a reason, state the reason in the present tense,
for example "keys on toolUseId because...". Never state it as a contrast
with an implementation that used to exist. When you remove code, also
remove every comment that refers to the thing you removed.

## Driving the desktop app by hand

An LLM can inspect the real desktop UI directly, but not through a plain
browser at the dev URL. That is a dead end.

Every fact the renderer shows arrives over Electron's IPC channel, through
`window.assayerBridge`. Electron's preload script injects that object using
`contextBridge`. There is no HTTP API behind it. Outside Electron, that
global is `undefined`, so the app renders "No compiled surface" no matter
what is actually compiled.

Do not chase that empty state in a plain Chrome tab. Never stub the bridge
to make the page "work" either. A stubbed bridge only proves your stub data
renders. It proves nothing about Assayer.

Instead, attach to the real running app over Chrome DevTools Protocol (CDP).
Electron accepts a `--remote-debugging-port` flag, so one long-lived
Electron instance can be driven across many commands in a row. The
end-to-end (e2e) test harnesses cannot be used this way. Each one seeds a
throwaway temporary repo and tears it down after a single test.

Launch Electron with the debugging port open:

```bash
DISPLAY=:1 ASSAYER_DEV=1 npx electron packages/desktop/dist/bin/desktop-main.js \
  --repo /path/to/repo --remote-debugging-port=9222 &
```

Then attach with `chromium.connectOverCDP('http://127.0.0.1:9222')` and take
`contexts()[0].pages()[0]`. Playwright's own `close()` only detaches CDP. It
does not kill the window. From there the page is fully scriptable: take a
screenshot, click an element by its test ID, or call the bridge directly.
`window.assayerBridge.getCompiledTree()` answers with real data over real
IPC.

### Point `--repo` at the smoke-repo, never a random repo

`smoke-repo/packages/syntax-repository` is the canonical example repo, the
same catalogue of example files the e2e suite drives. Point `--repo` at a
cache compiled from it.

Populate that cache the same way the e2e suite does. The source of truth for
these steps is `packages/app/test/harnesses/smoke-repo-app.harness.ts`:

1. Write an `assayer.config.json` whose `repoRoot` is the ABSOLUTE path to
   the smoke-repo.
2. Run `node packages/cli/dist/bin/assayer.js status`, with the working
   directory set to the folder holding that config file. This precheck
   compiles the surface and writes the result into that folder's
   `.assayer/cache/`.
3. Launch Electron with `--repo <that config folder>`.

`repoRoot` says where the SOURCE is read from. The config folder is where
the cache is written, and it is what `--repo` points at. The two paths are
not the same thing. Once this is done, every example file shows up in the
tree: `cross-file-guards`, `same-file-predicate`, the switch and boolean
examples, and every other specimen.

### The flags

- `--repo` picks which repo's `.assayer/cache/` the app reads. The window
  only lists files that a compile has already written there.
- `ASSAYER_DEV=1` swaps the renderer from the built `app/dist/index.html` to
  the Vite dev server. That server must already be running (`npm run dev -w
  @assayer/app`), or the window loads nothing.
- `ASSAYER_HEADLESS=1` creates the window hidden. The e2e suite needs this,
  because it runs where no display exists.

### `npm run dev`

`npm run dev` first runs `npm run build`, which builds every package once,
in dependency order. Then it runs three kinds of watcher at once, under
`concurrently`:

- One `tsc -p packages/<pkg>/tsconfig.build.json --watch` per package, for
  `shared`, `core`, `desktop` and `cli`. Each one recompiles its package
  into that package's own `dist/` folder. The gateway packages are built
  once by `npm run build` and are not watched.
- The Vite server hot-reloads the renderer (React Fast Refresh), reached
  through `ASSAYER_DEV=1`.
- `nodemon` restarts the Electron main process whenever a watched `dist/`
  folder changes.

`nodemon.json` watches the desktop package's own `dist/`, plus the sibling
`core` and `shared` packages' `dist/` folders. Those siblings are named
explicitly because nodemon's watcher starts at the desktop package and never
climbs out of it on its own. The result: editing main-process, preload, or
analyzer code reopens the window. Editing renderer code swaps the UI in
place, without a restart.

`npm run dev` clears the field before it starts, by running `predev` and
then `dev:stop`. That is why running it a second time never stacks a second
window, and never fails against the dev server's `strictPort` setting. Two
details inside `dev:stop` matter and are not incidental:

- `dev:stop` kills the app process with `pkill -f '[d]esktop-main.js'`. The
  brackets around the `d` are load-bearing. They keep this pattern from also
  matching the shell command that is running `pkill` itself. Spelled without
  the brackets, the script would kill its own parent instead of the app.
  `nodemon` supervises the app process, and nodemon's own `--exec` flag also
  names `desktop-main.js` on nodemon's argv. If the pattern matched nodemon
  too, it would reap the supervisor along with the window it spawned. If
  that kill command is ever moved out of `dev:stop` and into
  `nodemon.json`, an orphaned nodemon supervisor would survive `dev:stop`
  and respawn against the next `npm run dev`.
- `dev:stop` kills the Vite dev server by its PORT: `fuser -k 6273/tcp`.
  Matching on the string `vite` instead would also kill an unrelated Vite
  server running for a different repo on the same machine.

## Constraints that shape every implementation decision

### Error text is a build error a human never has to translate

Every failure Assayer reports must name three things: what is wrong, where
it is, and what would satisfy the check. Write every error message so an
LLM can act on it without a human explaining it. A vague error message is a
bug. Tests assert the exact text of error messages, word for word.

Assayer's own code calls this class of error "P1": a build-blocking failure
that exits the process with code 1, the same class of error as a broken
import or a parse failure. You will see the term "P1" throughout the
codebase, in comments, test names, and error messages. This is what it
means every time.

### Detect by the type graph, never by convention

Detection logic must never assume anything about folder names, file names,
or one particular project's architecture. It may use only facts from
TypeScript's type graph, the checker's own model of how types and symbols
connect across the code.

Assayer must work standalone in any TypeScript repo. A repo that follows the
dungeonmaster conventions is a best-case input. It is never a required
input. The full requirement is P3 in `plan/requirements.md`.

### Degrade gracefully between two tiers of test generation

When the code declares its branching as data, for example an enum or a
literal union Assayer can enumerate, Assayer generates an exhaustive set of
test cases automatically. Call this tier 2.

When the code instead branches on imperative literal logic with nothing
declared, Assayer can still generate one skeleton test case per branch. It
cannot fill in the domain knowledge behind that branch on its own. Call this
tier 1.

Error text may nudge an author toward declaring the branching as data
instead, since that unlocks tier 2. It must never require the author to do
so.

### Static analysis reads only the parsed AST, never source text

Every fact the analyzer produces must be computed from the parsed AST: node
KINDS, resolved SYMBOLS (the identifier or type name the TypeScript checker
resolves it to), and literal VALUES read through `getLiteralValue()`, never
a literal's quoted spelling. This rule has no exceptions. It governs:

- coverage IDs: the identifiers Assayer assigns to one specific testable
  branch or exit, used to match a generated test case back to the code it
  covers, and to compare one version of a file against another
- map-node identity: the identity of a node in Assayer's internal model of
  a file's branches and exits
- predicates and operands: the condition an `if`, `switch`, or ternary
  checks, and the value it checks
- diff correspondence keys: the keys Assayer uses to match one version of a
  branch or exit against another when it compares two refs

Source formatting must never affect identity or analysis. Quote style
(`"x"` vs `'x'`), operator spacing (`a===b` vs `a === b`), reindentation,
line wrapping, and redundant parentheses must all be invisible to it. A
coverage ID may move only when the logic itself moves: an operand, an
operator, or a literal value changes. It must never move because of a
formatting-only edit.

Raw source text is allowed in exactly two places, and analysis never reads
either of them:

- fields that exist purely for display, such as `displayLines` and
  `conditionText`
- cache keys computed over a whole file's byte content, which exist to
  answer "did the bytes change", not "what does the code mean"

If the AST cannot yet be broken down for some syntax, build a normalized
structural projection of that node instead: its node kind, its children,
and its leaf values. Assayer's cache is a translated AST. Do not fall back
to `getText()`. Pulling text into static analysis is a bug, full stop.

For a concrete example, `project-node-layer-transformer.ts` builds the
structural projection a branch's coverage ID keys on. It writes each node
as its kind, each string or number literal as its value from
`getLiteralValue()`, and each identifier as its name. It skips redundant
parentheses. `read-condition-layer-transformer.ts` reads a predicate's
operator from the operator token's kind, and its literal through
`getLiteralValue()`. Neither file reads a condition's source text to
produce an ID.

### Never derive an expected value from the code under test

Generated expected values must come from the code's inputs, its declared
models, its observables (the pieces of state or output a consumer reads and
branches on), or from what a consumer of the code demands. They must never
come from running the implementation and recording what it produces. That
is a snapshot test, and a snapshot test can never disagree with the code it
snapshots. There is no separate "answers" file holding expected values
either: an expected value only ever exists as a derivation, computed fresh
each time.

This rule is why regenerating Assayer's test artifacts is always safe.
Nothing about the derivation could have baked in the current
implementation's own answer.

Assayer's own code calls this rule "P4". You will see the term throughout
the codebase, most often in a comment reading something like "never from
running the code (P4)".

### Every raw runner control stays wrapped

Jest and Playwright's raw controls are never exposed to an LLM authoring
tests: not in configs, not in harnesses, not in custom test cases. This is
an exclusive allowlist. Only capabilities Assayer has explicitly wrapped are
available. The full requirement is R1 in `plan/requirements.md`.

When a harness needs a capability Assayer does not yet expose, escalate in
this order:

1. Try to express it using the closed vocabulary Assayer already provides.
2. Failing that, add a GLOBAL, repo-level config control, for example a
   single timeout setting for the whole repo. A per-test timeout knob must
   never exist.
3. Only as a last resort, add a new wrapped capability to Assayer itself.

Every raw control that leaks through is an escape hatch an LLM can use to
write a test that only works one particular way. It also blocks Assayer
from ever swapping out the underlying runner.

### Determinism holds everywhere

The same code must always produce the same derived artifacts: the same
hashes, and byte-identical serialized output. No derived output may depend
on timestamps, randomness, or on the iteration order of a `Map` or `Set`
happening to come out one way instead of another.

Three things depend on this:

- the content-hash cache
- ref-to-ref semantic diffs. A diff between two git refs recomputes each
  ref's branch and exit maps from git blobs on demand. It never persists
  them.
- a cold start in CI, where nothing is cached yet

### Keep the ownership split clear between Assayer and the human

Assayer owns the assembled test files inside `.assayer/cache/`. These files
are never committed, never placed next to the source they test, never
hand-edited, and there is no way to mark one as skipped.

A human authors and commits everything else. The full requirement is D12 in
`plan/requirements.md`:

- harnesses
- named states, under `assayer/states/`
- stub corrections, under `assayer/stubs/`. A stub correction is a human's
  override of a value Assayer derived on its own. Assayer merges a stub
  correction with its own derived values when it reads them, and checks the
  correction against its derived values every time it runs: a correction
  that no longer matches anything real is a P1 build error. A stub
  correction is never part of any cache hash.
- config and policy files
- plugins local to this repo

### Harnesses fill only the gaps Assayer cannot derive on its own

Assayer derives as much of the test surface as it can straight from the
AST: it reads selectors from JSX, interactions from event handlers, and
readiness checks from guard conditions in the code. A harness file should
exist only where deriving that surface provably fails: canvas interactions,
selector overrides, wiring up state, correlating two pieces of behavior, and
declarations written as config-shaped custom test cases. A harness speaks
only Assayer's closed vocabulary. It never contains a raw assertion. The
full requirement is D19 in `plan/requirements.md`.

A harness lives next to the source file it covers, sharing the same base
name. It is always a `.ts` file, even beside a `.tsx` source file, so
`src/audit.ts` pairs with `src/audit.harness.ts`. A harness file exports
nothing. Its module body imports `assayerHarness` from `@assayer/core` and
calls it. That call is what registers the harness, the same way calling
`describe()` registers a Jest test suite. The whole vocabulary a harness
uses is a single `inputs` object, keyed first by the entry (the function or
component the harness supplies input for) and then by that entry's
parameter name.

Assayer finds harnesses by combining a file-name glob with a check on what
the file actually does. A file matching `*.harness.ts` that does NOT import
and call `assayerHarness` is treated as silently ordinary source, never as
an error. This matters because this repo's own Playwright and Jest test
harnesses also use the `.harness.ts` name, for something entirely
different. Loading one of those as if it were an Assayer harness would try
to boot Electron. A real Assayer harness is classified out of the surface
Assayer analyzes, and reading it means running it: Assayer transpiles the
file and evaluates it inside a bare `vm` sandbox whose only reachable
import is Assayer's own collector.

A harness key that names an entry or a parameter the target does not have,
or that names a parameter Assayer can already build a value for on its own,
is a P1 build error, the same channel and the same exit code as a broken
import.

A harness pays off exactly the debt that asked for it. Assayer tracks each
piece of test surface it could not derive as a debt owed against the code,
and calls closing that debt "paying" the gap. When Assayer builds the test
at run time, it re-derives the affected entry through the same case engine
it always uses, but with the harness's supplied parameter values bound to
their key paths (`inputs.<entry>.<param>`). A supplied test case differs
from a derived one in exactly that one bound value. Once a value is
supplied, that piece of the debt closes.

If a harness supplies only some of what was needed, the remaining debt
stays open, and Assayer's report names only what is still missing.

The supplied values themselves never travel inside a generated test case.
The generated test file loads the same harness file Assayer read at compile
time, and resolves each key live when the test runs. One harness
registration answers both the compile-time check and the run-time value
lookup.

If a generated test case names a key that the harness's current declaration
no longer supplies, that case is marked errored, and it names the missing
key. It never silently passes `undefined` as the argument instead.

### No blessed baseline images

Visual diffs run both refs being compared and capture their output
side-by-side at diff time. There is no such thing as a blessed or approved
baseline image stored for later comparison.

### No per-site waivers, ever

The only way to say "don't check this" is a single, repo-wide config toggle
for an entire rule or an entire class of obligation. There is no way to
suppress a check at one specific site in the code. A per-site suppression is
a tool an LLM can abuse to silence exactly the check that would catch its
own mistake. If you don't care about a check somewhere in the repo, that
means you don't care about it anywhere in the repo.

### What lives in `.assayer/`, and what doesn't

Everything under `.assayer/` is committed to git, except the `cache/`
folder. Besides the assembled test files, `cache/` holds these derived
artifacts. Every one is keyed on content or on repo layout, and every one
is rebuilt on demand, never hand-edited:

- `cache/resolved/<namespace>.json`: for each namespace, the index of every
  import reconciled to the file that canonically defines it.
- `cache/stubs/<namespace>.json`: for each namespace, the derived stub
  index. For every object type, this holds its full property list, with a
  value demand spliced onto each property Assayer saw a branch read, plus
  the list of files that read it.
- `cache/external-signatures/<declHash>.json`: one npm package or built-in
  callable's declared input and output types, keyed on the byte hash of its
  `.d.ts` file, and reused by every file that imports it.
- `cache/harness/<namespace>.json`: for each namespace, the inventory of
  every colocated `<basename>.harness.ts` file that registers with Assayer.
  It records the source file the harness applies to, and the sorted list of
  (entry, parameter) pairs it supplies values for. This index is keyed on
  three hashes. The first covers the repo layout and the second covers the
  tsconfig files. The third covers every harness file's path and bytes, plus
  the analysis options of the tsconfig that owns that harness, because
  Assayer reads each supplied value's type under those options. A harness
  file is classified out of the analyzed surface, so the first two hashes do
  not change when someone edits a harness. The third one does. Only the KEYS are cached here. The values themselves are
  callbacks, and Assayer resolves them by loading the harness file again at
  run time.

### Map-node IDs never appear in a committed file

Map-node IDs (the identities Assayer assigns to nodes in its internal model
of a file's branches and exits) exist only inside Assayer's cache. A
committed artifact is keyed on a name a human chose, plus a file path,
never on a map-node ID.

### There is no approval workflow

The semantic diff, Assayer's view comparing one git ref against another, is
a review tool, not a gate a human approves. Locally it defaults to comparing
against the merge-base with the default branch. In a pipeline it compares
two refs given explicitly. The only gate that exists is whether Assayer's
checks pass. A human acts on a diff by directing the LLM to make a change,
never by clicking approve on a stored record.

### An obligation attaches only where a value is consumed

Assayer chain-follows a value from where it is declared to every place it
is actually consumed, and attaches a test obligation only at those
consumption and transformation points. Surface that is declared but never
consumed is a lint error, not something Assayer tests. Plumbing that just
passes a value through unchanged is proven correct by static analysis
alone. It never needs a test.

### Refuse ambiguity and redundancy instead of testing around them

When ambiguity or redundancy in the code could be made unrepresentable, for
example one union enumerated in two places, SQL built by string
concatenation, or two separate contracts describing one wire event, emit a
build error demanding the author write one canonical model instead. Do not
generate tests that work around the ambiguity. The full requirement is R10
in `plan/requirements.md`.

### Turn a prose rule into an enforced one

A rule stated only as a comment or as prose in a doc is a bug waiting to
happen, because nothing enforces it. Convert it into a rule the tooling
checks instead.

### Docs state the truth as it is now, not its history

Every doc, plan, memory file, and comment describes what IS true, not what
used to be true, what changed, or who fixed it. Git already carries the
history. A reference doc that narrates history goes stale and becomes
noise.

### When a defect is fixed, delete the old defect language

Do not annotate a defect as resolved, for example "X was impossible (now
works)". That sentence still teaches the next reader that X is fragile, and
they will re-derive the same worry from the half of the sentence they
remember. If the fixed thing now behaves the way anyone would assume it
does, the correct amount of documentation is none at all. Say nothing and
let the code be the record.

Only write words about a constraint that is currently true, or a defect
that is currently real. Never restate a fact the repo already states on its
own. A `file:` dependency in `package.json` already documents itself.

### One rule engine, one plugin pattern

Assayer's rules emit exactly three kinds of output: obligations (a test
that must exist and pass), lints (a pattern in the repo that should
change), and refusals (a build error demanding a different design). One
engine produces all three kinds.

Every extension to Assayer, including every plugin, goes through the same
pattern. A rule declares what syntax pattern it looks for, and answers one
of four callbacks keyed to a phase of Assayer's processing: detect a
pattern, tap into it to record facts, observe it at runtime, or display it
in the UI. Plugins are subscribers to this pattern. They declare what
they're looking for and answer these phase callbacks. Assayer core owns all
traversal of the code, all following of chains across files, and all ID
assignment. A plugin never parses code itself. The full requirement is R15
in `plan/requirements.md`.

### A plugin must be something an LLM can author from the docs alone

A user will point an LLM at Assayer's docs and say "write me a plugin for
three.js." If authoring a plugin requires understanding Assayer's
internals, the plugin API has failed its job. Assayer validates a plugin
with the same P1-grade errors it uses everywhere else, so a plugin an LLM
gets wrong is just another fixable build error, not a dead end.

### Keep core lean; put tech-specific code in its own package

Core never depends on a specific consumer technology: no imports of `pg`,
`mongo`, or `react-hook-form` inside core. Integrations with a specific
technology ship as their own `@assayer/*` package. Running `assayer init`
auto-detects which of these a repo needs and wires them in. Core owns
checking that a plugin's declared version range is compatible, and reports
a mismatch with the same P1-grade errors as everything else. The full
requirement is R17 in `plan/requirements.md`.

### Assayer tests itself the ordinary way

Assayer's own test suite is plain Jest and Playwright, following the same
dungeonmaster testing standards used elsewhere. Assayer never verifies
itself using its own config format, because that would let a bug in the
format hide from its own tests. Its integration tests run the CLI and the
analyzer against fixture repos, and assert on the output: the generated
test skeletons, the exact error text, and the coverage reports. The full
requirement is R16 in `plan/requirements.md`.

### Every specimen owes every feature that applies to it

The example files under `smoke-repo/packages/syntax-repository` are called
specimens. Each one is a small example file that demonstrates one syntax
pattern. Assayer's test suite walks that catalogue directly off disk. The
list of specimens is never hand-maintained anywhere else, so a new example
cannot arrive without being tested. A specimen that has not been declared
fails the suite outright, rather than being silently skipped. This matters
because a suite that skipped a file would look identical, from its output,
to a suite that ran the file and passed it.

Each specimen declares what it is inside
`packages/core/test/harnesses/specimen-registry.ts`, and that declaration
decides which checks the specimen owes. Author that declaration by reading
the specimen file yourself. Never generate it from what the analyzer
currently outputs. The whole point of a hand-authored declaration is that
it can disagree with the analyzer. A generated declaration could never do
that: it would just be deriving an expected value from the code's own
output, one level up. See `packages/core/CLAUDE.md`, section 6, before
adding a new specimen.

### Four kinds of admission, and they are never merged

When Assayer cannot fully test something, it admits that gap using one of
exactly four kinds. They differ in who owes the resulting work:

- **Gap.** The caller's debt. Assayer understood the code, but could not
  construct a value to test it with. A harness pays this off.
- **Dark spot.** Assayer's own debt. Assayer never understood this piece of
  syntax at all. No harness can help here, because telling the reader to
  fix code Assayer itself cannot parse is advice they cannot act on.
- **Undriven.** Also Assayer's own debt, but a different one. Assayer
  understood the code perfectly, but its execution model cannot reach the
  branch. For example, a module-level scope whose branching depends on an
  opaque value (the result of a function call, an imported binding, or a
  computed expression) gives Assayer nothing a test case can set, and
  nothing the analyzer can fold into a known value. Or: a closure gets
  returned and is applied later by an external caller, so no input this
  file provides can decide which way its parameter branches.
- **Lint.** The repo's own debt: a pattern that should change. A private
  function that nothing else in its file uses, whether by calling it or by
  passing it anywhere, is dead code, reachable from nowhere. The reader
  should delete it or wire it up.

Assayer does follow the call graph within a single file. If a private
function is reached by a caller that passes its own input straight
through, Assayer treats that function as driven. Its branches are covered
through that caller, by arranging the callee's exits using the caller's own
parameters. Assayer never admits a gap or dark spot for a branch like that.

A branch that reads an object's property, for example `if (config.mode ===
'a')`, is undriven when Assayer looks at one file alone, because it cannot
arrange a value for one property of an object parameter on its own. But at
the moment Assayer builds and runs the test, that branch IS driven: Assayer
combines its own derived value demands for that property with any human
correction committed under `assayer/stubs/`, and arranges the object
parameter from that combined view. Each branch arm then becomes a real,
runnable test case. A human's correction here is safe under the "never
derive an expected value from the code" rule, because it is an input
flowing into a runnable case, and the case checks that execution reaches
the right branch structurally. It never checks a returned value.

A branch checked against a literal constant Assayer already knows the value
of is not undriven at all. It is evaluated directly. Assayer knows there is
exactly one possible value, so the arm that value satisfies becomes a real
test case, and the arm that value could never satisfy becomes a different
kind of report: an "unreachable exit" lint, meaning dead code the repo
should remove. Assayer calls a branch like this "welded" to that constant.
The same mechanism covers every place a branch can be welded to a known
value: a same-file `const level = 7`, a literal argument at a call site
(`decide(3)`), or a value passed directly into an immediately-invoked
function (`((n) => ...)(7)`). An immediately-invoked function also runs
automatically the moment its module loads, so it is also driven by whatever
else that module's own load-time code reads, the same way a plain top-level
branch is. A private function nothing calls is the lint case above. A
private function some caller can steer is simply driven.

Never write an admission that reads as permanent if a future feature could
close it. Never write one that promises a feature Assayer cannot actually
build.

### Resolving an import is a hard build error, not one of the four admissions

When code calls into an imported name, a separate pass after the main parse
reconciles that import to its real definition, using TypeScript's own
module resolution. It classifies the result as one of:

- `local`: a sibling file in the same repo, keyed by that file's
  repo-relative path. A re-export barrel file is followed through to the
  real definition.
- `package`: an npm package.
- `builtin`: a Node.js or TypeScript built-in.

That same pass also reads the declared input and output types of an
imported package or built-in callable, using a second parse project set up
just for that purpose, one that is aware of `node_modules`.

An import that cannot be resolved is a hard build error at the call site,
the same class of error as a parse failure, never one of the four kinds of
admission above. The reader needs to fix the broken import, not their own
code's logic. There are three reasons an import can fail to resolve:

- `cannot-resolve-specifier`: the import path itself is broken.
- `dynamic-or-computed-specifier`: the import path is computed at runtime
  instead of written as a literal, so Assayer cannot resolve it statically.
- `no-usable-types`: the dependency ships no usable type information.

What does stay an admission is cross-file driving: arranging a callee's
branches through a caller when the caller lives in a different file needs a
coverage-ID scheme that spans files, and that does not exist yet. A callee
link is marked `unresolved` only for what a single-file parse genuinely
cannot name on its own: a method call, a computed callee, or a namespace
member.

All four kinds of admission, and the resolved or unresolved state of every
import, live on `FileAnalysis`, the full analysis Assayer produces for one
file. They do not live merely on the record of one particular test run.
This is deliberate: the moment Assayer opens a file, before anything runs,
that file's analysis already admits everything Assayer could not do with
it. Each of the four kinds reports on its own separate line, and they must
never be merged into one. Folding two of them together would destroy the
one thing that makes each of them useful: knowing exactly who owes the fix.

### Severity toggles are global, per category, never per site

- `darkSpots` can be `'warn'` or `'error'`, and defaults to `'warn'`.
  Failing the whole build over work only Assayer itself can do would punish
  the wrong party. This should default to `'error'` only once the current
  set of syntax handlers covers the main language constructs.
- `deadSurface` can be `'off'`, `'warn'`, or `'error'`, and defaults to
  `'error'`. Dead code is the repo's own debt, and the repo should fix it.

There is no way to suppress either of these for one specific file. The same
rule that forbids per-site waivers everywhere else applies here too.

## Anti-patterns

Every pattern below broke a real repo. See `plan/case-studies.md` for the
incidents.

- Exposing a raw runner control "just this once."
- Committing generated test files, or placing them next to their source, or
  adding any mechanism to mark one as skipped.
- Deriving an expected test value by running the implementation.
- Detecting anything by folder name or file name convention.
- Pulling source text, such as `node.getText()` or a condition's literal
  string, into any identity, coverage ID, predicate, or diff key. Derive
  these from AST kinds, resolved symbols, and literal values instead. Text
  is for display only. A formatting-only edit that moves a coverage ID is a
  bug.
- Encoding one concept two different ways: a mode smuggled as a string
  prefix, two separate contracts for one thing, a union re-enumerated in a
  second place. Refuse this pattern with a build error. Do not build
  tooling that accommodates it.
- Enforcing an invariant with a comment or a doc instead of a rule the
  tooling checks.
- Narrating history in a doc, for example "this used to...", "previously
  broken", "now fixed", instead of stating only what is true right now.
- Adding a per-test or per-harness tuning knob, like a timeout or a retry
  count, instead of a global config setting.
- Adding a per-assertion `{ timeout }` to one e2e statement. The global
  `expect.timeout` setting in `playwright.config.ts` owns every timeout. The
  one exception is the explicit 30-second override on the check immediately
  after launch, for the very first paint.
- Any kind of per-site suppression or waiver. A don't-care is global rule
  config, and nothing else.
- Testing logic Assayer can derive at tier 2 through a full-browser e2e
  test. The lesson here came from floor ordering: a model-derived matrix of
  cases should run at unit-test speed, and a single e2e test is enough to
  prove that the UI renders correctly.
