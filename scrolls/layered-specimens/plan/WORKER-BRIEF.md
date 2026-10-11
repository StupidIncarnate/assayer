# Standing worker brief

Every worker the operator dispatches for this plan reads this file, then its own task file, then the
`DESIGN.md` sections its task names. The operator's dispatch prompt names this brief, the task id and the
task file. It never repeats these rules.

`DESIGN.md` means `scrolls/layered-specimens/DESIGN.md`. It is the source of truth. Its "Decisions so far"
table is final. Never reopen a decision in it, and never edit `DESIGN.md`.

## Before you write anything

1. Call `get-architecture` and `get-testing-patterns` once. Call `get-folder-detail` once for each folder
   type your task writes into. Your task file names the folder type of every file.
2. Read the files your task lists under "Read first". Read `packages/core/CLAUDE.md` in full when your
   task touches `packages/core` or `packages/shared`.
3. Search with `discover` before you create a file. Extend an existing file when it already does the job.
4. Write only the files your task lists. When a listed file needs a change somewhere else, stop and report
   it in your reply. Never widen scope on your own.
5. Never fork, and never dispatch a sub-agent.
6. Never touch git, and never run a build. The operator stages, commits and builds.
7. Never edit `.claude/settings.json`, `.claude/settings.local.json`, `.mcp.json` or any `.env` file.
8. Never delete a file with `rm`. Move it with plain `mv` to `tmp/deletions/<task id>/<its repo-relative
   path>`, after `discover` proves nothing imports it or any name it exports. An importer that another task of
   the same row also moves does not block the move: the plan README's tracker lists every task of the row.
8a. Touch 1 to 3 files. A file and its test count as two. When your task needs a fourth file, stop and report it.
8b. When your task edits `packages/core/test/harnesses/specimen-registry.ts`, you are the only task in your row
    that does. Never edit it when your task does not list it.

## Repo rules every task obeys

- **Never hand-edit generated files under `smoke-repo/`.** Every file there is generator output, except six
  hand-written files in `smoke-repo/packages/syntax-repository/`: `package.json`, `tsconfig.json`,
  `jest.config.js`, `global-setup.js`, `global-teardown.js` and `concurrency-lock.js`, plus the two workspace
  packages `smoke-repo/packages/project-with-types/` and `smoke-repo/packages/project-without-types/`. Edit one of
  those hand-written files only
  when your task's file list names it. For everything else, change the generator or its declarations, then run
  `npm run generate:specimens`. The operator commits the generator change and the regenerated output together,
  because ward fails while they differ. The only tasks that run the generator are the ones whose file list says
  so.
- **Verify with three commands, each where your task says.** `npm run ward -- -- <every file you
  touched>`, `npm run test:syntax`, and `npm run test:generated -- <folder>/` one folder at a time. Never
  run `test:generated` with no folder: the whole suite runs out of memory, and from phase 8b on the wrapper
  refuses it. Never run two `test:generated` commands at once: the smoke repo's concurrency guard refuses the
  second.
- **Tests** use `toStrictEqual` and `toBe` only. No conditionals in a test, no hooks in a unit test, no
  `jest.mock` or `jest.spyOn`, the proxy pattern for anything crossing an I/O boundary. Error text is
  asserted word for word.
- **No source text in core analysis.** In `packages/core`, never call `getText()` outside the two places
  `packages/core/CLAUDE.md` section 5.1 sanctions. Read node kinds, resolved symbols, and literal values
  through `getLiteralValue()`. Never scan with `getDescendantsOfKind` or `forEachDescendant`, and never
  climb with `getFirstAncestor`.
- **No per-site waivers.** A "don't check this" is a repo-wide config toggle for a whole rule. Never add a
  way to silence one site.
- **Write plainly**, in code comments, JSDoc, error text and test names: one idea per sentence, define a
  term where you first use it, name who does what, present tense only. Never write "previously", "now
  fixed" or a count of things that grow.

## How every implementation file is written

These are the rules from `scrolls/specimen-generator/IMPLEMENTATION.md`, "Rules for every implementing
agent", which still hold:

1. Exactly one export per file, as `export const name = (...): ReturnType => ...`. The only `export class`
   is an error class in `errors/`. No default export. Re-export a type with `export type { X } from`.
2. Every function takes one object argument, destructured, with its type written inline, and declares
   its return type.
3. The file opens with the `PURPOSE` and `USAGE` block above the imports. Rewrite it once the code is
   done, so it describes the code you wrote.
4. Import every outside package and every Node built-in through `#gateway/<folder>/<subpath>`.
5. Respect the folder import rules. A transformer or guard never imports a broker.
6. No number in an expression except `-1`, `0`, `1` and array indexes. Every other number lives in a
   `statics/` file.
7. Our object types come from `contracts/`. Every Zod object and every string and number field in it is
   branded. A contract that holds TypeScript nodes or functions is types-only, with no test and no stub.
8. Never `any`, `as unknown as`, `@ts-ignore` or `@ts-expect-error`.
9. No `while (true)`. Use recursion with an early return.
10. No empty or silent `catch`. Every error message names what is wrong, where, and what would fix it.
11. Output is deterministic. Sort every list that reaches a file or a result. Never read the clock or
    `Math.random()` to decide output. Never let `Map` or `Set` iteration order decide output order. A cap on
    the prediction engine is a count (passes, steps, calls), never a wall-clock timeout. The generation cache
    never changes output: a cache hit returns exactly what a fresh run computes.
12. Generated code is built from syntax-tree nodes and parsed snippets, never by joining strings of code.
13. In `packages/specimen-generator`, only `brokers/specimen/observe/**` and
    `transformers/specimen-report-projection/**` (and, until row 9.6 deletes it,
    `transformers/specimen-outcome-projection/**`) may import `@assayer/core` or `@assayer/shared`, or read
    Assayer's types. Every other generator file must not. A prediction never
    comes from Assayer (rule P4).
14. A command refuses an argument it does not read, before it does anything, and names the flags it
    accepts.
14a. The generator reaches lockdown-kit's load balancer only through
    `#gateway/npm/legendscribe__lockdown-kit-load-balancer__brokers` (task 8b.1.1), never by importing
    `@legendscribe/lockdown-kit-load-balancer` directly.

## How every test is written

15. A unit test is `<file>.test.ts` beside the file. A startup or flow test is
    `<file>.integration.test.ts`. A broker and a responder each get a `.proxy.ts`. Transformers, guards,
    statics, errors and contracts get no proxy, except a layer file in `packages/core/src/transformers/walk-file/`,
    whose proxy is empty (`packages/core/CLAUDE.md` section 8).
16. Every `it` name starts with `VALID:`, `INVALID:`, `ERROR:`, `EDGE:` or `EMPTY:` and reads
    `{input} => result`.
17. Three or more cases that differ only by input use `it.each`, with the list derived from a statics file.
18. Cover every branch of the file under test: every `if`, `else`, ternary arm, `??`, `?.`, `catch`, and the
    empty, one and many case of every list.
19. Expected values are written by hand from what the code should do. Never run the code and paste its
    output into a test.

## Extra rules for a task in `packages/core` or `packages/shared`

20. Follow `packages/core/CLAUDE.md` section 6 exactly. A new construct starts with a hand-written specimen
    under `manual-smoke-repo/packages/syntax-repository/src/<bucket>/<category>/<rung>/<rung>.ts` and its
    `<rung>.test.ts`, then one line in `packages/core/test/harnesses/specimen-registry.ts`.
21. Write the registry line by reading the specimen file yourself. Never derive it from the analyzer's
    output. Never generate it.
22. A new handler is one `handle-<x>-layer-transformer.ts` plus exactly one route in
    `dispatch-node-layer-transformer.ts`. It returns `{ facts, descents }`, never recurses, never climbs.
23. Probe before you assert (`packages/core/CLAUDE.md` section 7): run a `npx tsx` probe script from your
    scratch folder to see the real values, then write the test's expected values by reasoning from the
    design, and treat any difference as a bug to report, not a value to copy.
24. Check determinism and formatting immunity with the same probe: a reformatted copy of the specimen gives
    identical coverage IDs.
25. Run `npm run test:syntax` as well as ward. Ward's core integration test
    `analyze-file-broker.integration.test.ts` cross-checks the registry, and `test:syntax` runs the
    specimens' own tests. Neither covers the other.
26. A `#gateway/...` import added to core's production code needs a line in a smoke repo's `tsconfig.json`
    `paths`. Report it in your reply instead of editing either smoke repo's config.

## Your reply

Reply in under 12 lines, in this form, and nothing longer. Never paste a transcript or a log.

```
DONE — <one line: what now exists>
FILES — <path> — <one line each>
WARD — <the exact ward command> — <exit code> — <run id>
OTHER CHECKS — <each other command and its result, or "none">
OPEN — <anything you could not do, or a change you need outside your files, or "none">
```
