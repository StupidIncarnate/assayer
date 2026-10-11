# Layered specimens: the implementation plan

This plan rebuilds the specimen generator in `packages/specimen-generator` to the model in
[`../DESIGN.md`](../DESIGN.md). It then changes Assayer's core wherever a DESIGN.md card predicts something core
does not do yet. DESIGN.md is the source of truth. Its "Decisions so far" table is final, and this plan never
reopens a row of it.

- Phases 1 to 10 rewrite the generator. A piece carries a tag, a slot sets a position, and a piece declares its
  arms per position. Levels stop at 2, or 3 for objects and arrays. The planner crosses an axis only where a
  piece declares it.
- The generator predicts every report channel of every specimen from the declarations alone. It derives an input
  for each arm from that arm's condition, runs the rendered specimen in a sandbox, and records which arms each
  input reaches. It never runs Assayer and never reads its output (rule P4).
- It writes a test that compares the prediction with what Assayer reports. A specimen whose core gap is still
  open is written as `it.failing`.
- Phase 8b makes generation and the generated run take machine capacity through lockdown-kit's load balancer, and
  gives generation a content-keyed cache.
- Phases 11 to 26 close the core gaps, one subsystem at a time. Each ends by removing its gap ids, regenerating,
  and running the whole generated suite. Phase 26 makes Assayer derive the stub values the generated tests compare.
- Phase 27 settles the cards still on the card-check exclusion list as `disputed`, once the user has answered.

The operator runs this plan with the operator skill (`brutalpit/.agents/skills/operator/SKILL.md`). Every task file
names its exact files, contracts, tests and commands, so no phase needs a planner (the skill's "Skip Rule"). Every
task touches 1 to 3 files. A file and its test count as two files.

## Contents

- [How to run the plan](#how-to-run-the-plan)
- [Execution Progress Tracker](#execution-progress-tracker)
- [Phases and tasks](#phases-and-tasks)
- [Reference](#reference)
- [Open questions for the user](#open-questions-for-the-user)
- [Coverage matrix](#coverage-matrix)

## How to run the plan

### Before the first row

1. Open a worktree: `mcp__lockdown-kit__create-worktree({ name: 'layered-specimens' })`. All work happens in
   `worktrees/layered-specimens/`. Pass that path as `root` to `discover`, `get-project-map` and
   `get-project-inventory`.
2. Read [`WORKER-BRIEF.md`](WORKER-BRIEF.md). It is the standing brief every worker reads. A dispatch prompt says
   only: "Read `scrolls/layered-specimens/plan/WORKER-BRIEF.md`, then
   `scrolls/layered-specimens/plan/<phase folder>/<task file>`, then do the task." Add the worktree path.
3. Create the Claude Code keepalive cron once (skill section 3).

### Every row

1. Announce each task. Dispatch the row's tasks in one call, up to 3 at a time, with the model each task file
   names. A fully specified task names `default`: dispatch it with the worker's default model, never `opus`. Only a
   fan-out task, whose cause is found by reading a failure, and the triage task 10.2.1 name `opus`. Feed the rest of
   the row in as workers finish.
2. When the row is done, run `npm run ward -- --changed` with `timeout: 600000`. Run the extra commands the phase
   gate table names for that phase. Fix any red with the next dispatch, never by carrying it into the next row.
3. Stage explicit paths, update this README's tracker in the same commit, and commit.
4. A row never holds two tasks that edit the same file. In core phases only one task per row edits
   `packages/core/test/harnesses/specimen-registry.ts`.

Rows that need more than the steps above:

- **A fan-out row** has its own row in the tracker and one definition file, `<row id>-fan-out.md` (task 7.4's is
  `7.4-card-fixes.md`): rows 7.4, 10.4, 11.6, 12.10, 13.6, 13.10, 14.6, 15.8, 20.9, 21.16, 24.12, 26.5 and 27.2. The
  tasks before it report a list of failing items. The operator groups them, at most 3 files a group, writes a real task
  file `<row id>.<n>-<slug>.md` for each group from the definition, adds the ids to the tracker, then dispatches them
  like any other row. No task outside a fan-out row creates a fan-out task.
- **Rows 9.3 and 9.4 are one commit.** Row 9.3 is never committed alone: its `--check` integration case fails until
  task 9.4.1 regenerates the smoke repo. Task 9.4.1 regenerates and commits the generator change and the whole
  regenerated smoke repo together, because ward fails while they differ.
- **Every core phase's last row** (the "close today gaps" task) regenerates the smoke repo. The operator commits
  the today-statics change and the regenerated output together.
- **An operator row** (4.9.1, 7.5.1, 8b.7.1, 9.4.1, 10.3.1, 27.1.1) has no worker. Its task file lists the operator's
  steps. Task 8b.7.1 edits the root `CLAUDE.md`, which the operator may do because it is markdown.

### Every phase

1. After the last row, dispatch one `batch_reviewer` for the phase (skill section 2.E). It runs
   `npm run ward -- --changed`.
2. Run the phase-end commands from the gate table.

### Phase gates

Ward never runs the generated tests and never runs `test:syntax`. These commands gate each phase:

| Phases | After every row | At phase end |
|---|---|---|
| 1 | `npm run ward -- --changed` | `npm run generate:specimens -- --check` exits 0 (the old pipeline is untouched) |
| 2, 3 | `npm run ward -- --changed` | `npm run generate:specimens -- --list-pieces` and `-- --check` both exit 0 |
| 4 | `npm run ward -- --changed` | `npm run generate:specimens -- --count` prints the report; task 4.9.1 records it |
| 5, 6, 8, 8b | `npm run ward -- --changed` | `npm run generate:specimens -- --check` exits 0; phase 6 also `-- --show=src/if/alone` |
| 7 | `npm run ward -- --changed` (it runs the card check) | task 7.5.1 |
| 9 | `npm run ward -- --changed`; row 9.4 also `npm run generate:specimens` and `npm run typecheck:generated` | `npm run generate:specimens -- --check` and `npm run typecheck:generated` |
| 10 | (task 10.1.1 runs every top folder) | task 10.3.1 |
| 11 to 26 | `npm run ward -- --changed`. `npm run test:syntax` may be red only between a core row and the fan-out row that follows it | `npm run test:syntax`; `npm run generate:specimens -- --check`; the whole generated suite, every top folder, one at a time (below) |
| 27 | `npm run ward -- --changed` (it runs the card check) | `npm run generate:specimens -- --check` |

**The whole generated suite after every core phase.** A core change can move a specimen no today id names. So at
the end of every phase from 11 to 26 the operator lists the top folders under
`smoke-repo/packages/syntax-repository/src/` and runs `npm run test:generated -- <folder>/` for each, one at a time,
with `timeout: 600000`. Every folder must pass. A red folder becomes a fan-out row added after the phase's last row,
`<phase>.<last row + 1>`, with a definition file written the way `10.4-fan-out.md` is, and triaged the way phase 10
triages.

Never run `npm run test:generated` with no folder. The wrapper task 8b.3.1 writes refuses it, because the whole
suite runs out of memory in one process. Never run two at once: the smoke repo's concurrency guard refuses the second
(`smoke-repo/packages/syntax-repository/concurrency-lock.js`).

### How the operator tells an expected failure from a regression

A DESIGN.md card predicts what Assayer should do, so its specimen fails until a core phase lands (DESIGN.md "How the
matrix is built", step 8). The plan makes that mechanical, so the generated suite is never red because of a known
gap:

1. `packages/specimen-generator/src/statics/today/today-statics.ts` (task 1.1.5) lists every known gap with an id, a
   sentence saying what Assayer does today, the phase that closes it, and a `match` rule ([Today gaps](#today-gaps)).
2. The generator matches every specimen against those rules (task 6.2.6). A specimen that matches is written as
   `it.failing` with a comment naming the ids (task 8.2.2). `EXPECTED-FAILURES.md` lists it by id (task 9.1.2).
3. Jest reports an `it.failing` test as **passed** while its assertion fails. So a known gap is green.
4. A red result from `npm run test:generated -- <folder>/` is therefore one of two things:
   - a specimen with no today id whose observation differs from its prediction: a real regression, or a new
     disagreement for triage (phase 10's method);
   - an `it.failing` specimen whose assertion now passes: Assayer has closed that gap. Run the closing core phase's
     last task, which removes the id and regenerates.
5. An `it.failing` test hides any other failure inside the same specimen until its last gap closes. It also hides a
   crash: a test whose observation throws before it asserts counts as a failed assertion, so `it.failing` reports it
   as passed. That is the price of never deriving a "today" prediction from Assayer's output, which rule P4 forbids.
6. The strict run makes both visible. With `ASSAYER_SPECIMEN_STRICT=1`, every generated test runs as a plain `it`
   (task 8.2.2). Task 10.1.1 runs every folder that way once, and every close task runs its folders that way after it
   removes its ids: each specimen that still carries an id must fail with a diff a remaining id explains. A specimen
   that passes under the strict run shows that a later id's `match` rule is too broad, and the close task narrows it. A
   specimen that errors is a crash, reported as a regression.

### Builds, deletions, the brief and hand-written files

- No row builds, with one exception. Ward and `npm run generate:specimens` (which runs from source with `tsx`) read
  source. Phases 20 and 21 change `packages/cli`, whose integration tests spawn the built CLI. Before those phases'
  reviews, and before row 21.15 (its task adds CLI integration cases), the operator runs
  `npm run build --workspace=@assayer/shared --workspace=@assayer/core --workspace=@assayer/cli`.
- After row 8b.1 the operator runs `npm install` once, so the workspace links the load balancer the gateway package
  now depends on (task 8b.1.1).
- A deleted file is moved to `tmp/deletions/<task id>/<path>` with plain `mv` (skill section 2.F).
- When row 9.6 lands, the operator removes the old-projection exception from `WORKER-BRIEF.md` rule 13.
- Six files under `smoke-repo/packages/syntax-repository/` are hand-written, never generated: `package.json`,
  `tsconfig.json`, `jest.config.js`, `global-setup.js`, `global-teardown.js` and `concurrency-lock.js`. Only a task
  whose file list names one of them may edit it. Task 9.1.5 edits `package.json` and `tsconfig.json`. The two
  workspace packages `smoke-repo/packages/project-with-types/` and `smoke-repo/packages/project-without-types/` are
  hand-written too (tasks 9.1.7, 9.1.8). Every other file under `smoke-repo/` is generator output and is never
  edited by hand.

### Execution Progress Tracker

```text
Phase 1 (Vocabulary: statics, contracts and the kit · [PENDING])
  #1  1.1.1 [ ]  1.1.2 [ ]  1.1.3 [ ]  1.1.4 [ ]  1.1.5 [ ]  1.1.6 [ ]  1.1.7 [ ]  1.1.8 [ ]
  #2  1.2.1 [ ]  1.2.2 [ ]  1.2.3 [ ]  1.2.4 [ ]  1.2.5 [ ]  1.2.6 [ ]  1.2.7 [ ]  1.2.8 [ ]
  #3  1.3.1 [ ]  1.3.2 [ ]  1.3.3 [ ]  1.3.4 [ ]  1.3.5 [ ]
  #4  1.4.1 [ ]  1.4.2 [ ]  1.4.3 [ ]

Phase 2 (Loading pieces · [PENDING])
  #1  2.1.1 [ ]  2.1.2 [ ]  2.1.3 [ ]
  #2  2.2.1 [ ]
  #3  2.3.1 [ ]
  #4  2.4.1 [ ]
  #5  2.5.1 [ ]
  #6  2.6.1 [ ]  2.6.2 [ ]  2.6.3 [ ]  2.6.4 [ ]  2.6.5 [ ]
  #7  2.7.1 [ ]

Phase 3 (Declare every piece · [PENDING])
  #1  3.1.1 [ ]  3.1.2 [ ]  3.1.3 [ ]  3.1.4 [ ]  3.1.5 [ ]  3.1.6 [ ]  3.1.7 [ ]  3.1.8 [ ]  3.1.9 [ ]
      3.1.10 [ ]  3.1.11 [ ]  3.1.12 [ ]  3.1.13 [ ]  3.1.14 [ ]  3.1.15 [ ]  3.1.16 [ ]  3.1.17 [ ]  3.1.18 [ ]
      3.1.19 [ ]  3.1.20 [ ]  3.1.21 [ ]  3.1.22 [ ]  3.1.23 [ ]  3.1.24 [ ]  3.1.25 [ ]  3.1.26 [ ]  3.1.27 [ ]
      3.1.28 [ ]

Phase 4 (Planner and count · [PENDING])
  #1  4.1.1 [ ]  4.1.2 [ ]  4.1.3 [ ]
  #2  4.2.1 [ ]
  #3  4.3.1 [ ]  4.3.2 [ ]  4.3.3 [ ]  4.3.4 [ ]
  #4  4.4.1 [ ]  4.4.2 [ ]  4.4.3 [ ]
  #5  4.5.1 [ ]
  #6  4.6.1 [ ]
  #7  4.7.1 [ ]  4.7.2 [ ]
  #8  4.8.1 [ ]
  #9  4.9.1 [ ]

Phase 5 (Rendering · [PENDING])
  #1  5.1.1 [ ]  5.1.2 [ ]  5.1.3 [ ]
  #2  5.2.1 [ ]  5.2.2 [ ]
  #3  5.3.1 [ ]
  #4  5.4.1 [ ]

Phase 6 (Prediction engine · [PENDING])
  #1  6.1.1 [ ]  6.1.2 [ ]  6.1.3 [ ]  6.1.4 [ ]  6.1.5 [ ]  6.1.6 [ ]
  #2  6.2.1 [ ]  6.2.2 [ ]  6.2.3 [ ]  6.2.4 [ ]  6.2.5 [ ]  6.2.6 [ ]
  #3  6.3.1 [ ]
  #4  6.4.1 [ ]  6.4.2 [ ]
  #5  6.5.1 [ ]  6.5.2 [ ]
  #6  6.6.1 [ ]

Phase 7 (The DESIGN.md cards · [PENDING])
  #1  7.1.1 [ ]
  #2  7.2.1 [ ]  7.2.2 [ ]  7.2.3 [ ]  7.2.4 [ ]  7.2.5 [ ]  7.2.6 [ ]  7.2.7 [ ]  7.2.8 [ ]  7.2.9 [ ]
  #3  7.3.1 [ ]
  #4  (7.4.<n> fan-out tasks; 7.4-card-fixes.md)
  #5  7.5.1 [ ]

Phase 8 (Observation and the generated test · [PENDING])
  #1  8.1.1 [ ]  8.1.2 [ ]  8.1.3 [ ]  8.1.4 [ ]
  #2  8.2.1 [ ]  8.2.2 [ ]
  #3  8.3.1 [ ]

Phase 8b (Running at scale: load balancer and generation cache · [PENDING])
  #1  8b.1.1 [ ]  8b.1.2 [ ]  8b.1.3 [ ]
  #2  8b.2.1 [ ]  8b.2.2 [ ]  8b.2.3 [ ]  8b.2.4 [ ]  8b.2.5 [ ]
  #3  8b.3.1 [ ]
  #4  8b.4.1 [ ]
  #5  8b.5.1 [ ]
  #6  8b.6.1 [ ]
  #7  8b.7.1 [ ]

Phase 9 (Build, switch over and clean up · [PENDING])
  #1  9.1.1 [ ]  9.1.2 [ ]  9.1.3 [ ]  9.1.4 [ ]  9.1.5 [ ]  9.1.6 [ ]  9.1.7 [ ]  9.1.8 [ ]
  #2  9.2.1 [ ]
  #3  9.3.1 [ ]  9.3.2 [ ]  9.3.3 [ ]  9.3.4 [ ]
  #4  9.4.1 [ ]
  #5  9.5.1 [ ]
  #6  9.6.1 [ ]  9.6.2 [ ]  9.6.3 [ ]  9.6.4 [ ]  9.6.5 [ ]  9.6.6 [ ]  9.6.7 [ ]
  #7  9.7.1 [ ]  9.7.2 [ ]  9.7.3 [ ]  9.7.4 [ ]  9.7.5 [ ]  9.7.6 [ ]  9.7.7 [ ]  9.7.8 [ ]
  #8  9.8.1 [ ]

Phase 10 (Run the generated suite and triage · [PENDING])
  #1  10.1.1 [ ]
  #2  10.2.1 [ ]
  #3  10.3.1 [ ]
  #4  (10.4.<n> fan-out tasks; 10.4-fan-out.md)

Phase 11 (Core: value-position &&, || and ?? · [PENDING])
  #1  11.1.1 [ ]
  #2  11.2.1 [ ]  11.2.2 [ ]  11.2.3 [ ]
  #3  11.3.1 [ ]
  #4  11.4.1 [ ]
  #5  11.5.1 [ ]
  #6  (11.6.<n> fan-out tasks; 11.6-fan-out.md)
  #7  11.7.1 [ ]

Phase 12 (Core: the cause rule, edge values, optional properties and gap names · [PENDING])
  #1  12.1.1 [ ]  12.1.2 [ ]  12.1.3 [ ]  12.1.4 [ ]  12.1.5 [ ]  12.1.6 [ ]  12.1.7 [ ]
  #2  12.2.1 [ ]  12.2.3 [ ]  12.2.4 [ ]  12.2.5 [ ]  12.2.6 [ ]
  #3  12.3.1 [ ]  12.3.2 [ ]  12.3.3 [ ]  12.3.4 [ ]
  #4  12.4.1 [ ]
  #5  12.5.1 [ ]  12.5.2 [ ]  12.5.3 [ ]  12.5.4 [ ]
  #6  12.6.1 [ ]  12.6.2 [ ]  12.6.3 [ ]
  #7  12.7.1 [ ]
  #8  12.8.1 [ ]
  #9  12.9.1 [ ]
  #10 (12.10.<n> fan-out tasks; 12.10-fan-out.md)
  #11 12.11.1 [ ]

Phase 13 (Core: defaults as branches · [PENDING])
  #1  13.1.1 [ ]
  #2  13.2.1 [ ]  13.2.2 [ ]
  #3  13.3.1 [ ]  13.3.2 [ ]
  #4  13.4.1 [ ]  13.4.2 [ ]
  #5  13.5.1 [ ]
  #6  (13.6.<n> fan-out tasks; 13.6-fan-out.md)
  #7  13.7.1 [ ]
  #8  13.8.1 [ ]  13.8.2 [ ]
  #9  13.9.1 [ ]
  #10 (13.10.<n> fan-out tasks; 13.10-fan-out.md)
  #11 13.11.1 [ ]

Phase 14 (Core: loops · [PENDING])
  #1  14.1.1 [ ]  14.1.2 [ ]
  #2  14.2.1 [ ]  14.2.2 [ ]  14.2.3 [ ]  14.2.4 [ ]
  #3  14.3.1 [ ]  14.3.2 [ ]
  #4  14.4.1 [ ]
  #5  14.5.1 [ ]
  #6  (14.6.<n> fan-out tasks; 14.6-fan-out.md)
  #7  14.7.1 [ ]  14.7.2 [ ]
  #8  14.8.1 [ ]

Phase 15 (Core: compound assignment, loop-written variables, call sequences · [PENDING])
  #1  15.1.1 [ ]  15.1.2 [ ]  15.1.3 [ ]  15.1.4 [ ]  15.1.5 [ ]  15.1.6 [ ]
  #2  15.2.1 [ ]  15.2.2 [ ]  15.2.3 [ ]  15.2.4 [ ]  15.2.5 [ ]  15.2.6 [ ]
  #3  15.3.1 [ ]  15.3.2 [ ]  15.3.3 [ ]  15.3.4 [ ]  15.3.5 [ ]
  #4  15.4.1 [ ]  15.4.2 [ ]  15.4.3 [ ]
  #5  15.5.1 [ ]  15.5.2 [ ]
  #6  15.6.1 [ ]  15.6.2 [ ]  15.6.3 [ ]
  #7  15.7.1 [ ]  15.7.2 [ ]  15.7.3 [ ]
  #8  (15.8.<n> fan-out tasks; 15.8-fan-out.md)
  #9  15.9.1 [ ]
  #10 15.10.1 [ ]
  #11 15.11.1 [ ]

Phase 16 (Core: try and await · [PENDING])
  #1  16.1.1 [ ]  16.1.2 [ ]  16.1.3 [ ]
  #2  16.2.1 [ ]  16.2.2 [ ]
  #3  16.3.1 [ ]  16.3.2 [ ]  16.3.3 [ ]  16.3.4 [ ]
  #4  16.4.1 [ ]
  #5  16.5.1 [ ]
  #6  16.6.1 [ ]

Phase 17 (Core: promise callbacks and executors · [PENDING])
  #1  17.1.1 [ ]  17.1.2 [ ]  17.1.3 [ ]  17.1.4 [ ]
  #2  17.2.1 [ ]  17.2.2 [ ]
  #3  17.3.1 [ ]
  #4  17.4.1 [ ]
  #5  17.5.1 [ ]
  #6  17.6.1 [ ]

Phase 18 (Core: nested optional chains · [PENDING])
  #1  18.1.1 [ ]  18.1.2 [ ]  18.1.3 [ ]
  #2  18.2.1 [ ]  18.2.2 [ ]  18.2.3 [ ]  18.2.4 [ ]  18.2.5 [ ]
  #3  18.3.1 [ ]  18.3.2 [ ]  18.3.3 [ ]
  #4  18.4.1 [ ]
  #5  18.5.1 [ ]

Phase 19 (Core: enums and the switch shape · [PENDING])
  #1  19.1.1 [ ]
  #2  19.2.1 [ ]  19.2.2 [ ]
  #3  19.3.1 [ ]  19.3.2 [ ]
  #4  19.4.1 [ ]  19.4.2 [ ]  19.4.3 [ ]  19.4.4 [ ]
  #5  19.5.1 [ ]
  #6  19.6.1 [ ]

Phase 20 (Core: the never-read lint · [PENDING])
  #1  20.1.1 [ ]  20.1.2 [ ]  20.1.3 [ ]
  #2  20.2.1 [ ]  20.2.2 [ ]  20.2.3 [ ]  20.2.4 [ ]  20.2.5 [ ]  20.2.6 [ ]  20.2.7 [ ]
  #3  20.3.1 [ ]  20.3.2 [ ]  20.3.3 [ ]
  #4  20.4.1 [ ]  20.4.2 [ ]  20.4.3 [ ]  20.4.4 [ ]  20.4.5 [ ]  20.4.6 [ ]
  #5  20.5.1 [ ]  20.5.2 [ ]  20.5.3 [ ]
  #6  20.6.1 [ ]
  #7  20.7.1 [ ]
  #8  20.8.1 [ ]
  #9  (20.9.<n> fan-out tasks; 20.9-fan-out.md)
  #10 20.10.1 [ ]

Phase 21 (Core: the edge-value merge lint family · [PENDING])
  #1  21.1.1 [ ]  21.1.2 [ ]  21.1.3 [ ]
  #2  21.2.1 [ ]  21.2.2 [ ]  21.2.3 [ ]  21.2.4 [ ]  21.2.5 [ ]  21.2.6 [ ]  21.2.7 [ ]  21.2.8 [ ]
  #3  21.3.1 [ ]  21.3.2 [ ]  21.3.3 [ ]  21.3.4 [ ]  21.3.5 [ ]
  #4  21.4.1 [ ]  21.4.2 [ ]  21.4.3 [ ]  21.4.4 [ ]  21.4.5 [ ]  21.4.6 [ ]  21.4.7 [ ]  21.4.8 [ ]  21.4.9 [ ]
  #5  21.5.1 [ ]  21.5.2 [ ]
  #6  21.6.1 [ ]  21.6.2 [ ]
  #7  21.7.1 [ ]
  #8  21.8.1 [ ]
  #9  21.9.1 [ ]
  #10 21.10.1 [ ]
  #11 21.11.1 [ ]
  #12 21.12.1 [ ]  21.12.2 [ ]  21.12.3 [ ]
  #13 21.13.1 [ ]
  #14 21.14.1 [ ]
  #15 21.15.1 [ ]
  #16 (21.16.<n> fan-out tasks; 21.16-fan-out.md)
  #17 21.17.1 [ ]

Phase 22 (Core: environment reads in functions and template literals · [PENDING])
  #1  22.1.1 [ ]  22.1.2 [ ]  22.1.3 [ ]  22.1.4 [ ]  22.1.5 [ ]
  #2  22.2.1 [ ]  22.2.2 [ ]  22.2.3 [ ]  22.2.4 [ ]  22.2.5 [ ]  22.2.6 [ ]  22.2.7 [ ]  22.2.8 [ ]  22.2.9 [ ]
      22.2.10 [ ]  22.2.11 [ ]  22.2.12 [ ]
  #3  22.3.1 [ ]
  #4  22.4.1 [ ]
  #5  22.5.1 [ ]  22.5.2 [ ]  22.5.3 [ ]
  #6  22.6.1 [ ]
  #7  22.7.1 [ ]

Phase 23 (Core: barrels, build-error reasons and unresolvable imports · [PENDING])
  #1  23.1.1 [ ]  23.1.2 [ ]  23.1.3 [ ]  23.1.4 [ ]  23.1.5 [ ]  23.1.6 [ ]
  #2  23.2.1 [ ]  23.2.2 [ ]  23.2.3 [ ]  23.2.4 [ ]  23.2.5 [ ]  23.2.6 [ ]  23.2.7 [ ]  23.2.8 [ ]
  #3  23.3.1 [ ]  23.3.2 [ ]
  #4  23.4.1 [ ]  23.4.2 [ ]
  #5  23.5.1 [ ]  23.5.2 [ ]
  #6  23.6.1 [ ]

Phase 24 (Core: known values from afar · [PENDING])
  #1  24.1.1 [ ]  24.1.2 [ ]  24.1.3 [ ]  24.1.4 [ ]  24.1.5 [ ]  24.1.6 [ ]  24.1.7 [ ]
  #2  24.2.1 [ ]  24.2.2 [ ]  24.2.3 [ ]  24.2.4 [ ]  24.2.5 [ ]  24.2.6 [ ]  24.2.7 [ ]  24.2.8 [ ]
  #3  24.3.1 [ ]  24.3.2 [ ]  24.3.3 [ ]  24.3.4 [ ]
  #4  24.4.1 [ ]  24.4.2 [ ]
  #5  24.5.1 [ ]  24.5.2 [ ]  24.5.3 [ ]  24.5.4 [ ]
  #6  24.6.1 [ ]  24.6.2 [ ]
  #7  24.7.1 [ ]  24.7.2 [ ]  24.7.3 [ ]  24.7.4 [ ]
  #8  24.8.1 [ ]
  #9  24.9.1 [ ]
  #10 24.10.1 [ ]
  #11 24.11.1 [ ]
  #12 (24.12.<n> fan-out tasks; 24.12-fan-out.md)
  #13 24.13.1 [ ]

Phase 25 (Core: a guard narrowing `unknown` · [PENDING])
  #1  25.1.1 [ ]  25.1.2 [ ]
  #2  25.2.1 [ ]  25.2.2 [ ]  25.2.3 [ ]  25.2.4 [ ]  25.2.5 [ ]
  #3  25.3.1 [ ]
  #4  25.4.1 [ ]
  #5  25.5.1 [ ]
  #6  25.6.1 [ ]

Phase 26 (Core: derived stub values · [PENDING])
  #1  26.1.1 [ ]  26.1.2 [ ]  26.1.3 [ ]  26.1.4 [ ]
  #2  26.2.1 [ ]  26.2.2 [ ]  26.2.3 [ ]  26.2.4 [ ]  26.2.5 [ ]  26.2.6 [ ]
  #3  26.3.1 [ ]
  #4  26.4.1 [ ]
  #5  (26.5.<n> fan-out tasks; 26.5-fan-out.md)
  #6  26.6.1 [ ]

Phase 27 (Settle the disputed cards · [PENDING])
  #1  27.1.1 [ ]
  #2  (27.2.<n> fan-out tasks; 27.2-fan-out.md)
  #3  27.3.1 [ ]
```

After phase 27 the operator runs the skill's Level 3: merge `main`, build, `npm run ward -- --changed`, then one bare
`npm run ward`, and the whole generated suite one top folder at a time.

## Phases and tasks

Every task file holds its ID, phase, row, dependencies, model, the DESIGN.md sections and cards it covers, its files
with folder types, its contracts, what to implement, its tests, the commands that verify it, and when it is done.

### Phase 1: Vocabulary: statics, contracts and the kit

- Row #1: [1.1.1](phase-01-vocabulary/1.1.1-kit-pieces.md) Piece and composition vocabulary in the declaration kit; [1.1.2](phase-01-vocabulary/1.1.2-axis-statics.md) Axis statics: every axis, its default and its values; [1.1.3](phase-01-vocabulary/1.1.3-edge-value-statics.md) Edge values and cause classes; [1.1.4](phase-01-vocabulary/1.1.4-report-vocabulary-statics.md) Report vocabulary: branch kinds and arm labels; [1.1.5](phase-01-vocabulary/1.1.5-today-statics.md) Today statics: the known core gaps and how a specimen matches them; [1.1.6](phase-01-vocabulary/1.1.6-layered-matrix-statics.md) Layered matrix statics; [1.1.7](phase-01-vocabulary/1.1.7-specimen-layout-statics.md) Specimen layout statics; [1.1.8](phase-01-vocabulary/1.1.8-generator-layout-statics.md) Generator layout statics
- Row #2: [1.2.1](phase-01-vocabulary/1.2.1-piece-tag-contract.md) Piece tag contract; [1.2.2](phase-01-vocabulary/1.2.2-position-contract.md) Position contract; [1.2.3](phase-01-vocabulary/1.2.3-source-kind-contract.md) Source kind contract; [1.2.4](phase-01-vocabulary/1.2.4-axis-value-contract.md) Axis value contract; [1.2.5](phase-01-vocabulary/1.2.5-arm-step-contract.md) Arm step contract; [1.2.6](phase-01-vocabulary/1.2.6-generator-args-contract.md) Generator arguments contract; [1.2.7](phase-01-vocabulary/1.2.7-candidate-trace-contract.md) Candidate trace contract; [1.2.8](phase-01-vocabulary/1.2.8-candidate-input-contract.md) Candidate input contract
- Row #3: [1.3.1](phase-01-vocabulary/1.3.1-route-contract.md) Route contract; [1.3.2](phase-01-vocabulary/1.3.2-specimen-entry-contract.md) Specimen entry (manifest row) contract; [1.3.3](phase-01-vocabulary/1.3.3-count-report-contract.md) Count report contract; [1.3.4](phase-01-vocabulary/1.3.4-composition-card-contract.md) Composition card contract; [1.3.5](phase-01-vocabulary/1.3.5-piece-types.md) Piece slot and loaded piece types
- Row #4: [1.4.1](phase-01-vocabulary/1.4.1-specimen-report-contract.md) Specimen report contract: every report channel in one shape; [1.4.2](phase-01-vocabulary/1.4.2-plan-types.md) Piece tree and piece plan types; [1.4.3](phase-01-vocabulary/1.4.3-probe-table-contract.md) Probe table contract: what the generator probes, and how a run records it

### Phase 2: Loading pieces

- Row #1: [2.1.1](phase-02-loading/2.1.1-read-piece-declared-layer.md) Read one piece's declared object; [2.1.2](phase-02-loading/2.1.2-piece-instances.md) Piece instances; [2.1.3](phase-02-loading/2.1.3-declaration-export-name.md) The piece and compositions export names
- Row #2: [2.2.1](phase-02-loading/2.2.1-piece-shape.md) Piece shape transformer, shims included
- Row #3: [2.3.1](phase-02-loading/2.3.1-pieces-load-broker.md) Pieces load broker
- Row #4: [2.4.1](phase-02-loading/2.4.1-piece-list-text.md) Piece list text
- Row #5: [2.5.1](phase-02-loading/2.5.1-list-pieces-flag.md) The `--list-pieces` flag in the responder
- Row #6: [2.6.1](phase-02-loading/2.6.1-port-if-ternary-eq.md) Port `if`, ternary and `===`; [2.6.2](phase-02-loading/2.6.2-port-gt-not-nullish.md) Port `>`, `!` and `??`; [2.6.3](phase-02-loading/2.6.3-port-functions.md) Port the arrow function, function expression and function declaration; [2.6.4](phase-02-loading/2.6.4-port-async-generator-class.md) Port the async function, generator and class; [2.6.5](phase-02-loading/2.6.5-port-object-module.md) Port the object literal and module
- Row #7: [2.7.1](phase-02-loading/2.7.1-list-pieces-integration.md) Startup integration test for `--list-pieces`

### Phase 3: Declare every piece

- Row #1: [3.1.1](phase-03-pieces/3.1.1-const-let-reassignment.md) Declare `const`, `let` and reassignment; [3.1.2](phase-03-pieces/3.1.2-logical-assign.md) Declare `??=`, `||=` and `&&=`; [3.1.3](phase-03-pieces/3.1.3-compound-assign.md) Declare `+=`; [3.1.4](phase-03-pieces/3.1.4-parameters.md) Declare the parameter, optional and rest parameter pieces; [3.1.5](phase-03-pieces/3.1.5-destructuring.md) Declare object and array destructuring; [3.1.6](phase-03-pieces/3.1.6-and-or.md) Declare `&&` and `||`; [3.1.7](phase-03-pieces/3.1.7-edge-operators.md) Declare `==`, `+` and the global `isNaN`; [3.1.8](phase-03-pieces/3.1.8-optional-chain.md) Declare `?.`, one level and nested; [3.1.9](phase-03-pieces/3.1.9-optional-call-index.md) Declare `fn?.()` and `a?.[0]`; [3.1.10](phase-03-pieces/3.1.10-reach-in.md) Declare `.x`, `[0]` and a getter read; [3.1.11](phase-03-pieces/3.1.11-length-at.md) Declare `.length` and `.at()`; [3.1.12](phase-03-pieces/3.1.12-casts.md) Declare `as`, `!` and `as const`; [3.1.13](phase-03-pieces/3.1.13-satisfies-typeof-instanceof.md) Declare `satisfies`, `typeof` and `instanceof`; [3.1.14](phase-03-pieces/3.1.14-in-guard.md) Declare `in` and a type guard call; [3.1.15](phase-03-pieces/3.1.15-template-call-recursion.md) Declare the template literal, call and recursion pieces; [3.1.16](phase-03-pieces/3.1.16-log-push-calls.md) Declare the `console.log` and `seen.push` hosts; [3.1.17](phase-03-pieces/3.1.17-object-array-literals.md) Declare the object and array literal pieces; [3.1.18](phase-03-pieces/3.1.18-array-callbacks.md) Declare the `.map`, `.filter` and `.forEach` callbacks; [3.1.19](phase-03-pieces/3.1.19-promise-callbacks.md) Declare the `.then`, `.catch` and `.finally` callbacks; [3.1.20](phase-03-pieces/3.1.20-closure-promise-resolve.md) Declare the returned closure and `Promise.resolve`; [3.1.21](phase-03-pieces/3.1.21-switch.md) Declare the three switch pieces; [3.1.22](phase-03-pieces/3.1.22-for-loops.md) Declare `for`, `for…of` and `for…in`; [3.1.23](phase-03-pieces/3.1.23-while-do-return.md) Declare `while`, `do…while` and `return` in a loop; [3.1.24](phase-03-pieces/3.1.24-break-continue.md) Declare `break`, `continue` and the labelled break; [3.1.25](phase-03-pieces/3.1.25-try-promise-await.md) Declare `try`, `new Promise` and `await`; [3.1.26](phase-03-pieces/3.1.26-return-throw.md) Declare `return` and `throw`; [3.1.27](phase-03-pieces/3.1.27-class-module.md) Finish the class and module pieces; [3.1.28](phase-03-pieces/3.1.28-setter-method-reach.md) Declare a setter write and a method-call read

### Phase 4: Planner and count

- Row #1: [4.1.1](phase-04-planner/4.1.1-reader-layer.md) The plainest reader after a non-branching piece; [4.1.2](phase-04-planner/4.1.2-specimen-path.md) Specimen path: name a specimen's folder; [4.1.3](phase-04-planner/4.1.3-type-list-statics.md) Type list statics for the value axes
- Row #2: [4.2.1](phase-04-planner/4.2.1-plainest-tree.md) Plainest tree: wrap one piece in the plainest specimen
- Row #3: [4.3.1](phase-04-planner/4.3.1-placements.md) Placements: put a piece in every slot that fits, up to its level cap; [4.3.2](phase-04-planner/4.3.2-value-axis-variants.md) Value axis variants: type, nullability, wrapper, source, routes, consumption; [4.3.3](phase-04-planner/4.3.3-structure-axis-variants.md) Structure axis variants: exit kind, file boundary, compiler options, companions, shared state; [4.3.4](phase-04-planner/4.3.4-iterative-shapes.md) Iterative shapes: how two or three branching pieces relate
- Row #4: [4.4.1](phase-04-planner/4.4.1-composition-tree.md) Composition tree: turn a declared card into a plan; [4.4.2](phase-04-planner/4.4.2-plan-count.md) Plan count: totals by focus, axis, layer and top folder; [4.4.3](phase-04-planner/4.4.3-count-report-text.md) Count report text
- Row #5: [4.5.1](phase-04-planner/4.5.1-piece-plan.md) Piece plan: every specimen the matrix holds
- Row #6: [4.6.1](phase-04-planner/4.6.1-plan-broker.md) Specimens plan broker
- Row #7: [4.7.1](phase-04-planner/4.7.1-count-flag.md) The `--count`, `--piece` and `--axis` flags; [4.7.2](phase-04-planner/4.7.2-flag-text-integration.md) The integration tests that assert the responder's refusal text
- Row #8: [4.8.1](phase-04-planner/4.8.1-count-integration.md) Startup integration test for `--count`
- Row #9: [4.9.1](phase-04-planner/4.9.1-measure.md) Operator: record the measured matrix size

### Phase 5: Rendering

- Row #1: [5.1.1](phase-05-rendering/5.1.1-swap-slots-layer.md) Swap slots layer: holes, statement slots, parameters and arm statements; [5.1.2](phase-05-rendering/5.1.2-source-leaf-layer.md) Source leaf layer: render one leaf from its source; [5.1.3](phase-05-rendering/5.1.3-typecheck-statics.md) Typecheck statics: expected diagnostics
- Row #2: [5.2.1](phase-05-rendering/5.2.1-render-piece-layer.md) Render piece layer: one tree node, recursively; [5.2.2](phase-05-rendering/5.2.2-typecheck-broker.md) Typecheck multi-file specimens under their own compiler options
- Row #3: [5.3.1](phase-05-rendering/5.3.1-piece-tree-render.md) Piece tree render: the whole entry file
- Row #4: [5.4.1](phase-05-rendering/5.4.1-specimen-files.md) Specimen files: the entry, its siblings, its harness, its stubs, its tsconfig

### Phase 6: Prediction engine

- Row #1: [6.1.1](phase-06-prediction/6.1.1-value-candidates-layer.md) Candidate values for one input, derived from the arm conditions; [6.1.2](phase-06-prediction/6.1.2-fewest-runs-cover.md) Fewest runs: the smallest set of routes that takes every arm; [6.1.3](phase-06-prediction/6.1.3-execute-statics.md) Execute statics: deterministic caps; [6.1.4](phase-06-prediction/6.1.4-probe-form-layer.md) Probe form layer: the table of forms and their rewrites; [6.1.5](phase-06-prediction/6.1.5-edge-merge-layer.md) Edge-value merge layer: the six rules, read from declared types; [6.1.6](phase-06-prediction/6.1.6-known-value-trace.md) Known value trace: the consumption point of a dead arm
- Row #2: [6.2.1](phase-06-prediction/6.2.1-candidate-inputs.md) Candidate inputs by the cause rule; [6.2.2](phase-06-prediction/6.2.2-probe-source.md) Probe source: mark every arm and leaf in the specimen's files; [6.2.3](phase-06-prediction/6.2.3-route-group.md) Route group: from candidate traces to the every-route list; [6.2.4](phase-06-prediction/6.2.4-admission-predict.md) Admission prediction: undriven, gaps and build errors; [6.2.5](phase-06-prediction/6.2.5-lint-predict.md) Lint prediction: unreachable exits, never-read, edge-value merges; [6.2.6](phase-06-prediction/6.2.6-today-match.md) Today match: which today gaps a specimen carries
- Row #3: [6.3.1](phase-06-prediction/6.3.1-specimen-execute.md) Specimen execute broker: run the probed specimen for every candidate input
- Row #4: [6.4.1](phase-06-prediction/6.4.1-specimen-predict.md) Specimen predict broker: one specimen's full report; [6.4.2](phase-06-prediction/6.4.2-show-text.md) Show text: the JSON `--show` prints
- Row #5: [6.5.1](phase-06-prediction/6.5.1-show-flag.md) The `--show` flag: print a specimen and its predicted report; [6.5.2](phase-06-prediction/6.5.2-flag-text-integration.md) The integration tests that assert the responder's refusal text
- Row #6: [6.6.1](phase-06-prediction/6.6.1-show-integration.md) Startup integration test for `--show`

### Phase 7: The DESIGN.md cards

- Row #1: [7.1.1](phase-07-cards/7.1.1-harness-folder.md) The card harness folder and the exclusion list
- Row #2: [7.2.1](phase-07-cards/7.2.1-position.md) Cards: parent states and positions; [7.2.2](phase-07-cards/7.2.2-alone.md) Cards: each piece alone, one piece inside another; [7.2.3](phase-07-cards/7.2.3-ternary-const.md) Cards: ternaries in ternaries, `const` everywhere; [7.2.4](phase-07-cards/7.2.4-shape-route.md) Cards: iteratives and routes; [7.2.5](phase-07-cards/7.2.5-loop-object-type.md) Cards: loops, callbacks, objects, arrays, classes, types; [7.2.6](phase-07-cards/7.2.6-nullable-edge-reach.md) Cards: nullable values, edge values, reaching in; [7.2.7](phase-07-cards/7.2.7-deep-return-retype.md) Cards: three levels deep, return types, retyping; [7.2.8](phase-07-cards/7.2.8-boundary-consume-state.md) Cards: file boundary, consumption, shared state, report channels; [7.2.9](phase-07-cards/7.2.9-known.md) Cards: known values from afar
- Row #3: [7.3.1](phase-07-cards/7.3.1-card-check.md) The card check
- Row #4: [7.4](phase-07-cards/7.4-card-fixes.md) Make the generator agree with every card (fan-out `7.4.<n>`)
- Row #5: [7.5.1](phase-07-cards/7.5.1-card-gate.md) Operator: only disputed cards stay excluded

### Phase 8: Observation and the generated test

- Row #1: [8.1.1](phase-08-observation/8.1.1-route-steps-layer.md) Route steps layer: a case's steps become arm steps; [8.1.2](phase-08-observation/8.1.2-specimen-header.md) Specimen header: the comment at the top of every generated specimen; [8.1.3](phase-08-observation/8.1.3-report-literal-layer.md) Report literal layer: write a report as a TypeScript object literal; [8.1.4](phase-08-observation/8.1.4-observe-statics.md) Observe statics: package path, config file name, fallback reason
- Row #2: [8.2.1](phase-08-observation/8.2.1-report-projection.md) Report projection: read Assayer's output into a specimen report; [8.2.2](phase-08-observation/8.2.2-specimen-test-file.md) Specimen test file, with `it.failing` for a today gap
- Row #3: [8.3.1](phase-08-observation/8.3.1-report-layer-broker.md) Report layer broker: run Assayer on one specimen folder

### Phase 8b: Running at scale

- Row #1: [8b.1.1](phase-08b-scale/8b.1.1-load-balancer-gateway.md) The load balancer gateway wrapper; [8b.1.2](phase-08b-scale/8b.1.2-run-scale-statics.md) Run scale statics; [8b.1.3](phase-08b-scale/8b.1.3-cache-key.md) Generation cache key
- Row #2: [8b.2.1](phase-08b-scale/8b.2.1-capacity-lease-broker.md) Capacity lease broker; [8b.2.2](phase-08b-scale/8b.2.2-generator-fingerprint.md) Generator fingerprint broker; [8b.2.3](phase-08b-scale/8b.2.3-cache-read.md) Generation cache read broker; [8b.2.4](phase-08b-scale/8b.2.4-cache-write.md) Generation cache write broker; [8b.2.5](phase-08b-scale/8b.2.5-jest-run-broker.md) Jest run broker
- Row #3: [8b.3.1](phase-08b-scale/8b.3.1-test-generated-responder.md) The generated-run responder
- Row #4: [8b.4.1](phase-08b-scale/8b.4.1-test-generated-flow.md) The generated-run flow and its integration test
- Row #5: [8b.5.1](phase-08b-scale/8b.5.1-test-generated-startup.md) The generated-run startup, its integration test and the bin entry
- Row #6: [8b.6.1](phase-08b-scale/8b.6.1-test-generated-script.md) The root `test:generated` script
- Row #7: [8b.7.1](phase-08b-scale/8b.7.1-claude-md-test-generated.md) The root CLAUDE.md describes the `test:generated` wrapper

### Phase 9: Build, switch over and clean up

- Row #1: [9.1.1](phase-09-switch-over/9.1.1-specimen-entry.md) Manifest row; [9.1.2](phase-09-switch-over/9.1.2-expected-failures.md) Expected-failures report; [9.1.3](phase-09-switch-over/9.1.3-write-broker.md) Write broker; [9.1.4](phase-09-switch-over/9.1.4-check-broker.md) Check broker; [9.1.5](phase-09-switch-over/9.1.5-smoke-config.md) The smoke repo's hand-written `package.json` and `tsconfig.json`; [9.1.6](phase-09-switch-over/9.1.6-build-result-contract.md) Build result contract; [9.1.7](phase-09-switch-over/9.1.7-project-with-types.md) The smoke repo package `project-with-types`; [9.1.8](phase-09-switch-over/9.1.8-project-without-types.md) The smoke repo package `project-without-types`
- Row #2: [9.2.1](phase-09-switch-over/9.2.1-build-broker.md) Build broker
- Row #3: [9.3.1](phase-09-switch-over/9.3.1-responder-switch.md) The command writes the new layout; [9.3.2](phase-09-switch-over/9.3.2-observe-delegate.md) The observe broker delegates; [9.3.3](phase-09-switch-over/9.3.3-async-entry.md) The flow, startup and bin entry await the responder (committed with 9.3.1); [9.3.4](phase-09-switch-over/9.3.4-flow-integration-await.md) The flow integration test awaits the flow (committed with 9.3.1 and 9.3.3)
- Row #4: [9.4.1](phase-09-switch-over/9.4.1-regenerate.md) Operator: regenerate and commit
- Row #5: [9.5.1](phase-09-switch-over/9.5.1-delete-old-brokers.md) Delete the old generate and load brokers
- Row #6: [9.6.1](phase-09-switch-over/9.6.1-delete-transformers-a.md) Delete the old transformers; [9.6.2](phase-09-switch-over/9.6.2-delete-transformers-b.md) Delete the old transformers; [9.6.3](phase-09-switch-over/9.6.3-delete-transformers-c.md) Delete the old transformers; [9.6.4](phase-09-switch-over/9.6.4-delete-transformers-d.md) Delete the old transformers; [9.6.5](phase-09-switch-over/9.6.5-delete-transformers-e.md) Delete the old transformers; [9.6.6](phase-09-switch-over/9.6.6-delete-transformers-f.md) Delete the old transformers; [9.6.7](phase-09-switch-over/9.6.7-delete-transformers-g.md) Delete the old transformers and the guard
- Row #7: [9.7.1](phase-09-switch-over/9.7.1-delete-contracts-a.md) Delete the old contracts, part 1; [9.7.2](phase-09-switch-over/9.7.2-delete-contracts-b.md) Delete the old contracts, part 2; [9.7.3](phase-09-switch-over/9.7.3-delete-contracts-c.md) Delete the old contracts, part 3; [9.7.4](phase-09-switch-over/9.7.4-delete-contracts-d.md) Delete the old contracts, part 4; [9.7.5](phase-09-switch-over/9.7.5-delete-statics-errors.md) Delete the old statics, error and containers; [9.7.6](phase-09-switch-over/9.7.6-delete-old-declarations.md) Delete the old declarations and trim the kit; [9.7.7](phase-09-switch-over/9.7.7-generator-layout-trim.md) Trim the generator layout statics; [9.7.8](phase-09-switch-over/9.7.8-generator-args-trim.md) Trim the generator arguments contract
- Row #8: [9.8.1](phase-09-switch-over/9.8.1-count-today.md) `--count` reports today ids from a dry-run build

### Phase 10: Run the generated suite and triage

- Row #1: [10.1.1](phase-10-run-and-triage/10.1.1-run-generated-suite.md) Run the generated suite, one top folder at a time
- Row #2: [10.2.1](phase-10-run-and-triage/10.2.1-triage.md) Triage the failures into causes
- Row #3: [10.3.1](phase-10-run-and-triage/10.3.1-triage-gate.md) Gate: the user decides each triage group
- Row #4: [10.4](phase-10-run-and-triage/10.4-fan-out.md) Fan-out: the fixes the triage gate decides

### Phase 11: Core: value-position `&&`, `||` and `??`

- Row #1: [11.1.1](phase-11-value-position-logical/11.1.1-condition-context.md) Walk context knows when it is inside a condition
- Row #2: [11.2.1](phase-11-value-position-logical/11.2.1-if-condition-descent.md) `if` marks its condition descent; [11.2.2](phase-11-value-position-logical/11.2.2-ternary-condition-descent.md) A ternary marks its condition descent; [11.2.3](phase-11-value-position-logical/11.2.3-switch-condition-descent.md) `switch` marks its subject descent
- Row #3: [11.3.1](phase-11-value-position-logical/11.3.1-handle-logical-value.md) Handler: `&&`, `||` and `??` in a value position are branches
- Row #4: [11.4.1](phase-11-value-position-logical/11.4.1-dispatch-logical-value.md) The dispatch route for a value-position `&&`, `||`, `??`
- Row #5: [11.5.1](phase-11-value-position-logical/11.5.1-specimen-logical-value.md) Hand-written specimen for a value-position `&&` and `??`
- Row #6: [11.6](phase-11-value-position-logical/11.6-fan-out.md) Fan-out: the specimen tests that gain a value-position branch
- Row #7: [11.7.1](phase-11-value-position-logical/11.7.1-close-today-gaps.md) Close the today gap `value-position-logical`

### Phase 12: Core: the cause rule, edge values, optional properties and gap names

- Row #1: [12.1.1](phase-12-edge-values/12.1.1-core-edge-statics.md) Core's own edge-value list; [12.1.2](phase-12-edge-values/12.1.2-arrange-value-contract.md) An arrange value for `undefined` and `NaN`; [12.1.3](phase-12-edge-values/12.1.3-predicate-in.md) Predicate kinds for an `in` check, and a loose-comparison flag; [12.1.4](phase-12-edge-values/12.1.4-entry-gap-param.md) A gap names its parameter; [12.1.5](phase-12-edge-values/12.1.5-descriptor-nullish.md) A type descriptor can say a member is `null` or `undefined`; [12.1.6](phase-12-edge-values/12.1.6-type-fact-nullish.md) A type fact can say a member is `null` or `undefined`; [12.1.7](phase-12-edge-values/12.1.7-index-path-segment.md) An element read at a literal index is a path segment
- Row #2: [12.2.1](phase-12-edge-values/12.2.1-case-interpret-values.md) A case passes `undefined` and `NaN`; [12.2.3](phase-12-edge-values/12.2.3-read-in-condition.md) Read `'x' in obj` as a predicate, and mark a loose comparison; [12.2.4](phase-12-edge-values/12.2.4-input-gap-param.md) The fill seam names the parameter it cannot build; [12.2.5](phase-12-edge-values/12.2.5-read-type-fact-nullish.md) The type reader names a `null` or `undefined` member by its flags; [12.2.6](phase-12-edge-values/12.2.6-type-descriptor-nullish.md) A type descriptor carries the `null` or `undefined` mark
- Row #3: [12.3.1](phase-12-edge-values/12.3.1-truthiness-edges.md) A truthiness leaf names every falsy point of its type; [12.3.2](phase-12-edge-values/12.3.2-nullish-edges.md) A non-nullish leaf names a value of each class; [12.3.3](phase-12-edge-values/12.3.3-input-buckets.md) One bucket per edge value of each leaf operand; [12.3.4](phase-12-edge-values/12.3.4-type-fillable-members.md) Fill a union's `undefined` and `null` members
- Row #4: [12.4.1](phase-12-edge-values/12.4.1-cause-arrange.md) Cause arrange follows the cause rule
- Row #5: [12.5.1](phase-12-edge-values/12.5.1-branchless-cases.md) Value-class cases for a branchless entry and a returned comparison; [12.5.2](phase-12-edge-values/12.5.2-fill-value-presence.md) An optional property is built missing, present as `undefined`, or with a value; [12.5.3](phase-12-edge-values/12.5.3-object-arrange-presence.md) Object arrange builds a property present as `undefined`; [12.5.4](phase-12-edge-values/12.5.4-analysis-options.md) `exactOptionalPropertyTypes` is named as an arrangement option
- Row #6: [12.6.1](phase-12-edge-values/12.6.1-stub-realize-presence.md) The stub overlay passes the pin and the compiler option to object arrange; [12.6.2](phase-12-edge-values/12.6.2-index-read-element-edges.md) An index read takes each element edge value in a one-item array; [12.6.3](phase-12-edge-values/12.6.3-map-callback-element-edges.md) A mapped callback takes each element edge value in a one-item array
- Row #7: [12.7.1](phase-12-edge-values/12.7.1-route-by-read-values.md) A route is its arms plus the values its run reads, and an index read is steerable
- Row #8: [12.8.1](phase-12-edge-values/12.8.1-specimen-edge-causes.md) Hand-written specimen for edge-value causes
- Row #9: [12.9.1](phase-12-edge-values/12.9.1-specimen-optional-property-in.md) Hand-written specimen for an optional property read by `in`
- Row #10: [12.10](phase-12-edge-values/12.10-fan-out.md) Fan-out: the specimen tests that change when every route holds edge values
- Row #11: [12.11.1](phase-12-edge-values/12.11.1-close-today-gaps.md) Close the today gaps `edge-values`, `optional-property-presence` and `gap-param-name`

### Phase 13: Core: defaults as branches

- Row #1: [13.1.1](phase-13-defaults/13.1.1-branch-kinds-default.md) Branch kinds `default` and `destructure-default`, and a branch's arm labels
- Row #2: [13.2.1](phase-13-defaults/13.2.1-projection-reads-arms.md) The generator's projection reads `BranchNode.arms`; [13.2.2](phase-13-defaults/13.2.2-read-parameter-defaults.md) Read a parameter's own default apart from its pattern elements' defaults
- Row #3: [13.3.1](phase-13-defaults/13.3.1-handle-function-default.md) A parameter default is a branch: given or defaulted; [13.3.2](phase-13-defaults/13.3.2-applied-params.md) Pass a parameter that has a default
- Row #4: [13.4.1](phase-13-defaults/13.4.1-derive-default-routes.md) Given and defaulted routes; [13.4.2](phase-13-defaults/13.4.2-core-claude-defaults.md) Rewrite the core doc's default-parameter entry, and drop `branchingDefault` from the contract
- Row #5: [13.5.1](phase-13-defaults/13.5.1-specimen-default-param.md) Hand-written specimen for parameter defaults
- Row #6: [13.6](phase-13-defaults/13.6-fan-out.md) Fan-out: the specimen tests that gain a parameter-default branch
- Row #7: [13.7.1](phase-13-defaults/13.7.1-read-destructure-defaults.md) Read a destructuring default with its position
- Row #8: [13.8.1](phase-13-defaults/13.8.1-handle-variable-default.md) A destructuring default is a branch: present or defaulted; [13.8.2](phase-13-defaults/13.8.2-handle-function-pattern-default.md) A destructuring default in a parameter list is a branch
- Row #9: [13.9.1](phase-13-defaults/13.9.1-specimen-destructure-default.md) Hand-written specimen for destructuring defaults
- Row #10: [13.10](phase-13-defaults/13.10-fan-out.md) Fan-out: the specimen tests that gain a destructuring-default branch
- Row #11: [13.11.1](phase-13-defaults/13.11.1-close-today-gaps.md) Close the today gaps `default-param-branch`, `default-param-ternary-passed` and `destructure-default-branch`

### Phase 14: Core: loops

- Row #1: [14.1.1](phase-14-loops/14.1.1-branch-kind-loop.md) Branch kind `loop`; [14.1.2](phase-14-loops/14.1.2-walk-context-elements.md) The walk context names the loop items that stand for an array element
- Row #2: [14.2.1](phase-14-loops/14.2.1-handle-loop.md) Handler: every loop is a branch; [14.2.2](phase-14-loops/14.2.2-read-terminal.md) `break` and `continue` end the loop body, not the function; [14.2.3](phase-14-loops/14.2.3-array-arrange.md) Array elements per arm; [14.2.4](phase-14-loops/14.2.4-read-condition-elements.md) A condition that reads a loop item reads an element of its array parameter
- Row #3: [14.3.1](phase-14-loops/14.3.1-dispatch-loop.md) The dispatch route for loops; [14.3.2](phase-14-loops/14.3.2-derive-loop-cases.md) Loop routes from array size and element values
- Row #4: [14.4.1](phase-14-loops/14.4.1-item-property-nested-loops.md) An item property and a nested loop take element edge values
- Row #5: [14.5.1](phase-14-loops/14.5.1-specimen-loops.md) Hand-written loop specimen
- Row #6: [14.6](phase-14-loops/14.6-fan-out.md) Fan-out: the specimen tests that held a loop
- Row #7: [14.7.1](phase-14-loops/14.7.1-move-in-function.md) Move the loop ratchet to `happy-path/`; [14.7.2](phase-14-loops/14.7.2-e2e-paths.md) The two end-to-end specs that name the loop specimen
- Row #8: [14.8.1](phase-14-loops/14.8.1-close-today-gaps.md) Close the today gap `loop-dark-spot`

### Phase 15: Core: compound assignment, loop-written variables, call sequences

- Row #1: [15.1.1](phase-15-records/15.1.1-branch-kind-logical-assign.md) Branch kind `logical-assign`; [15.1.2](phase-15-records/15.1.2-case-calls.md) A case's call count; [15.1.3](phase-15-records/15.1.3-syntax-trait-logical-assign.md) The `branch:logical-assign` trait name; [15.1.4](phase-15-records/15.1.4-value-expr-forms.md) Value expression forms for compound, per-pass and per-call writes; [15.1.5](phase-15-records/15.1.5-logical-assign-branch-id.md) The branch id of a logical assignment; [15.1.6](phase-15-records/15.1.6-loop-id.md) The loop id the handler and the statement reader share
- Row #2: [15.2.1](phase-15-records/15.2.1-read-write-tracking.md) Follow compound writes, loop writes, module and closure state; [15.2.2](phase-15-records/15.2.2-value-expr-evaluate.md) Evaluate per-pass and per-call writes; [15.2.3](phase-15-records/15.2.3-handle-logical-assign.md) Handler for `??=`, `||=`, `&&=`; [15.2.4](phase-15-records/15.2.4-this-field-operand.md) A `this.<field>` operand is followed; [15.2.5](phase-15-records/15.2.5-case-interpret-calls.md) A case calls its entry several times; [15.2.6](phase-15-records/15.2.6-case-resolve-entry-calls.md) One instance, several calls, a returned closure
- Row #3: [15.3.1](phase-15-records/15.3.1-dispatch-logical-assign.md) The dispatch route; [15.3.2](phase-15-records/15.3.2-bindings-straight-line.md) Bindings for compound and logical assignments in straight-line code; [15.3.3](phase-15-records/15.3.3-route-resolve.md) A route through a loop is the set of arms its passes take; [15.3.4](phase-15-records/15.3.4-shim-passes-calls.md) The generated test file passes the call count; [15.3.5](phase-15-records/15.3.5-two-operand-comparison.md) A comparison with a counted side is one expression over both sides
- Row #4: [15.4.1](phase-15-records/15.4.1-bindings-loop-carried.md) Bindings for a variable a loop changes; [15.4.2](phase-15-records/15.4.2-pair-candidates.md) Candidate pairs for a comparison of two parameters; [15.4.3](phase-15-records/15.4.3-closure-host-params.md) A returned closure's body reads its host's parameters
- Row #5: [15.5.1](phase-15-records/15.5.1-bindings-shared-state.md) Bindings for state that outlives one call; [15.5.2](phase-15-records/15.5.2-derive-passes-calls.md) Pick loop bounds and call counts
- Row #6: [15.6.1](phase-15-records/15.6.1-derive-two-parameters.md) One case per candidate pair for a comparison of two parameters; [15.6.2](phase-15-records/15.6.2-through-closure-cases.md) Cases for a returned closure, driven through its host; [15.6.3](phase-15-records/15.6.3-specimen-nullish-assign.md) Hand-written `??=` specimen
- Row #7: [15.7.1](phase-15-records/15.7.1-follow-calls-closure.md) Route a returned no-parameter closure; [15.7.2](phase-15-records/15.7.2-specimen-loop-state.md) Hand-written loop-state specimen; [15.7.3](phase-15-records/15.7.3-two-parameter-comparison.md) A comparison of two parameters is one expression over both
- Row #8: [15.8](phase-15-records/15.8-fan-out.md) Fan-out: the specimen tests that follow written variables and two-parameter comparisons
- Row #9: [15.9.1](phase-15-records/15.9.1-specimen-two-params.md) Hand-written two-parameter comparison specimen
- Row #10: [15.10.1](phase-15-records/15.10.1-specimen-call-state.md) Hand-written call-state specimen
- Row #11: [15.11.1](phase-15-records/15.11.1-close-today-gaps.md) Close `compound-assign-untracked`, `loop-written-variable`, `call-sequence`, `two-param-comparison`

### Phase 16: Core: `try` and `await`

- Row #1: [16.1.1](phase-16-try/16.1.1-branch-kind-try.md) Branch kind `try`; [16.1.2](phase-16-try/16.1.2-syntax-trait-try.md) The `branch:try` trait name; [16.1.3](phase-16-try/16.1.3-context-absorbs-contract.md) The walk context marks exits that do not leave the scope
- Row #2: [16.2.1](phase-16-try/16.2.1-context-absorbs-transformer.md) The context transformer hands `absorbs` down; [16.2.2](phase-16-try/16.2.2-finally-return.md) A `return` in `finally` overrides the others
- Row #3: [16.3.1](phase-16-try/16.3.1-exit-absorbed.md) An absorbed `return` or `throw` is not an exit; [16.3.2](phase-16-try/16.3.2-block-absorbed-value-flow.md) A block keeps its value-flow split off an absorbed exit; [16.3.3](phase-16-try/16.3.3-handle-try.md) The `try` handler; [16.3.4](phase-16-try/16.3.4-derive-throw-points.md) One route per throw point
- Row #4: [16.4.1](phase-16-try/16.4.1-dispatch-try.md) The dispatch route
- Row #5: [16.5.1](phase-16-try/16.5.1-specimen-try.md) Hand-written `try` specimen
- Row #6: [16.6.1](phase-16-try/16.6.1-close-today-gaps.md) Close `try-dark-spot`, `await-throw-point`

### Phase 17: Core: promise callbacks and executors

- Row #1: [17.1.1](phase-17-promises/17.1.1-call-site-receiver-position.md) A call site names the call that is its receiver; [17.1.2](phase-17-promises/17.1.2-scope-record-executor.md) A scope record marks a promise executor; [17.1.3](phase-17-promises/17.1.3-through-settle-cases.md) Settle cases for a promise callback; [17.1.4](phase-17-promises/17.1.4-case-interpret-late-throw.md) A case that throws or rejects after it reached its exit is judged by that exit
- Row #2: [17.2.1](phase-17-promises/17.2.1-executor-scope.md) An executor's `resolve` and `reject` parameters; [17.2.2](phase-17-promises/17.2.2-resolve-reject-exits.md) `resolve` and `reject` are exits
- Row #3: [17.3.1](phase-17-promises/17.3.1-follow-calls-settle.md) Route `.then` and `.catch` callbacks and executors
- Row #4: [17.4.1](phase-17-promises/17.4.1-specimen-promise-callbacks.md) Hand-written promise-callback specimen
- Row #5: [17.5.1](phase-17-promises/17.5.1-specimen-promise-executor.md) Hand-written executor specimen
- Row #6: [17.6.1](phase-17-promises/17.6.1-close-today-gaps.md) Close `promise-callback-arms`, `promise-executor-exits`

### Phase 18: Core: nested optional chains

- Row #1: [18.1.1](phase-18-optional-chains/18.1.1-probe-runtime-chained.md) The `__P.oc` call can say its receiver is another link; [18.1.2](phase-18-optional-chains/18.1.2-type-ref-name.md) The type-reference name of a parameter that may also be `undefined`; [18.1.3](phase-18-optional-chains/18.1.3-missing-levels.md) An object arranger leaves a level out when a chain wants it missing
- Row #2: [18.2.1](phase-18-optional-chains/18.2.1-nullish-leaf.md) Non-nullish leaves; [18.2.2](phase-18-optional-chains/18.2.2-condition-type-ref.md) A condition reads the type name through a nullish union; [18.2.3](phase-18-optional-chains/18.2.3-probe-runtime-broker-chained.md) The probe runtime fires one `else` exit for a whole chain; [18.2.4](phase-18-optional-chains/18.2.4-probe-visit-links.md) The probe rewrite covers element links, call links and chains; [18.2.5](phase-18-optional-chains/18.2.5-root-nullish-guard.md) A guard for a `non-nullish` leaf on a whole parameter
- Row #3: [18.3.1](phase-18-optional-chains/18.3.1-condition-tree.md) Condition tree; [18.3.2](phase-18-optional-chains/18.3.2-exit-lens.md) Exit lens; [18.3.3](phase-18-optional-chains/18.3.3-stub-realize-root-nullish.md) The stub overlay drives a chain whose root parameter may be `undefined`
- Row #4: [18.4.1](phase-18-optional-chains/18.4.1-specimen-nested.md) Hand-written nested-chain specimen
- Row #5: [18.5.1](phase-18-optional-chains/18.5.1-close-today-gaps.md) Close `optional-chain-nested`

### Phase 19: Core: enums and the switch shape

- Row #1: [19.1.1](phase-19-switch-enum/19.1.1-enum-member-values.md) Read a same-file enum member's value
- Row #2: [19.2.1](phase-19-switch-enum/19.2.1-desugar-labels-groups.md) Switch labels go through the literal reader, and fall-through labels share one arm; [19.2.2](phase-19-switch-enum/19.2.2-branch-arm-conditions.md) A switch branch carries one condition per case arm
- Row #3: [19.3.1](phase-19-switch-enum/19.3.1-handle-switch.md) One switch is one branch; [19.3.2](phase-19-switch-enum/19.3.2-switch-route-options.md) One route per label and for no match
- Row #4: [19.4.1](phase-19-switch-enum/19.4.1-switch-tests-a.md) The existing switch specimen tests, part a; [19.4.2](phase-19-switch-enum/19.4.2-switch-tests-b.md) The existing switch specimen tests, part b; [19.4.3](phase-19-switch-enum/19.4.3-switch-tests-c.md) The existing switch specimen tests, part c; [19.4.4](phase-19-switch-enum/19.4.4-specimen-enum.md) Hand-written enum specimen
- Row #5: [19.5.1](phase-19-switch-enum/19.5.1-specimen-fallthrough.md) Hand-written fall-through specimen
- Row #6: [19.6.1](phase-19-switch-enum/19.6.1-close-today-gaps.md) Close `enum-case-unread`, `switch-shape`

### Phase 20: Core: the never-read lint

- Row #1: [20.1.1](phase-20-never-read/20.1.1-lint-rule.md) The `never-read` rule; [20.1.2](phase-20-never-read/20.1.2-entry-points.md) Read a package's declared entry points; [20.1.3](phase-20-never-read/20.1.3-unread-binding-contract.md) The unread-binding contract
- Row #2: [20.2.1](phase-20-never-read/20.2.1-walk-facts-channel.md) The walk facts carry unread bindings; [20.2.2](phase-20-never-read/20.2.2-scope-record-channel.md) A scope record carries its unread bindings; [20.2.3](phase-20-never-read/20.2.3-handler-result-channel.md) A handler result carries unread bindings; [20.2.4](phase-20-never-read/20.2.4-extract-result-lints.md) The analysis projection result carries never-read lints; [20.2.5](phase-20-never-read/20.2.5-never-read-lint.md) The never-read lint transformer; [20.2.6](phase-20-never-read/20.2.6-export-reach.md) Which exports nothing reaches; [20.2.7](phase-20-never-read/20.2.7-report-gate-test.md) `never-read` rides the existing `deadSurface` gate
- Row #3: [20.3.1](phase-20-never-read/20.3.1-handler-result-layer.md) The handler-result layer passes unread bindings on; [20.3.2](phase-20-never-read/20.3.2-settle-handler.md) Settling a handler claims unread bindings; [20.3.3](phase-20-never-read/20.3.3-walk-facts-layer.md) Merging walk facts merges unread bindings
- Row #4: [20.4.1](phase-20-never-read/20.4.1-parameter-reads.md) Record whether each parameter is read; [20.4.2](phase-20-never-read/20.4.2-local-reads.md) Record whether each local is read; [20.4.3](phase-20-never-read/20.4.3-manual-smoke-entry-points.md) The manual smoke repo declares its entry points; [20.4.4](phase-20-never-read/20.4.4-core-fixtures.md) Core fixture repos declare their entry points; [20.4.5](phase-20-never-read/20.4.5-cli-fixtures.md) CLI fixture repos declare their entry points; [20.4.6](phase-20-never-read/20.4.6-app-fixtures.md) App fixture repos declare their entry points
- Row #5: [20.5.1](phase-20-never-read/20.5.1-projection.md) Merge the lints and drop branches that only feed an unread value; [20.5.2](phase-20-never-read/20.5.2-analyze-file-lints.md) The analyze-file broker merges the never-read lints; [20.5.3](phase-20-never-read/20.5.3-export-lints-run.md) Export lints reach the run
- Row #6: [20.6.1](phase-20-never-read/20.6.1-specimen-never-read.md) Hand-written never-read specimen
- Row #7: [20.7.1](phase-20-never-read/20.7.1-specimen-dead-export.md) The dead-export specimen's helper file and its package
- Row #8: [20.8.1](phase-20-never-read/20.8.1-specimen-dead-export-test.md) The dead-export specimen's entry file, its test and its registry line
- Row #9: [20.9](phase-20-never-read/20.9-fan-out.md) Fan-out: the specimen tests that gain a never-read lint
- Row #10: [20.10.1](phase-20-never-read/20.10.1-close-today-gaps.md) Close `never-read-lint`

### Phase 21: Core: the edge-value merge lint family

- Row #1: [21.1.1](phase-21-edge-merge-lints/21.1.1-lint-rules.md) The six rules; [21.1.2](phase-21-edge-merge-lints/21.1.2-config-toggles.md) Their global toggles; [21.1.3](phase-21-edge-merge-lints/21.1.3-operator-use-contract.md) The operator-use contract
- Row #2: [21.2.1](phase-21-edge-merge-lints/21.2.1-report-toggles.md) The report applies each toggle (optional parameter); [21.2.2](phase-21-edge-merge-lints/21.2.2-walk-facts-channel.md) The walk facts carry operator uses; [21.2.3](phase-21-edge-merge-lints/21.2.3-scope-record-channel.md) A scope record carries its operator uses; [21.2.4](phase-21-edge-merge-lints/21.2.4-handler-result-channel.md) A handler result carries operator uses; [21.2.5](phase-21-edge-merge-lints/21.2.5-extract-result-lints.md) The analysis projection result carries edge-merge lints; [21.2.6](phase-21-edge-merge-lints/21.2.6-read-operator-use.md) Read one node as an operator use; [21.2.7](phase-21-edge-merge-lints/21.2.7-truthiness-rules.md) Truthiness and or-default; [21.2.8](phase-21-edge-merge-lints/21.2.8-operator-rules.md) Loose equality, typeof object, mixed plus, global isNaN
- Row #3: [21.3.1](phase-21-edge-merge-lints/21.3.1-unit-run-optional.md) The unit-run responder passes the toggles on (optional); [21.3.2](phase-21-edge-merge-lints/21.3.2-handler-result-layer-uses.md) The handler-result layer passes operator uses on; [21.3.3](phase-21-edge-merge-lints/21.3.3-settle-handler-uses.md) Settling a handler claims operator uses; [21.3.4](phase-21-edge-merge-lints/21.3.4-walk-facts-layer-uses.md) Merging walk facts merges operator uses; [21.3.5](phase-21-edge-merge-lints/21.3.5-edge-merge-lint.md) The edge-merge lint transformer
- Row #4: [21.4.1](phase-21-edge-merge-lints/21.4.1-flow-passes-toggles.md) The CLI flow passes the config toggles; [21.4.2](phase-21-edge-merge-lints/21.4.2-handle-binary.md) Handler for a binary expression; [21.4.3](phase-21-edge-merge-lints/21.4.3-handle-call-uses.md) A call records an `isNaN` use; [21.4.4](phase-21-edge-merge-lints/21.4.4-handle-if-uses.md) An `if` condition records its operator uses; [21.4.5](phase-21-edge-merge-lints/21.4.5-handle-ternary-uses.md) A ternary condition records its operator uses; [21.4.6](phase-21-edge-merge-lints/21.4.6-handle-exit-uses.md) An exit expression records its operator uses; [21.4.7](phase-21-edge-merge-lints/21.4.7-handle-function-uses.md) A concise arrow body records its operator uses; [21.4.8](phase-21-edge-merge-lints/21.4.8-projection.md) Merge the lints into the analysis; [21.4.9](phase-21-edge-merge-lints/21.4.9-analyze-file-lints.md) The analyze-file broker merges the edge-merge lints
- Row #5: [21.5.1](phase-21-edge-merge-lints/21.5.1-dispatch-binary.md) The dispatch route for a binary expression; [21.5.2](phase-21-edge-merge-lints/21.5.2-unit-run-required.md) The unit-run responder requires the toggles
- Row #6: [21.6.1](phase-21-edge-merge-lints/21.6.1-report-required.md) The report requires the toggles; [21.6.2](phase-21-edge-merge-lints/21.6.2-specimen-truthiness.md) Hand-written truthiness specimen
- Row #7: [21.7.1](phase-21-edge-merge-lints/21.7.1-specimen-or-default.md) Hand-written or default specimen
- Row #8: [21.8.1](phase-21-edge-merge-lints/21.8.1-specimen-loose-equality.md) Hand-written loose equality specimen
- Row #9: [21.9.1](phase-21-edge-merge-lints/21.9.1-specimen-typeof-object.md) Hand-written typeof object specimen
- Row #10: [21.10.1](phase-21-edge-merge-lints/21.10.1-specimen-mixed-plus.md) Hand-written mixed plus specimen
- Row #11: [21.11.1](phase-21-edge-merge-lints/21.11.1-specimen-global-isnan.md) Hand-written global isnan specimen
- Row #12: [21.12.1](phase-21-edge-merge-lints/21.12.1-mixed-plus-ordinary-bucket.md) A rule-named value replaces a member's ordinary value in a branchless entry; [21.12.2](phase-21-edge-merge-lints/21.12.2-mixed-plus-statics.md) Core's rule-named value for mixed plus; [21.12.3](phase-21-edge-merge-lints/21.12.3-projection-edge-merge-severity.md) The generator's projection reads each edge-merge rule's default severity
- Row #13: [21.13.1](phase-21-edge-merge-lints/21.13.1-derive-cases-rule-named.md) Derive cases passes the rule-named values on
- Row #14: [21.14.1](phase-21-edge-merge-lints/21.14.1-analyze-file-rule-named.md) The analyze-file broker builds the rule-named values from the mixed-plus uses
- Row #15: [21.15.1](phase-21-edge-merge-lints/21.15.1-flow-toggles-integration.md) The CLI flow passes the toggles: integration cases
- Row #16: [21.16](phase-21-edge-merge-lints/21.16-fan-out.md) Fan-out: the specimen tests that gain an edge-value merge lint
- Row #17: [21.17.1](phase-21-edge-merge-lints/21.17.1-close-today-gaps.md) Close `edge-merge-lint`

### Phase 22: Core: environment reads in functions and template literals

- Row #1: [22.1.1](phase-22-env/22.1.1-cause-arrange-env.md) `cause-arrange` treats an absent `envDrivable` as true; [22.1.2](phase-22-env/22.1.2-derive-cases-env.md) `derive-cases` treats an absent `envDrivable` as true; [22.1.3](phase-22-env/22.1.3-derive-request-env.md) `derive-cases-request` treats an absent `envDrivable` as true; [22.1.4](phase-22-env/22.1.4-env-step-template.md) The `template` env step; [22.1.5](phase-22-env/22.1.5-literal-template-text.md) The literal reader reads a template's head and its span's literal
- Row #2: [22.2.1](phase-22-env/22.2.1-analyze-file-env.md) The analyze-file broker stops passing `envDrivable`; [22.2.2](phase-22-env/22.2.2-harness-realize-env.md) The harness-realize broker stops passing `envDrivable`; [22.2.3](phase-22-env/22.2.3-compose-cross-file-env.md) The compose-cross-file-predicates broker stops passing `envDrivable`; [22.2.4](phase-22-env/22.2.4-through-caller-env.md) The through-caller-cases transformer stops passing `envDrivable`; [22.2.5](phase-22-env/22.2.5-through-callback-env.md) The through-callback-cases transformer stops passing `envDrivable`; [22.2.6](phase-22-env/22.2.6-funnel-named-env.md) The funnel-named-cases transformer stops passing `envDrivable`; [22.2.7](phase-22-env/22.2.7-through-invocation-env.md) The through-invocation-cases transformer stops passing `envDrivable`; [22.2.8](phase-22-env/22.2.8-read-env-chain-template.md) The template step, forward: read it from the code; [22.2.9](phase-22-env/22.2.9-env-encode-template.md) The template step, backward: invert it; [22.2.10](phase-22-env/22.2.10-env-steps-type-template.md) The template step, typed; [22.2.11](phase-22-env/22.2.11-env-requirement-template.md) The template step, forward: check it against a predicate; [22.2.12](phase-22-env/22.2.12-argv-template.md) The template step, forward: a command-line read
- Row #3: [22.3.1](phase-22-env/22.3.1-derive-request-drop.md) The request transformer drops the flag
- Row #4: [22.4.1](phase-22-env/22.4.1-derive-cases-drop.md) Derive cases drops the flag
- Row #5: [22.5.1](phase-22-env/22.5.1-cause-arrange-drop.md) Cause arrange drops the flag; [22.5.2](phase-22-env/22.5.2-core-claude-env.md) The core doc's environment text; [22.5.3](phase-22-env/22.5.3-specimen-env-in-function.md) Hand-written env-in-function specimen
- Row #6: [22.6.1](phase-22-env/22.6.1-specimen-env-template.md) Hand-written env-template specimen
- Row #7: [22.7.1](phase-22-env/22.7.1-close-today-gaps.md) Close `env-in-function`, `template-literal-env-chain`

### Phase 23: Core: barrels, build-error reasons and unresolvable imports

- Row #1: [23.1.1](phase-23-file-boundary/23.1.1-barrel-follow.md) Follow a callee through a barrel; [23.1.2](phase-23-file-boundary/23.1.2-compile-result-reason.md) A build error carries a reason token; [23.1.3](phase-23-file-boundary/23.1.3-resolve-graph-result-contract.md) The resolve-graph result carries a reason; [23.1.4](phase-23-file-boundary/23.1.4-reconcile-result-contract.md) The stub-overlay reconcile result carries a reason; [23.1.5](phase-23-file-boundary/23.1.5-contradictions-contract.md) The stub-contradictions result carries a reason; [23.1.6](phase-23-file-boundary/23.1.6-harness-graph-result-contract.md) The harness-graph result carries a reason
- Row #2: [23.2.1](phase-23-file-boundary/23.2.1-resolve-graph-reasons.md) The three import reasons; [23.2.2](phase-23-file-boundary/23.2.2-stale-stub.md) `stale-stub`; [23.2.3](phase-23-file-boundary/23.2.3-contradicting-stub.md) `contradicting-stub`; [23.2.4](phase-23-file-boundary/23.2.4-harness-reasons.md) `harness-key`; [23.2.5](phase-23-file-boundary/23.2.5-parse-failure-reason.md) `parse-failure`; [23.2.6](phase-23-file-boundary/23.2.6-barrel-callers-predicates.md) The cross-file predicates compose passes the imported name; [23.2.7](phase-23-file-boundary/23.2.7-barrel-callers-map.md) The cross-file map compose passes the imported name; [23.2.8](phase-23-file-boundary/23.2.8-barrel-callers-probes.md) The cross-file probes broker passes the imported name
- Row #3: [23.3.1](phase-23-file-boundary/23.3.1-unresolved-blocks.md) An unresolvable import leaves no undriven admission: the transformer; [23.3.2](phase-23-file-boundary/23.3.2-specimen-barrel-files.md) The barrel specimen's helper and barrel files
- Row #4: [23.4.1](phase-23-file-boundary/23.4.1-specimen-barrel-test.md) The barrel specimen's entry file, its test and its registry line; [23.4.2](phase-23-file-boundary/23.4.2-analyze-file-unresolved.md) The analyze-file broker finds the file's unresolvable imports
- Row #5: [23.5.1](phase-23-file-boundary/23.5.1-run-unit-unresolved.md) A run passes the file's path to the analysis; [23.5.2](phase-23-file-boundary/23.5.2-observe-unresolved.md) The generator's observation passes the file's path to the analysis
- Row #6: [23.6.1](phase-23-file-boundary/23.6.1-close-today-gaps.md) Close `barrel-follow`, `p1-reason-token`, `unresolved-import-admits`

### Phase 24: Core: known values from afar

- Row #1: [24.1.1](phase-24-known-values/24.1.1-lint-trace.md) A lint carries a path trace; [24.1.2](phase-24-known-values/24.1.2-error-trace.md) A build error carries a path trace; [24.1.3](phase-24-known-values/24.1.3-operand-known-contract.md) The condition leaf carries a known-value record; [24.1.4](phase-24-known-values/24.1.4-const-readout-contract.md) The const-operand readout carries a known-value set; [24.1.5](phase-24-known-values/24.1.5-call-arg-known-contract.md) A call argument can carry a line and a literal set; [24.1.6](phase-24-known-values/24.1.6-contradictions-trace-contract.md) The stub-contradictions result carries a trace; [24.1.7](phase-24-known-values/24.1.7-known-weld-contract.md) The known-weld contract
- Row #2: [24.2.1](phase-24-known-values/24.2.1-const-known-sets.md) A const records a set of known values and where it entered; [24.2.2](phase-24-known-values/24.2.2-build-leaf-known.md) A condition leaf copies the known-value record; [24.2.3](phase-24-known-values/24.2.3-stamp-known.md) A welded known set stamps its leaves; [24.2.4](phase-24-known-values/24.2.4-literal-type-truthiness.md) A literal-union type, and a type that is never missing, is a known set; [24.2.5](phase-24-known-values/24.2.5-domain-empty.md) An empty domain proves a dead arm; [24.2.6](phase-24-known-values/24.2.6-unreachable-lint-consumption.md) The lint lands at the consumption point with its trace; [24.2.7](phase-24-known-values/24.2.7-stub-contradiction-consumption.md) A contradicting stub lands at the consumption point; [24.2.8](phase-24-known-values/24.2.8-stub-consumers.md) Where a corrected type enters the chain
- Row #3: [24.3.1](phase-24-known-values/24.3.1-stamp-branches-known.md) Stamping branches passes the known sets on; [24.3.2](phase-24-known-values/24.3.2-cause-arrange-known.md) Seed known sets, `.length` of a literal union included; [24.3.3](phase-24-known-values/24.3.3-compile-run-consumers.md) The compile passes the stub consumers to the contradiction check; [24.3.4](phase-24-known-values/24.3.4-read-call-args-known.md) A call argument records its line and a literal set
- Row #4: [24.4.1](phase-24-known-values/24.4.1-request-known.md) The derive-cases request passes the known sets on; [24.4.2](phase-24-known-values/24.4.2-derive-cases-known.md) Derive cases forwards the known record of a dead arm
- Row #5: [24.5.1](phase-24-known-values/24.5.1-through-caller-known.md) Known values cross same-file callers; [24.5.2](phase-24-known-values/24.5.2-through-invocation-known.md) An immediately-invoked function records its known values; [24.5.3](phase-24-known-values/24.5.3-cross-file-known.md) Known values cross files; [24.5.4](phase-24-known-values/24.5.4-analyze-file-relpath.md) The analyze-file broker builds consumption-point lints
- Row #6: [24.6.1](phase-24-known-values/24.6.1-lint-relpath-required.md) The unreachable-lint transformer requires `relPath`; [24.6.2](phase-24-known-values/24.6.2-e2e-welded-arg.md) The welded-argument lint row in the detail e2e moves with the lint
- Row #7: [24.7.1](phase-24-known-values/24.7.1-specimen-same-file.md) Hand-written same-file known-value specimen; [24.7.2](phase-24-known-values/24.7.2-unreachable-tests-a.md) The unreachable-exit specimen tests, first three; [24.7.3](phase-24-known-values/24.7.3-unreachable-tests-b.md) The unreachable-exit specimen tests, next three; [24.7.4](phase-24-known-values/24.7.4-unreachable-tests-c.md) The unreachable-exit specimen test, last one
- Row #8: [24.8.1](phase-24-known-values/24.8.1-specimen-two-files-sources.md) The two-files specimen's helper files
- Row #9: [24.9.1](phase-24-known-values/24.9.1-specimen-two-files-test.md) The two-files specimen's entry file, its test and its registry line
- Row #10: [24.10.1](phase-24-known-values/24.10.1-specimen-stub-correction-sources.md) The stub-correction specimen, its correction and its registry line
- Row #11: [24.11.1](phase-24-known-values/24.11.1-specimen-stub-correction-test.md) The stub-correction specimen's test
- Row #12: [24.12](phase-24-known-values/24.12-fan-out.md) Fan-out: the specimen tests that still assert a lint at the dead arm
- Row #13: [24.13.1](phase-24-known-values/24.13.1-close-today-gaps.md) Close `known-value-consumption-point`, `known-value-cross-file`

### Phase 25: Core: a guard narrowing `unknown`

- Row #1: [25.1.1](phase-25-guard-unknown/25.1.1-predicate-narrows.md) A predicate kind for a type guard; [25.1.2](phase-25-guard-unknown/25.1.2-projection-typed-fields.md) The generator's projection reads the typed `param`, `reason` and `trace` fields
- Row #2: [25.2.1](phase-25-guard-unknown/25.2.1-read-guard-call.md) Read a same-file type-guard call; [25.2.2](phase-25-guard-unknown/25.2.2-type-fillable-unknown.md) Fill `unknown` when a guard narrows it; [25.2.3](phase-25-guard-unknown/25.2.3-type-to-range-narrows.md) `type-to-range` reads a `narrows-to` predicate; [25.2.4](phase-25-guard-unknown/25.2.4-predicate-constraining-narrows.md) A `narrows-to` predicate constrains; [25.2.5](phase-25-guard-unknown/25.2.5-domain-values-guard.md) Values for each arm of a guard
- Row #3: [25.3.1](phase-25-guard-unknown/25.3.1-fill-param-unknown.md) Build an `unknown` argument
- Row #4: [25.4.1](phase-25-guard-unknown/25.4.1-cause-arrange-narrows.md) Cause arrange builds each arm of a guard
- Row #5: [25.5.1](phase-25-guard-unknown/25.5.1-specimen-guard.md) Hand-written guard specimen
- Row #6: [25.6.1](phase-25-guard-unknown/25.6.1-close-today-gaps.md) Close `guard-narrows-unknown`

### Phase 26: Core: derived stub values

- Row #1: [26.1.1](phase-26-stub-values/26.1.1-property-demand-forms.md) A property demand can say "left out", hold an array, or hold an object; [26.1.2](phase-26-stub-values/26.1.2-env-stub-unset.md) An environment stub can say "left unset"; [26.1.3](phase-26-stub-values/26.1.3-object-stub-param-key.md) An object stub can name a parameter instead of a declared type; [26.1.4](phase-26-stub-values/26.1.4-plain-values.md) Core's plain value of each type
- Row #2: [26.2.1](phase-26-stub-values/26.2.1-gather-inline-param-types.md) Group the reads of a parameter whose object type is written inline; [26.2.2](phase-26-stub-values/26.2.2-demand-values-per-arm.md) A property demand holds one ordinary value per arm; [26.2.3](phase-26-stub-values/26.2.3-env-values-per-arm.md) An environment stub holds one ordinary value per arm; [26.2.4](phase-26-stub-values/26.2.4-stub-graph-tests.md) The stub-graph broker tests expect the new demand values; [26.2.5](phase-26-stub-values/26.2.5-demand-reader-tests.md) The demand readers' tests expect the new demand values; [26.2.6](phase-26-stub-values/26.2.6-stub-realize-tests.md) The stub overlay's tests expect the new demand values
- Row #3: [26.3.1](phase-26-stub-values/26.3.1-stub-graph-writes-new-stubs.md) The stub stitch writes parameter stubs and the new environment values
- Row #4: [26.4.1](phase-26-stub-values/26.4.1-specimen-derived-values.md) Hand-written specimen for derived stub values
- Row #5: [26.5](phase-26-stub-values/26.5-fan-out.md) Fan-out: the specimen tests that assert a stub index or a value it fed
- Row #6: [26.6.1](phase-26-stub-values/26.6.1-close-today-gaps.md) Close `derived-stub-values`

### Phase 27: Settle the disputed cards

- Row #1: [27.1.1](phase-27-disputed/27.1.1-settle-disputed-cards.md) Operator and user: read the answers to the disputed cards
- Row #2: [27.2](phase-27-disputed/27.2-fan-out.md) Fan-out: the fixes the user's answers ask for
- Row #3: [27.3.1](phase-27-disputed/27.3.1-remove-disputed-entries.md) Remove the disputed entries

## Reference

### The report vocabulary

The generator writes predictions in the labels Assayer reports, so a generated test compares them directly. The
generator holds this table in `report-vocabulary-statics.ts` (task 1.1.4). The core phases emit exactly these kinds
and labels.

| Design form | Reported kind | Design arm → reported label | Listed in "Expected branches" | Core emits it from |
|---|---|---|---|---|
| `if` | `if` | then → `then`, else → `else` | yes | today |
| ternary | `ternary` | then → `then`, else → `else` | yes | today |
| `&&` (exit or value) | `ternary` | evaluates right → `then`, stops at left → `else` | yes | exit today, value phase 11 |
| `\|\|` (exit or value) | `ternary` | stops at left → `then`, evaluates right → `else` | yes | exit today, value phase 11 |
| `??` (exit or value) | `ternary` | left → `then`, right → `else` | yes | exit today, value phase 11 |
| `?.` (exit) | `ternary` | present → `then`, absent → `else` | yes | one level today, chains phase 18 |
| `switch` | `switch` | `case:<label>`, `case:<a>\|<b>` (labels that fall through), `default`, `no-match`. `<label>` is the case's literal value, read through `getLiteralValue()`; an enum member's label is its value, so card `type/enum`'s "case Low" is `case:0` | yes | phase 19 |
| parameter default | `default` | `given`, `defaulted` | yes | phase 13 |
| destructuring default | `destructure-default` | `present`, `defaulted` | yes | phase 13 |
| `??=`, `\|\|=`, `&&=` | `logical-assign` | `kept`, `assigned` | yes | phase 15 |
| `for`, `for…of`, `for…in`, `while` | `loop` | `skipped`, `runs` | yes | phase 14 |
| `do…while` | `loop` | `repeats`, `stops` | yes | phase 14 |
| array callback | `callback` (no `BranchNode`) | `skipped`, `runs` | yes | today |
| promise callback whose receiver can reject | `callback` (no `BranchNode`) | `runs`, `skipped` | yes | phase 17 |
| promise callback whose receiver never rejects | none: one arm is no branch | (no step) | no | phase 17 |
| `try` | `try` | `finishes`, `catches` | yes | phase 16 |
| returned comparison | `return-comparison` (no `BranchNode`) | true → `return-true`, false → `return-false` | no (routes only) | today |

A `?.` inside a condition is a non-nullish leaf of that condition, never a branch. An `&&`, `||` or `??` inside a
condition adds leaves, never a branch. `present` and `absent` are names the generator uses inside its declarations
only; a report always says `then` and `else` (DESIGN.md decision "`?.` arms").

**Route wording.** A card's route line can hold words that are not arms: an exit's value (`exits big`,
`yields 'small'`), a settlement (`resolves`, `rejects`, `throws`), a side effect (`logs`, `does nothing`), a callback
with no listed branch (`callback runs`, `check true`), or a call count (`2 calls`). A transcription drops every word
that is not an arm of a listed branch and keeps the arms (tasks 7.2.1 to 7.2.9).

Lint severity: each rule takes its default config's severity, and the smoke repo uses the default config (DESIGN.md
decision "Lint severity"). `unreachable-exit`, `dead-surface` and `never-read` ride `deadSurface` and are `error`;
each `edge-merge-*` rule has its own toggle and is `warn` (task 1.1.4, `lintSeverity`).

Lint rules: `unreachable-exit` and `dead-surface` (exist), `never-read` (phase 20), `edge-merge-truthiness`,
`edge-merge-or-default`, `edge-merge-loose-equality`, `edge-merge-typeof-object`, `edge-merge-mixed-plus`,
`edge-merge-global-isnan` (phase 21).

Build-error reason tokens (phase 23): `cannot-resolve-specifier`, `dynamic-or-computed-specifier`,
`no-usable-types`, `stale-stub`, `contradicting-stub`, `harness-key`, `parse-failure`. Until phase 23 the observation
reads `unclassified`.

### What a generated test compares

One `toStrictEqual` on a `SpecimenReport` (task 1.4.1), the shape both the prediction and the observation produce:

| Field | Prediction (generator, never Assayer) | Observation (task 8.2.1) |
|---|---|---|
| `branches` | every listed probe: file, kind, line, every arm | every `BranchNode` plus callback pseudo branches, with the file each sits in |
| `routes` | one row per distinct route, by the cause rule, with `driven` | one row per case in the every-route set |
| `fewestRuns` | the size of the smallest driven cover of every arm | the count of cases both driven and in the fewest-runs set |
| `caseFailures` | always empty | run cases that failed or errored |
| `lints` | rule, severity, file, line, and the path trace for a known-value lint | rule, severity (the default config of the rule's toggle), file, line, trace (`[]` until phase 24) |
| `undriven` | admission file and line in each file's own analysis | each file's own analysis |
| `darkSpots` | always empty | each file's own analysis, with its file |
| `gaps` | `<entry>.<parameter>` | the run's gaps, named the same way (phase 12 adds the parameter) |
| `buildErrors` | file, line, reason token, trace | compile errors for the specimen folder |
| `stubValues` | the ordinary value of each arm of each stubbed input, at its path (task 1.4.1) | the stub index the compile wrote (phase 26 makes it hold these values) |

Not compared, on purpose:

- the input values Assayer picks. The generator predicts structure, never Assayer's choice of values, as
  `scrolls/specimen-generator/IMPLEMENTATION.md` decided;
- which equal-arm case the fewest-runs tie-break picks, which is Assayer's own enumeration order;
- lint and admission wording, which core's own tests assert word for word.

The stub values Assayer derives are compared (DESIGN.md decision "Do generated tests compare derived stub values?").
They are not "the input values Assayer picks": they are the values Assayer derives for a human to review, and both
sides derive them by one rule, the ordinary value of each arm.

### The cause rule: which inputs are separate routes

This is DESIGN.md decision "Which values are separate cases in every route" and section "Edge values", written as
the algorithm the generator (tasks 1.1.3, 6.1.1, 6.2.1, 6.2.3) and core (phase 12) both implement.

1. **An ordinary value per arm combination.** For each combination of arms that can run together, derive one input
   from the arms' own conditions: `count > 2` gives `3` for then and `2` for else; `name.length > 5` gives a string of
   6 characters; `count === 7` gives `7` and `8`; `typeof value === 'string'` gives a string for then and a number
   for else.
   - In a condition, each short-circuit cause of an arm is its own ordinary input. For `ready && count > 2` the else
     arm has two causes: `ready false`, and `ready true` with `count 2`. For `x ?? 5` the left arm has a normal value
     and a falsy value, and the right arm has a missing value.
   - When a leaf's type is a union of base types, such as `number | string`, each member type gets its own ordinary
     value on each arm it can reach.
   - When an edge-value-merge rule names a value for a member type, that value is the member's ordinary value on the
     arm it lands on: `'0'` for `value == 0` on the true arm, `'1'` for `base + extra`.
2. **An edge value per leaf operand.** Each edge value of each leaf operand's type is one more input, on the arm it
   lands on. The edge values are DESIGN.md's fixed list: `0`, `NaN` and `-1` for a number; `''` for a string;
   `false` for a boolean; `null` and `undefined` where the type allows each; each member of a literal union or enum;
   an array empty, with one item and with many; `{}` where the type allows it; each missing `?.` level; an unset
   environment variable; a parameter left out when it is optional or has a default. A property present as
   `undefined` is an edge value only where an `in` check reads that property, and never under
   `exactOptionalPropertyTypes`.
3. **One input at a time.** While one input takes an edge value, every other input takes the first ordinary value
   that still lets the edge-valued input be read, in the order DESIGN.md decision "Which value the other inputs take
   in an edge-value case" fixes: an input's value for its then arm (or first arm) before its value for its else arm.
   For `ready && count > 2`, the count cases use `ready true`; in card `optional-param/alone`, `label ''` pairs with
   `count 3`.
   Two inputs never take edge values in the same route. An array's item takes its element's ordinary and edge values
   only in the one-item array. The empty and many arrays each add one route, with every other input at its first
   value. A many array mixes items so it takes as many arms as one run can.
4. **Listed once.** A route is identified by its arm set plus the values its run actually read. An ordinary value
   that is also an edge value is one route. An input the run never read does not make a route of its own, so two
   routes that differ only in an unread input are one route (generator task 6.2.3, core task 12.7.1).
5. **Nothing for an unread input.** A parameter that nothing reads, or that only feeds a value nothing reads, gets no
   edge-value routes (cards `shape/if-if/sequence/three-args-one-unused`, `consume/never-read`).
6. **Undriven routes.** A route Assayer cannot steer is listed once per arm combination, with no edge-value routes,
   because no test can set its input (card `callback/returned-closure`).
7. **Fewest runs is unchanged.** It is the smallest set of driven routes that takes every reachable arm.

An array's element values follow the same rule inside the one-item array: an index read (`counts[0]`, core tasks
12.1.7, 12.6.2 and 12.7.1), a mapped callback's item (task 12.6.3), a loop item and its property, and a nested loop
(tasks 14.1.2, 14.2.1, 14.2.4, 14.3.2 and 14.4.1).

Core today builds one value per arm, and crosses each array parameter's three sizes with every other input
(`packages/core/src/transformers/cause-arrange/cause-arrange-transformer.ts:429`, "const arrayCombos =
arrayChoices.reduce<…>"). Phase 12 changes core to this rule. Until then every specimen whose routes hold an edge
value carries the today id `edge-values`.

### How the prediction engine works

DESIGN.md decision "How the generator predicts routes" decides this. Each piece records, per arm, what must hold to
enter it and what it writes, and the parent combines the records (DESIGN.md "How a parent finds its states"). The
generator gets those records by running the rendered specimen in its own sandbox. Running the specimen keeps rule
P4: the code under test is Assayer, and JavaScript decides which arm runs.

1. The generator renders `entry.ts` and its sibling files from the piece declarations (phase 5).
2. It rewrites a copy of the source with probes at every arm and every leaf its pieces declare (task 6.2.2). A probe
   records the arm taken or the value a leaf read. It never changes what the code computes.
3. It derives inputs by the cause rule (tasks 6.1.1 and 6.2.1): an ordinary input for each arm, from that arm's own
   condition, plus each edge value, one at a time.
4. It runs the probed copy once per input in a fresh `vm` context (task 6.3.1). A loop's record repeats per pass and
   a sequence of calls repeats the function's record per call, because the code really runs that way. A run that
   exceeds the deterministic pass cap is refused, never timed out.
5. A route is a distinct arm set plus the values read (task 6.2.3). A combination that contradicts itself never
   appears, because no input produces it. Fewest runs is a set cover over arms (task 6.1.2).
6. An arm no input reaches is checked against the known values (task 6.1.6). When a known value kills it, the
   generator predicts an unreachable-exit lint at the consumption point, with the path trace, or a P1 build error
   when the known value is a stub correction. When no known value kills it, the generator refuses the specimen and
   names the arm, the same way TypeScript refuses a file. It never predicts a lint because "no input reached the
   arm".

This never runs Assayer and never reads its output. The card check (phase 7) holds the engine to every hand-written
DESIGN.md card.

### Known values and the consumption point

DESIGN.md section "Known values from afar" and decisions "When is an arm unreachable?", "Which channel reports a dead
arm" and "Does a type count as a known value?" decide this.

| Known value | Where it enters (the consumption point) | Channel |
|---|---|---|
| a literal argument at a call site, `measure(5)` | the call | unreachable-exit lint, `deadSurface` toggle |
| a `const` holding a literal, or a ternary of literals | the first read that passes it into a call, or a branch's read in the same function | unreachable-exit lint |
| a stub correction's values | the entry parameter whose type the correction covers | P1 build error, reason `contradicting-stub` |
| a type whose every member is a literal, `'a' \| 'b'` | the parameter that declares the type (DESIGN.md decision "Where a type known value is reported") | unreachable-exit lint |
| an array or object type that cannot be missing (`items: number[]`): every value is truthy, so a truthiness check's falsy arm is dead | the parameter that declares the type | unreachable-exit lint (DESIGN.md edge-value merge rule "always truthy"; tasks 6.1.6 and 24.2.4) |

The path trace lists every step from the consumption point to the dead arm, as `{ file, line }` pairs: the
consumption point, each call or import hop, and the branch whose arm is dead. Where no known value reaches a branch,
nothing is flagged and every arm is assumed reachable.

### Running at scale

DESIGN.md decisions "Matrix size", "Running at scale" and "Speed of the generated run" decide this. Phase 8b builds
it. Speed is not optimised in this plan: there is no batching, no result cache, and no change to how the generated
tests run.

- **No cap.** `--count` and every generation print the total, broken down per axis, per layer (the level 0 to 3) and
  per today id. Task 4.9.1 records the first measurement.
- **Capacity.** Lockdown-kit's load balancer (`@legendscribe/lockdown-kit-load-balancer`) leases capacity by tool,
  and its lease tool enum is `'ward' | 'siegelense'` (`lease-take-broker.ts`, "tool: 'ward' | 'siegelense';"). This
  plan takes leases with tool `'ward'`, the closest kind of work, and a label that names the job:
  `assayer-specimen-generator` for a generation and `assayer-test-generated` for a generated run (DESIGN.md decision
  "Leases on the load balancer": the existing `'ward'` value, no new one).
  - **Generation** (task 9.2.1) takes one lease for its own pid, waits while `capacityReadBroker` suggests no free
    slot, beats the lease while it works, and releases it in a `finally`.
  - **The generated run** (tasks 8b.3.1 and 8b.6.1) goes through a wrapper. `npm run test:generated -- <folder>/`
    runs the wrapper, which refuses a run with no folder, takes a lease, sets `MAX_WORKERS` from the capacity
    suggestion (never above the hand-written `jest.config.js` default of 4), runs Jest with the folder, beats, and
    releases.
- **The observation.** Each generated test observes its specimen through a per-specimen mirror (task 8.3.1): one fixed
  temporary folder per process, rebuilt for each specimen with the specimen's direct `.ts` files and its stub
  correction, compiled on its own, then every file run with the mirror's `.assayer/cache` as the cache. A generated run
  therefore costs one small compile per specimen. That is accepted: speed is not optimised in this plan.
- **Generation cache.** A content-keyed cache lives outside git, under `node_modules/.cache/assayer-specimen-generator/`.
  Each entry holds one specimen's typecheck verdict and prediction. Its key hashes the generator fingerprint (task
  8b.2.2: the bytes of every non-test file under `packages/specimen-generator/src/` and `declarations/`, the bytes of
  `package-lock.json`, of `packages/core/index.ts` and of the two npm packages' `package.json` files, the TypeScript
  version and `process.version`), the specimen's plan and its rendered files. So adding a layer regenerates only what
  changed. A cache hit returns exactly what a fresh run computes, because the key covers every input of that
  computation. `--fresh` ignores the cache and rewrites it. `--check` output stays byte-identical to a fresh
  generation. Task 9.4.1 proves both: a plain `--check` right after a `--fresh` write reads every specimen from the
  cache and exits 0, and `--check --fresh` exits 0 too.

### Output layout

```
smoke-repo/packages/syntax-repository/
  package.json  tsconfig.json  jest.config.js  global-setup.js  global-teardown.js  concurrency-lock.js   hand-written
  specimen-manifest.json      one SpecimenEntry per specimen (task 1.3.2)
  REFUSED.md                  specimens TypeScript or the prediction engine refused, with the reason
  EXPECTED-FAILURES.md        every it.failing specimen, by today id
  src/<folder>/entry.ts       the specimen; exports `entry` (or class `Entry`), or a card's own export name
  src/<folder>/entry.test.ts  its generated test
  src/<folder>/<sibling>.ts   file-boundary companions and multi-file cards
  src/<folder>/entry.harness.ts               companion harness
  src/<folder>/tsconfig.json                  compiler-options variant
smoke-repo/assayer/stubs/objects/packages/syntax-repository/src/<folder>/entry.ts/<Type>.json
                              a companion stub correction, at the root of the repo Assayer analyses; generated,
                              cleared and rewritten with `src/`, compared by `--check`, covered by the cache
```

- The hand-written `package.json` declares every specimen's `entry.ts` as an entry point, with
  `"exports": { "./*": "./src/*/entry.ts" }` (task 9.1.5). So a specimen's `entry` export is never "never read"
  (DESIGN.md decision "Does never read apply to exports?").
- The hand-written `tsconfig.json` excludes `src/boundary/*/unresolvable-*/**` (task 9.1.5). Those specimens import
  something that cannot resolve on purpose, and `npm run typecheck:generated` would otherwise fail with TS2307 or
  TS7016.
- Folder rules (task 4.1.2): `src/<piece>/alone`, `src/<piece>/as-<position>`, `src/<piece>/exit/<slot>`,
  `src/<piece>/in/<slot>/<slot>` (level 0 at the module is `in/module`), `src/<piece>/holds/<child>`,
  `src/<piece>/sequence`, `src/<axis folder>/<piece>/<value>`, `src/shape/<a>-<b>/<nested|sequence>/<args>`. A
  DESIGN.md card keeps the folder its "Folder:" line gives. Two cards with the same code share one specimen
  (`sameAs`). A specimen folder may hold another (`src/const/in/for-of-body` and `src/const/in/for-of-body/if-then`).

### Commands

| Command | What it does | Task |
|---|---|---|
| `npm run generate:specimens` | writes the smoke repo and prints the count report | 9.3.1 |
| `npm run generate:specimens -- --check` | compares a fresh generation with the committed files; ward runs it | 9.3.1 |
| `npm run generate:specimens -- --fresh` | ignores the generation cache and rewrites it; combines with a write or `--check` | 9.3.1 |
| `npm run generate:specimens -- --count [--piece=a,b] [--axis=a,b]` | prints counts by focus, axis, layer, top folder and today id | 4.7.1, 9.8.1 |
| `npm run generate:specimens -- --list-pieces` | loads every declaration and lists pieces, shims, slots, arms, axes and card count | 2.5.1 |
| `npm run generate:specimens -- --show=<folder>[,<folder>]` | prints each specimen's files, predicted report (its stub values included) and today ids as JSON | 6.5.1 |
| `npm run test:generated -- <folder>/` | runs one top folder's generated tests under a capacity lease | 8b.6.1 |
| `npm run typecheck:generated` | typechecks the smoke repo | existing |

### Measured sizes

Task 4.9.1 pastes the output of `npm run generate:specimens -- --count` here, under the date and the commit.

(not measured yet)

### Migration of the old declarations and code

| Old | New | Task |
|---|---|---|
| `declarations/syntax/{if,ternary,eq,gt,not,nullish}.syntax.ts` | `declarations/pieces/<same>.piece.ts` | 2.6.1, 2.6.2; old deleted 9.7.6 |
| `declarations/containers/*.container.ts` | `declarations/pieces/*.piece.ts`; `iife` and `default-export` dropped (DESIGN.md decision "Containers the pieces table does not name"). `async-function` and `generator-function` are kept, because DESIGN.md's pieces table names both (rows "async function, including an async arrow" and "generator function `function*`") | 2.6.3 to 2.6.5; old deleted 9.7.5 |
| `declarations/shims/*.shim.ts` | unchanged; loaded and checked, never placed (task 2.2.1) | 2.3.1 |
| `declarations/kit.ts` | gains `piece`, `compositions` and their types; loses `container`, `syntax` | 1.1.1, 9.7.6 |
| `brokers/declarations/load` | `brokers/pieces/load` | 2.3.1, 9.5.1 |
| `brokers/specimens/generate` | `brokers/specimens/build` and `brokers/specimens/plan` | 9.2.1, 4.6.1, 9.5.1 |
| `brokers/specimens/typecheck`, `write`, `check` | kept, extended | 5.2.2, 9.1.3, 9.1.4 |
| `brokers/specimen/observe` | kept path; delegates to `report-layer-broker` | 8.3.1, 9.3.2 |
| `transformers/syntax-shape`, `container-shape`, `syntax-instances` | `piece-shape`, `piece-instances` | 2.1.1, 2.1.2, 2.2.1, 9.6.x |
| `transformers/fill-variants`, `offered-provenances` | `plainest-tree`, `piece-placements`, `value-axis-variants`, `structure-axis-variants`, `iterative-shapes`, `composition-tree`, `piece-plan` | phase 4, 9.6.x |
| `transformers/fill-tree-render`, `specimen-assemble` | `piece-tree-render`, `specimen-files` | phase 5, 9.6.x |
| `transformers/specimen-predict`, `arm-reached`, `specimen-verdict` | the phase 6 engine | phase 6, 9.6.x |
| `transformers/specimen-outcome-projection` | `specimen-report-projection` | 8.2.1, 9.6.x |
| `transformers/specimen-test-source`, `specimen-test-title`, `specimen-expectation-comment` | `specimen-test-file`, `specimen-header` | 8.2.2, 8.1.2, 9.6.x |
| `transformers/manifest-entry`, `fill-tree-*`, `specimen-folder-name` | `specimen-entry`, `specimen-path` | 9.1.1, 4.1.2, 9.6.x |
| `guards/has-all-literal-node` | deleted: it reads the old fill tree, and the new planner never writes an operation whose inputs are all literals | 9.6.7 |
| `contracts/{container-slot,loaded-container,loaded-syntax,syntax-instance,fill-tree,specimen-plan,manifest-entry,provenance,rendered-fill,specimen-outcome,generation-result}` | `piece-slot`, `loaded-piece`, `piece-tree`, `piece-plan`, `specimen-entry`, `source-kind`, `specimen-report`, `build-result` | phase 1, 9.1.6, 9.7.x |
| `statics/matrix`, `statics/provenance` | `layered-matrix`, `axis` | 1.1.6, 1.1.2, 9.7.x |
| kept unchanged | `collect-nodes`, `declaration-export-name` (extended), `parse-snippet-*`, `refused-report`, `synthesize-node`, `type-info`, `type-list-statics` (extended), `errors/declaration` | |

The old and new pipelines live side by side until the switch-over (row 9.4), so every row before it keeps the
committed smoke repo current and ward green.

### Today gaps

`today-statics.ts` (task 1.1.5) holds one row per gap. A row's `match` is a list of alternatives. The row matches
when any alternative holds. An alternative holds when every key in it holds. Task 6.2.6 reads these keys:

| Key | Holds when |
|---|---|
| `pieces` | any listed piece appears in the plan: the entry tree, a sibling or a helper |
| `piecePositions` | a node of that piece sits in that position |
| `slotFills` | `[host, slot]`: a node of the host has that slot filled. `[host, slot, child]`: filled by that child piece |
| `axisValues` | the plan's axis equals one of the pairs |
| `paramTypes` | the entry has a parameter of one of these kinds, read from the generator's own parse of `entry.ts`: `unknown`, `enum`, `literal-union`, `callable`, `optional-property` |
| `leafReads` | a predicted leaf reads a variable of one of these write classes: `compound-write` (written by a compound or logical assignment), `loop-write` (written in a loop body, a `const` declared fresh on each pass included), `shared-state` (a field or variable that a function or method writes and a later call reads: a module-level `let`, a class field, or a variable a returned closure captures; a write in a constructor or a setter does not count, because no later call depends on it) |
| `causes` | a predicted route holds one of these cause classes (task 1.1.3) |
| `lintRules` | a predicted lint has one of these rules |
| `buildErrors` | `true`: the prediction holds a build error |
| `buildErrorReasons` | a predicted build error has one of these reasons |
| `gaps` | `true`: the prediction holds a gap |
| `siblingFiles` | `true`: the plan writes a sibling file |
| `twoParamLeaves` | `true`: one comparison's two operands are both entry parameters |
| `stubValues` | `true`: the prediction's `stubValues` list is not empty |

| Today id | What Assayer does today | Match (alternatives separated by "or") | Closed by | Evidence |
|---|---|---|---|---|
| `value-position-logical` | Only a ternary is a value-position branch | `piecePositions: [and,value],[or,value],[nullish,value]` | 11 | cards `and/as-value`, `object/in/object` |
| `edge-values` | One value per arm; `0`, `NaN`, a negative number, `''`, `undefined`, `null`, an unset variable and missing `?.` levels are never their own cases; array sizes cross every other input | `causes: zero, nan, negative, empty-string, undefined, null, unset, missing-level, rule-named` | 12 | `representative-value-statics.ts:13` "number: 7,"; `cause-arrange-transformer.ts:429` |
| `optional-property-presence` | `'x' in obj` reads as an unrecognized predicate, and an optional property is always left out | `pieces: in-check` or `causes: present-undefined` | 12 | `predicate-contract.ts:46-66` has no `in` kind; `fill-value-transformer.ts:80` |
| `gap-param-name` | A gap names its entry, not the parameter Assayer cannot build | `gaps: true` | 12 | `entry-gap-contract.ts:28-31` holds `name` and `reason` only |
| `default-param-branch` | A default is not a branch | `slotFills: [parameter,default]` | 13 | card `default-param/alone` |
| `default-param-ternary-passed` | A parameter whose default is a ternary is never passed | `slotFills: [parameter,default,ternary]` | 13 | card `ternary/in/default-param` |
| `destructure-default-branch` | A destructuring default is not a branch | `slotFills: [object-destructure,default],[array-destructure,default]` | 13 | cards `array/destructure-default`, `deep/destructure-default-3` |
| `loop-dark-spot` | Every loop is a dark spot | `pieces: for, for-of, for-in, while, do-while` | 14 | `significant-syntax-kinds-statics.ts` |
| `compound-assign-untracked` | Assayer stops following a variable after a compound or logical assignment, and `??=`, `\|\|=`, `&&=` are not branches | `pieces: nullish-assign, or-assign, and-assign` or `leafReads: compound-write` | 15 | pieces table rows `??=` and `+=` |
| `loop-written-variable` | A variable written inside a loop is not followed | `leafReads: loop-write` | 15 | cards `state/loop-counter`, `state/loop-sum`, `loop/while-break`, `const/in/for-of-body`, `const/in/for-of-body/if-then` ("Assayer does not follow a variable written inside a loop") |
| `call-sequence` | No case makes several calls in a row | `leafReads: shared-state` | 15 | cards `state/*` |
| `two-param-comparison` | A comparison of two parameters, such as `count > limit`, reads as an unrecognized predicate, so its branch is undriven | `twoParamLeaves: true` | 15 | `read-condition-layer-transformer.ts` reads it as `unrecognized` |
| `try-dark-spot` | `try` is a dark spot | `pieces: try` | 16 | card `try/alone` |
| `await-throw-point` | An `await` is not a point that can throw | `pieces: await` | 16 | pieces table row `await` |
| `promise-callback-arms` | A `.then` or `.catch` callback is undriven | `pieces: then-callback, catch-callback` | 17 | `follow-calls-transformer.ts:73` "const ITERATION_METHODS" |
| `promise-executor-exits` | `resolve` and `reject` are not exits | `pieces: new-promise` | 17 | card `promise/alone` |
| `optional-chain-nested` | Only a single-level `a?.b` is split | `pieces: optional-chain-nested, optional-call, optional-index` | 18 | pieces table row `a?.b?.c` |
| `enum-case-unread` | A case comparing with an enum member reads as unread-comparison | `paramTypes: enum` | 19 | card `type/enum` |
| `switch-shape` | Each case is its own then and else branch, fall-through labels stay apart, and no-match is no arm | `pieces: switch, switch-no-default, switch-fallthrough` | 19 | `desugar-switch-layer-transformer.ts:12` |
| `never-read-lint` | No lint for an unread parameter, local or export | `lintRules: never-read` | 20 | cards `consume/*`, `shape/.../three-args-one-unused` |
| `edge-merge-lint` | No edge-value merge lint | `lintRules: edge-merge-*` (all six) | 21 | `lint-entry-contract.ts:27` |
| `env-in-function` | An environment read in a function is undriven | `axisValues: [source,env-call]` | 22 | `analyze-file-broker.ts:105` "envDrivable: fn.entry.access.kind === 'module'," |
| `template-literal-env-chain` | A template literal ends the env chain | `pieces: template-literal` and `axisValues: [source,env-load],[source,env-call]` | 22 | pieces table row template literal |
| `barrel-follow` | A callee behind a barrel is not followed at run time | `axisValues: [file-boundary,barrel]` | 23 | `resolve-sibling-callee-broker.ts:53` "return { walked: fileWalkBroker({ source, relPath, absPath: fileName }), relPath, source };": it walks the file the specifier resolves to (the barrel `index.ts`) and returns it, and never follows the barrel's re-export to `is-big.ts` |
| `p1-reason-token` | A build error carries a message, not a reason token | `buildErrors: true` | 23 | `compile-resolve-graph-broker.ts:295` |
| `unresolved-import-admits` | An unresolvable import still leaves an undriven admission and cases beside its build error | `buildErrorReasons: cannot-resolve-specifier, dynamic-or-computed-specifier, no-usable-types` | 23 | `undriven-branch-transformer.ts:125` |
| `known-value-consumption-point` | A dead arm is reported where it sits, with no trace; a contradicting stub is reported on the stub file | `lintRules: unreachable-exit` or `buildErrorReasons: contradicting-stub` | 24 | `unreachable-lint-transformer.ts:71` "startLine: unreachable.line,"; `stub-contradictions-transformer.ts:111` |
| `known-value-cross-file` | A known value is followed only inside one file | `siblingFiles: true` and `lintRules: unreachable-exit` | 24 | card `known/env-two-files` |
| `guard-narrows-unknown` | An `unknown` parameter is a gap even when a guard narrows it | `pieces: type-guard-call, typeof-check` and `paramTypes: unknown` | 25 | `is-type-fillable-guard.ts:168-171` |
| `derived-stub-values` | The stub index holds only declared object types, and its demand values are not one ordinary value per arm: an inline parameter type has no stub, an environment stub holds guessed values, and no stub says "left out" or "unset" | `stubValues: true` | 26 | `gather-type-reads-transformer.ts` groups only declared types; `compile-stub-graph-broker.ts:86` "values: envGuessedValuesTransformer({ literals: group.literals })," |

Phase 10's triage adds rows for anything else the first full run finds.

### Card today ids

The phase that turns each card from `it.failing` to `it`, with the today ids its cards carry, read from the match rules
above. A card turns when the last of its ids closes. Task group 7.2 holds each card's own `today` list; this table is
computed from those lists. Every close task lists exactly its own group below. `known/env-two-files` carries
`edge-values` (its `STRICT` routes hold an unset variable and `''`). The `for…of` body cards carry
`loop-written-variable`: their `if` reads a `const` declared fresh on each pass, a variable written in a loop body.

| Turns at | Today ids the cards carry | Cards |
|---|---|---|
| never failing | none | `if/alone`, `ternary/alone`, `ternary/in/ternary-then/ternary-then`, `callback/returned-closure` (4) |
| 12 | `edge-values`, `gap-param-name`, `value-position-logical` | `and/as-condition`, `and/as-exit`, `ternary/as-value`, `and/as-value`, `ternary/exit/function-return`, `ternary/exit/concise-body`, `ternary/exit/getter-return`, `ternary/exit/async-return`, `ternary/exit/throw`, `ternary/exit/yield`, `ternary/exit/inside-if`, `nullish/alone`, `eq/alone`, `nullish/in/if-condition/gt`, `ternary/in/if-then`, `ternary/in/ternary-else/ternary-else`, `ternary/in/ternary-then`, `ternary/in/ternary-condition`, `ternary/sequence`, `const/in/arrow-body`, `const/in/class-method`, `const/in/if-then`, `const/in/object-method/if-then`, `const/holds/ternary`, `const/holds/arrow`, `const/holds/object`, `shape/if-if/nested/two-args`, `shape/if-if/sequence/two-args`, `shape/if-if/sequence/one-arg-overlap`, `shape/if-if/sequence/one-arg-exclusive`, `shape/if-if-if/sequence/three-args`, `shape/if-if-if/nested/three-args`, `route/direct`, `route/const`, `route/let`, `route/ternary-binding`, `route/same-file-call`, `callback/map`, `object/property-and-method`, `object/in/object`, `array/element-ternary`, `array/element-function`, `class/constructor-to-method`, `nullable/undefined-vs-null`, `nullable/optional-param-fallback`, `reach/array-index`, `reach/class-getter`, `reach/class-setter`, `deep/literal-object-3`, `deep/literal-array-object-method`, `return/literal-union-consumed`, `return/promise`, `return/void-side-effect`, `return/throw`, `retype/as-from-unknown`, `retype/non-null`, `retype/typeof`, `boundary/sibling`, `consume/passed-to-call`, `companion/callback/no-harness`, `companion/callback/with-harness`, `known/no-known-value` (62) |
| 13 | `default-param-branch`, `default-param-ternary-passed`, `destructure-default-branch`, `edge-values` | `default-param/alone`, `ternary/in/default-param`, `array/destructure-default`, `nullable/default-and-null` (4) |
| 14 | `edge-values`, `loop-dark-spot` | `const/in/for-of-head`, `loop/for-of`, `loop/return-inside` (3) |
| 15 | `call-sequence`, `compound-assign-untracked`, `edge-values`, `loop-dark-spot`, `loop-written-variable`, `two-param-comparison` | `state/loop-counter`, `state/call-sequence`, `state/loop-sum`, `nullish-assign/alone`, `const/in/for-of-body`, `const/in/for-of-body/if-then`, `shape/if/two-args-one-check`, `loop/while-break`, `state/module-let`, `state/this-field` (10) |
| 16 | `edge-values`, `try-dark-spot` | `try/alone` (1) |
| 17 | `edge-values`, `promise-callback-arms`, `promise-executor-exits` | `promise/alone`, `callback/then`, `callback/then-catch-finally` (3) |
| 19 | `edge-values`, `enum-case-unread`, `switch-shape` | `switch/alone`, `switch/no-default`, `switch/fallthrough`, `const/in/switch-case`, `type/enum`, `retype/as-const` (6) |
| 20 | `edge-values`, `never-read-lint` | `shape/if-if/sequence/three-args-one-unused`, `consume/never-read`, `consume/dead-export` (3) |
| 21 | `edge-merge-lint`, `edge-values` | `optional-param/alone`, `edge/truthiness`, `edge/or-default`, `edge/loose-equality`, `edge/mixed-plus` (5) |
| 24 | `known-value-consumption-point` | `known/call-site-literal` (1) |
| 25 | `edge-values`, `guard-narrows-unknown` | `retype/guard` (1) |
| 26 | `derived-stub-values`, `destructure-default-branch`, `edge-merge-lint`, `edge-values`, `known-value-consumption-point`, `known-value-cross-file`, `loop-dark-spot`, `optional-chain-nested`, `optional-property-presence`, `p1-reason-token`, `switch-shape` | `const/in/module`, `route/destructure`, `type/discriminated-union`, `nullable/optional-property-in`, `edge/typeof-object`, `reach/object-property`, `reach/optional-property`, `reach/nested-property`, `reach/array-of-objects`, `deep/object-3`, `deep/optional-chain-3`, `deep/array-of-objects-2`, `deep/destructure-default-3`, `known/env-two-files`, `known/stub-correction` (15) |

The 118 cards split 4 + 62 + 4 + 3 + 10 + 1 + 3 + 6 + 3 + 5 + 1 + 1 + 15. Phases 11, 18, 22 and 23 turn no card on
their own: their ids sit on cards that carry a later id, or on systematic specimens only. Each card's own `today`
list is the one task group 7.2 writes; a card's ids each name the phase that closes them in "Today gaps".

### What a card check compares

Phase 7 declares every DESIGN.md card as a composition card (a hand-declared tree of pieces at the card's folder)
and transcribes each card's expected reports by hand into a test harness. The card check (task 7.3.1) runs `--show`
for every card and asserts, per card:

- the card's code and the rendered files print to the same text through the TypeScript printer, so formatting never
  decides; a file that is not TypeScript (a stub correction's JSON) is compared byte for byte;
- the predicted report, normalized to branch ordinals, equals the card's expectation: branches with their file, lints
  with their rule, severity, file, line and trace, undriven admissions by file, and the stub values Assayer derives
  (DESIGN.md decision "Do generated tests compare derived stub values?") at the paths task 1.4.1 defines;
- the today ids equal the card's own `today` list filtered to the ids `todayStatics` still holds. A close task removes
  its ids from `todayStatics`, so the filter keeps the card check green through every close.

A card that disagrees is fixed in the generator, never in the card (row 7.4). A card that looks wrong goes to the
user as an open question, and its folder goes on the exclusion list `test/harnesses/card-check-exclusions.harness.ts`
with reason `disputed` and the question id. The check skips every listed folder, so ward stays green while the user
decides. The list starts empty. Row 7.3 lands green the same way:
task 7.3.1 lists every failing card with reason `generator-fix`, and each 7.4 task removes the cards it fixes. Task
7.5.1 checks that no `generator-fix` entry is left. Phase 27 removes each `disputed` entry once the user has answered
its question.

A card may hold a branch-free `snippet` for code no piece describes (`new Counter(count)`), a `helper` (a named
function built from pieces, a type alias or an enum), a `rename` of a piece's identifiers, `siblings` (other files of
the card, each a tree), and a `stubCorrection` (card `known/stub-correction`). A snippet that holds a branch is
refused, so every branch a card shows is a piece the generator predicts.

### The core phase template

Phase 10's triage may add core work. Write it the way phases 11 to 26 are written:

1. Row 1: shared contract changes (a new `BranchNode.kind`, a new lint rule). Name every reader: on 2026-10-11 no
   non-test file switches on `BranchNode['kind']`; two rebuild a branch field by field
   (`compose-cross-file-predicates-broker.ts:134` and `compose-predicates-transformer.ts:91`, each the line of
   `return branchNodeContract.parse({`). Tasks 13.1.1, 14.1.1, 15.1.1 and 16.1.1 cite the same two lines.
2. Middle rows: the handler (`handle-<x>-layer-transformer.ts` plus one route in `dispatch-node`) or the transformer
   change, one file and its test per task. A handler lands in a row before its dispatch route, so the tree stays
   green.
3. A specimen row: the hand-written specimen under `manual-smoke-repo/` with its registry line, written by reading
   the file (`packages/core/CLAUDE.md` section 6). Only one task per row edits the registry.
4. A fan-out row after any change that moves existing specimens, with its own definition file
   (`<row id>-fan-out.md`, in the shape of `11.6-fan-out.md`): the operator runs `npm run test:syntax`, lists every
   failing specimen test, writes one task file per group of up to 3 files, and dispatches them. No core task waits for
   a green `test:syntax` before that row.
5. A row never holds a task that depends on another task of the same row. A specimen that needs several source files,
   a test and a registry line lands over consecutive rows: the helper files with their registry lines first, then the
   entry file with its test and its line (tasks 20.7.1 and 20.8.1, 23.3.2 and 23.4.1, 24.8.1 and 24.9.1).
6. Last row: the "close today gaps" task. It removes the ids from `today-statics.ts`, regenerates, runs each
   affected top folder, then `--check`. Then the operator runs the whole generated suite, one top folder at a time.

## Open questions for the user

None. DESIGN.md's decisions table answers every question this plan raised. A card the phase 7 check finds wrong is
added here as a new question, with an id, when it happens.

### Answered questions

The user answered these in DESIGN.md's decisions table. The plan follows each answer.

| # | Question | Answer (DESIGN.md decision) | Tasks that apply it |
|---|---|---|---|
| Q1 | Which two npm packages the file-boundary values `package` and `unresolvable-no-types` import. | The user's answer: two hand-written workspace packages in the smoke repo, named for what they show: `smoke-repo/packages/project-with-types` (ships `index.d.ts`) and `smoke-repo/packages/project-without-types` (ships no types). Both are in the generation cache key. | 4.1.3, 4.3.3, 5.2.2, 8b.2.2, 9.1.5, 9.1.7, 9.1.8, 9.4.1 |
| Q2 | Whether a generated test compares a lint's severity. | "Lint severity": each rule's default config; the smoke repo uses the default config, so the severity is compared. | 1.1.4, 1.4.1, 8.2.1, 21.12.3 |
| Q3 | The arm names of an exit `?.`. | "`?.` arms": the reported arms stay `then` and `else`; `present` and `absent` are internal names only. | 1.1.4, 3.1.8, 18.3.2 |
| Q4 | Whether lockdown-kit gets its own lease tool value. | "Leases on the load balancer": use the existing `'ward'` value. | 8b.1.2, 8b.2.1 |
| Q5 | Whether a generated test compares the stub values Assayer derives. | "Do generated tests compare derived stub values?": yes, the values, not only the paths. | 1.4.1, 6.4.1, 7.1.1, 7.2.1 to 7.2.9, 7.3.1, 8.2.1, 8.3.1, phase 26 |
| Q6 | Where a type known value is reported. | "Where a type known value is reported": at the parameter that declares the type. | 6.1.6, 24.2.4, 24.2.6, 24.3.2 |
| Q7 | Which values partner an edge-valued input. | "Which value the other inputs take in an edge-value case": the first ordinary value that lets the edge-valued input be read, then-arm value first. Counted over the cards, 50 list a comparison's then value first and 15 its else value first, so the order is then-first. Under it `optional-param/alone` already holds (`label ''` pairs with `count 3`); the review's proposed `count 2` did not match the rule. The cards that broke it were fixed in DESIGN.md: `shape/if-if/sequence/two-args`, `shape/if-if/sequence/three-args-one-unused`, `shape/if-if-if/sequence/three-args` and `nullable/optional-param-fallback`. | 6.1.1, 6.2.1, 6.2.3, 12.3.3 |
| Q9 | Where the generator writes a stub correction. | "Where a generated stub correction lives": at the root of the analysed repo, `smoke-repo/assayer/stubs/objects/<definitionRelPath>/<TypeName>.json`; the card's long path is right. The generator owns that folder like `src/`. | 1.1.7, 5.4.1, 6.1.6, 6.2.4, 7.1.1, 7.2.9, 8.3.1, 8b.1.3, 9.1.3, 9.1.4 |
| Q8 | The fewest-runs count of the call-sequence cards. | DESIGN.md says 1 for `state/call-sequence`, `state/module-let` and `state/this-field`: the two-call case takes both arms. | 6.1.2, 6.4.1, 7.2.1, 7.2.8 |

## Coverage matrix

### DESIGN.md sections

| DESIGN.md section | Tasks |
|---|---|
| Intro (source of truth; predict from declarations, never from Assayer) | WORKER-BRIEF rule 13, 6.4.1, README "How the prediction engine works" |
| Decisions so far | see "Decision rows" |
| The pieces (tags, slots, positions, arms by position) | 1.1.1, 1.2.1, 1.2.2, 1.3.5, 2.1.1, 2.2.1, 2.6.4 (the async function and generator function rows), phase 3; every table row under "Pieces table rows" |
| How the matrix is built, step 1 (every slot, levels, objects and arrays to 3) | 1.1.6, 4.3.1 |
| step 2 (four positions) | 1.1.1, 1.2.2, 4.3.1, 5.2.1 |
| step 3 (vary one thing, plainest choice) | 4.2.1, 4.3.2, 4.3.3 |
| step 4 (cross only declared axes; the sum, not the product) | 2.2.1, 4.3.2, 4.3.3, 4.5.1 |
| step 5 (plainest reader for a non-branching piece) | 4.1.1, 4.2.1 |
| step 6 (every channel; companion files are an axis) | 1.4.1, 4.3.3, 6.2.4, 6.2.5, 6.4.1, 8.2.1 |
| step 7 (objects and arrays hold expressions only) | 3.1.17, 4.3.1 |
| step 8 (Today lines; the specimen is the regression test) | 1.1.5, 6.2.6, 8.1.2, 8.2.2, 9.1.2, every core phase's last task |
| step 9 (records per arm; the parent combines) | 1.4.3, 6.2.2, 6.3.1, 6.2.3; core 14, 15 |
| How a parent finds its states (steps 1 to 6, and its three cards) | 6.2.2, 6.3.1, 6.2.3; core 14.3.2, 15.3.2, 15.3.3, 15.4.1, 15.4.3, 15.5.1, 15.5.2; step 6 (opaque write stays undriven) 4.3.3, 6.2.4; named states are out (decision row) |
| Which axes each piece crosses | 1.1.2, 2.2.1, 4.3.2, 4.3.3, 4.3.4; see "Axes" |
| Position: condition, exit or value (and "A ternary in every exit slot") | 3.1.6, 3.1.8, 4.3.1, 6.2.2; core 11 |
| Each piece alone | 4.2.1, 4.3.1; core 12, 13, 15, 16, 17, 19 |
| One piece inside another | 4.3.1, 4.3.4 |
| Ternaries inside ternaries | 4.3.1, 4.3.4 |
| One piece everywhere it fits: `const` | 3.1.1, 4.2.1, 4.3.1 |
| Iteratives | 4.3.4; core 15.4.2, 15.6.1, 15.7.3, 15.9.1 (two parameters in one check), 20 (the unused argument) |
| Routes from a parameter to a branch | 4.3.2 |
| Loops and callbacks | 3.1.18 to 3.1.24, 6.2.2, 6.3.1; core 12.6.3 (a mapped callback's element values), 14 (14.1.2, 14.2.4 and 14.4.1: a loop item, its property and a nested loop), 15, 17 |
| Objects, arrays and classes hold the other layers | 3.1.17, 3.1.27; core 11 |
| Type variation (table and two cards) | 2.1.2, 4.3.2; core 19, 24 |
| Optional and nullable values (two tables, four cards) | 2.6.1 and 3.1.6 (`ternary`, `&&`, `||` cross the nullability axis), 3.1.4, 3.1.14, 4.3.2, 6.1.1, 6.2.1; core 12 (12.1.5, 12.1.6, 12.2.5, 12.2.6 and 12.3.4 name `null` and `undefined` members), 13 (13.4.1 drops a route the default contradicts) |
| Edge values (two tables, five cards, the five listing steps) | 1.1.3, 3.1.7, 6.1.1, 6.1.5, 6.2.1, 6.2.3, 6.2.5; core 12, 21 |
| Wrapped types and reaching in (table, seven cards) | 3.1.10, 3.1.11, 3.1.28 (a setter write and a method-call read), 4.3.2 (every wrapper value, `nested-object-3` included); core 12 (12.1.7, 12.6.2, 12.7.1: an index read), 14.4.1, 26 |
| Objects and arrays nested 3 levels deep | 1.1.2 and 4.3.2 (wrapper value `nested-object-3`), 1.1.6, 3.1.17, 4.3.1; core 13, 14 (14.4.1: a nested loop), 18, 26 |
| Return types and exits | 1.1.1 (the `throw` arm), 3.1.26, 4.3.3, 5.2.1 |
| Retyping | 3.1.12 to 3.1.14, 6.1.1; core 25 |
| File boundary (table and card) | 4.3.3, 5.2.2, 5.4.1, 6.2.4, 6.3.1, 8.3.1, 9.1.5; core 23 |
| Consumption (three cards) | 4.3.2, 6.2.5; core 20 |
| Shared mutable state (two cards) | 4.3.3, 6.3.1; core 15 |
| Where the value comes from (table) | 4.3.2 (the source axis on every leaf, one leaf at a time), 5.1.2, 6.1.1, 6.2.4; core 22 (22.1.5 reads a template's text), 24; `random` left out (1.1.2) |
| Known values from afar (four cards) | 1.4.1 (trace), 6.1.6, 6.2.5, 6.2.4, 7.2.9; core 24 |
| Every report channel (table and companion pair) | 1.4.1 (every channel carries its file; lints carry severity; stub values), 4.3.3, 5.4.1, 6.2.4, 6.2.5, 8.2.1, 8.3.1 |

### Decision rows

| Decision | Tasks |
|---|---|
| `&&`, `\|\|`, `??` in a value position are branches; each cause of an arm is its own case | 1.1.4, 3.1.6, 2.6.2, 6.2.2, 6.2.1; core 11, 12.3.2 |
| Is a default a branch? (given, defaulted; only `undefined` triggers it) | 1.1.4, 3.1.4, 3.1.5, 6.2.2; core 13 |
| Should Assayer pass a parameter that has a default? | 6.1.1, 6.2.1; core 13.3.2, 13.4.1 |
| Promise callbacks | 3.1.19, 3.1.20, 6.2.2, 6.3.1; core 17 |
| Loops and shared mutable state | 3.1.3, 4.3.3, 1.4.3, 6.2.2, 6.3.1; core 14, 15 |
| "Declared but never read" | 6.2.5; core 20 |
| Edge values (fixed lists; the merge family with per-rule toggles) | 1.1.3, 6.1.1, 6.1.5, 6.2.5; core 12, 21 |
| A cast from `unknown` stays a gap | 3.1.12, 6.1.1, 6.2.4 |
| `x!` changes nothing Assayer builds | 3.1.12, 6.1.1 |
| `noUncheckedIndexedAccess` is a compiler-options value | 1.1.2, 3.1.10, 4.3.3, 5.2.2, 5.4.1 |
| Two arguments feeding one check | 1.1.1, 4.3.4; core 15.4.2, 15.6.1, 15.7.3, 15.9.1 |
| Which values are separate cases in every route | README "The cause rule", 1.1.3, 6.1.1, 6.2.1, 6.2.3; core 12 |
| When is an arm unreachable? | README "Known values and the consumption point", 6.1.6, 6.2.5, 6.4.1; core 24 |
| How the generator predicts routes (run the specimen; derive inputs from arm conditions; refuse an unreached arm) | 6.1.1, 6.2.1, 6.3.1, 6.4.1, 9.2.1 |
| Derived stub values | 6.2.1, 6.4.1, 7.2.1 to 7.2.9 (stub values), 7.3.1 |
| Does "never read" apply to exports? | 6.2.5, 9.1.5; core 20.1.2, 20.2.6, 20.4.3 to 20.4.6, 20.5.3, 20.7.1, 20.8.1 |
| `do…while` arms | 1.1.4, 3.1.23, 6.2.2; core 14.2.1 |
| Where a generated stub correction lives | 1.1.7, 5.4.1, 8.3.1, 8b.1.3, 9.1.3, 9.1.4 |
| Matrix size (no cap; totals per axis and per layer) | 1.1.6, 1.3.3, 4.4.2, 4.4.3, 4.9.1, 9.8.1 |
| Running at scale (load balancer; content-keyed cache outside git) | phase 8b (8b.2.2 fingerprint, 8b.7.1 root `CLAUDE.md`), 9.2.1, 9.3.1, 9.4.1 (the cache-hit proof) |
| Speed of the generated run (not optimised) | README "Running at scale" (no batching, no result cache) |
| Which channel reports a dead arm | 6.1.6, 6.2.4, 6.2.5; core 24 |
| Does a type count as a known value? | 6.1.6; core 24.2.3, 24.2.4, 24.3.1, 24.3.2 |
| Which value the other inputs take in an edge-value case | 6.1.1, 6.2.1, 6.2.3; core 12.3.3 |
| Do generated tests compare derived stub values? | 1.4.1, 6.4.1, 7.1.1, 7.2.1 to 7.2.9, 7.3.1, 8.2.1, 8.3.1; core phase 26 |
| `try` arms (finishes, catches; each throw point a cause of catches) | 1.1.4, 3.1.25; core 16.1.1, 16.3.3, 16.3.4 |
| Where a type known value is reported | 6.1.6; core 24.2.4, 24.2.6 |
| Lint severity | 1.1.4, 1.4.1, 7.2.1 to 7.2.9, 8.2.1; core 21.12.3 |
| Leases on the load balancer | 8b.1.2, 8b.2.1 |
| `?.` arms | 1.1.4, 3.1.8, 18.3.2 |
| Named states (outside this design) | 6.2.4 (the admission is predicted, its wording is not compared) |
| Containers the pieces table does not name (dropped) | 2.6.3 to 2.6.5 (`async-function` and `generator-function` kept: the pieces table names them), 9.7.5 |
| An import that cannot resolve (P1, no undriven) | 4.3.3, 6.2.4, 9.1.5; core 23.1.2, 23.2.1, 23.3.1, 23.4.2, 23.5.1, 23.5.2 |
| A guard narrowing `unknown` | 3.1.14, 6.1.1; core 25 |
| Core gaps found while planning (in scope) | phases 12, 14, 15, 17, 23, 24, 25, 26 |

### Axes

| Axis | Pieces that declare it | Tasks |
|---|---|---|
| Position | ternary, `&&`, `\|\|`, `??`, `?.` | 1.1.2, 2.6.1, 2.6.2, 3.1.6, 3.1.8, 4.3.1; core 11 |
| Level | every piece | 1.1.2, 1.1.6, 4.1.2, 4.3.1, 4.4.1 |
| Iteratives | every branching piece | 1.1.2, every phase 2 and 3 declaration with arms, 4.3.4 |
| Routes | bindings | 1.1.2, 3.1.1, 3.1.5, 4.3.2 |
| Type | `if`, ternary, `!`, `===`, `>`, `??`, `switch`, type checks, `in`, `.length` | 1.1.2, 2.1.2, 2.6.1, 2.6.2, 3.1.11, 3.1.13, 3.1.14, 3.1.21, 4.3.2; core 19, 24 |
| Nullability | parameters, `??`, `?.`, defaults, truthiness (`if`, ternary, `&&`, `\|\|`, `!`), equality checks | 1.1.2, 2.6.1, 2.6.2, 3.1.4, 3.1.6, 3.1.8, 4.3.2, 6.1.1; core 12 |
| Wrapper | reach-in pieces, destructuring, parameters | 1.1.2 (`nested-object-3`), 3.1.4, 3.1.5, 3.1.10, 3.1.11, 3.1.28, 4.3.2 |
| Array size | loops, callbacks, `[0]`, `.length`, `.at()` | 1.1.2, 1.1.3, 3.1.10, 3.1.11, 3.1.18, 3.1.22, 6.2.1; core 12.4.1, 14 |
| Exit kind | containers with a body | 1.1.1, 1.1.2, 2.6.3 to 2.6.5, 4.3.3 |
| File boundary (calls and type references; all three unresolvable reasons) | `call`, `property-read` | 1.1.2, 3.1.10, 3.1.15, 4.3.3, 5.2.2, 5.4.1, 6.3.1, 9.1.5; core 23 |
| Consumption | `const`, `let`, `call` | 1.1.2, 3.1.1, 3.1.15, 4.3.2, 6.2.5; core 20 |
| Compiler options | `index-read`, `in-check`, `object-destructure`, `property-read` | 1.1.2, 3.1.5, 3.1.10, 3.1.14, 4.3.3, 5.2.2, 5.4.1; core 12.5.4 |
| Source | every leaf | 1.1.2, 4.3.2 (one entry per leaf and source value), 5.1.2, 6.1.1; core 22, 24 |
| Companion files | specimens with a gap or an object parameter | 1.1.2, 4.3.3, 5.4.1, 6.1.1, 6.2.4, 8.3.1 |
| Shared state (pieces table; values module `let`, `this` field, closure capture, opaque write) | `+=`, class | 1.1.2, 3.1.3, 3.1.27, 4.3.3, 6.3.1; core 15 |

### Pieces table rows

| Row | Declared in | Other tasks |
|---|---|---|
| `const`, `let` | 3.1.1 | 4.1.1 (reader), 4.3.2 (routes, consumption) |
| reassignment | 3.1.1 | 4.3.2 |
| `??=`, `\|\|=`, `&&=` | 3.1.2 | 6.2.2; core 15 |
| `+=` and other compound assignments | 3.1.3 | 4.3.3; core 15 |
| parameter | 3.1.4 | 6.1.1; core 13 |
| optional `?` and rest `...` parameters | 3.1.4 | 6.1.1 |
| destructuring, object or array | 3.1.5 | core 13 |
| comparison `===`, `>`, `!` | 2.6.1, 2.6.2 | 4.3.2; core 15.7.3 (`>` on two parameters) |
| ternary | 2.6.1 | 4.3.1 |
| `&&`, `\|\|` | 3.1.6 | core 11 |
| `??` | 2.6.2 | core 11, 12 |
| `?.`, one level | 3.1.8 | 6.2.2 |
| `a?.b?.c`, `fn?.()`, `a?.[0]` | 3.1.8, 3.1.9 | core 18 |
| reach-in `.x`, `[0]`, a getter read (and `.length`, `.at()`, a setter write and a method-call read from the wrapper table) | 3.1.10, 3.1.11, 3.1.28 | 4.3.2; core 12.1.7, 12.6.2 |
| retyping `as`, `!`, `as const`, `satisfies` | 3.1.12, 3.1.13 | 6.1.1 |
| type check `typeof`, `instanceof`, `in`, a guard | 3.1.13, 3.1.14 | core 12, 25 |
| template literal | 3.1.15 | core 22 |
| a call | 3.1.15 | 4.3.3 |
| recursion | 3.1.15 | 6.1.3 (the pass and depth caps) |
| object literal | 2.6.5, 3.1.17 | 4.3.1 |
| array literal | 3.1.17 | 4.3.1 |
| arrow function, function expression | 2.6.3 | 4.2.1 |
| array callback | 3.1.18 | 6.2.2 |
| promise callback | 3.1.19, 3.1.20 | core 17 |
| returned closure (body: statement) | 3.1.20 | 6.2.4, 6.3.1; core 15.4.3, 15.6.2, 15.7.1 |
| function declaration | 2.6.3 | 4.3.1 |
| async function, including an async arrow | 2.6.4 | 4.3.3 (exit kind `promise`) |
| generator function `function*` | 2.6.4 | 4.3.1 |
| class | 2.6.4, 3.1.27 | 4.3.3 |
| `if` | 2.6.1 | 4.1.1 |
| `switch` | 3.1.21 | 4.3.2; core 19 |
| `for`, `for…of`, `for…in`, `while` | 3.1.22, 3.1.23 | core 14 |
| `do…while` | 3.1.23 | core 14 |
| `break`, `continue`, labelled break, `return` in a loop | 3.1.23, 3.1.24 | core 14.2.2 |
| `try…catch…finally` | 3.1.25 | core 16 (16.3.4: fewest runs 3 for `try/alone`) |
| `new Promise(...)` | 3.1.25 | core 17 |
| `await` | 3.1.25 | core 16 |
| `return`, `throw` | 3.1.26 | 5.2.1 |
| module | 2.6.5, 3.1.27 | 4.3.2 (env at module load) |

### DESIGN.md tables

| Table | Tasks |
|---|---|
| Decisions so far | "Decision rows" above |
| The pieces | "Pieces table rows" above |
| Which axes each piece crosses | "Axes" above |
| Type variation | 2.1.2, 3.1.11 (`x.length`), 3.1.21, 4.3.2 (literal unions never cross `>`; switch labels `case 7`, `case 'xyz'`; never a boolean switch), 6.1.1; core 19, 24 (`if (mode)`, `!mode`, `if (mode.length)`) |
| Optional and nullable values: shapes | 3.1.4, 4.3.2, 6.1.1 (left out, `undefined`, `null`, missing and present as `undefined`); core 12.5.2, 12.5.3 |
| Optional and nullable values: each piece with `undefined` and `null` | 6.1.1, 6.2.1; core 12.3.1, 12.3.2, 13.4.1 |
| Edge values: the type list | 1.1.3, 6.1.1; core 12.1.1 |
| Edge-value merge lint rules | 3.1.7, 6.1.5, 6.2.5; core 21 |
| Wrapped types | 3.1.10, 3.1.11, 4.3.2 |
| Where the value comes from | 4.3.2, 5.1.2, 6.1.1, 6.2.4; core 22, 24 |
| File boundary | 4.3.3, 6.2.4, 6.3.1, 9.1.5; core 23 |
| Every report channel | 1.4.1, 6.2.4, 6.2.5, 8.2.1 |

### Cards

All 118 cards are declared and transcribed in tasks 7.2.1 to 7.2.9 and checked by 7.3.1. The core phase that turns each one to a
passing `it` is in [Card today ids](#card-today-ids).

| DESIGN.md section (cards) | Composition and expectation |
|---|---|
| How a parent finds its states (3), Position (11) | 7.2.1 |
| Each piece alone (12), One piece inside another (3) | 7.2.2 |
| Ternaries inside ternaries (5), `const` everywhere (12) | 7.2.3 |
| Iteratives (8), Routes (6) | 7.2.4 |
| Loops and callbacks (7), Objects, arrays and classes (6), Type variation (2) | 7.2.5 |
| Optional and nullable values (4), Edge values (5), Wrapped types (7) | 7.2.6 |
| Nested 3 levels deep (6), Return types and exits (4), Retyping (5) | 7.2.7 |
| File boundary (1), Consumption (3), Shared mutable state (2), Every report channel (2) | 7.2.8 |
| Known values from afar (4) | 7.2.9 |

### DESIGN.md Today lines

| Today line (where) | Today id | Closing phase |
|---|---|---|
| `??=`, `+=`: "Today Assayer stops following the variable after one" (pieces table; `nullish-assign/alone`) | `compound-assign-untracked` | 15 |
| `a?.b?.c`: "Today Assayer splits only a single-level `a?.b`" | `optional-chain-nested` | 18 |
| template literal: "Today it ends Assayer's env chain" | `template-literal-env-chain` | 22 |
| loops and `try`: "A dark spot today" | `loop-dark-spot`, `try-dark-spot` | 14, 16 |
| "Assayer does not follow a variable written inside a loop" | `loop-written-variable` | 15 |
| "Assayer stops following calls after the compound assignment" (`state/*`) | `call-sequence`, `compound-assign-untracked` | 15 |
| "Assayer reads only a ternary as a value-position branch" | `value-position-logical` | 11 |
| "Assayer does not report a default as a branch" | `default-param-branch` | 13 |
| "Assayer never passes a parameter whose default is a ternary" | `default-param-ternary-passed` | 13 |
| "Assayer does not name the destructuring default as a branch" | `destructure-default-branch` | 13 |
| "Assayer has no lint for an unused parameter" / "unused local" / "an export that nothing reads" | `never-read-lint` | 20 |
| "A case that compares with an enum member reads as unread-comparison" | `enum-case-unread` | 19 |
| env read in a function: "Today Assayer does not drive this read" | `env-in-function` | 22 |
| `retype/guard`: "Assayer cannot build a value of type unknown" | `guard-narrows-unknown` | 25 |
| `shape/if/two-args-one-check`: no Today line; `count > limit` with both operands as parameters (DESIGN.md decision "Two arguments feeding one check") | `two-param-comparison` | 15 |
| `known/call-site-literal`: "reports a dead arm on the function that holds it ... no path trace" | `known-value-consumption-point` | 24 |
| `known/env-two-files`: "follows a known value only within one file" | `known-value-cross-file` | 24 |
| `known/stub-correction`: "does not name the consumption point or give a path trace" | `known-value-consumption-point` | 24 |

### Report channels

| Channel | Predicted by | Observed by | Core work |
|---|---|---|---|
| driven routes, every route, fewest runs | 6.1.1, 6.2.1, 6.2.2, 6.3.1, 6.2.3, 6.1.2 | 8.2.1 | 11 to 19, 21.12 to 21.14, 22, 25 |
| stub values Assayer derives | 6.4.1 | 8.2.1, 8.3.1 | 26 |
| unreachable-exit lint, at the consumption point with a trace | 6.1.6, 6.2.5 | 8.2.1 | 24 |
| declared but never read | 6.2.5 | 8.2.1 | 20 |
| edge-value merge lint (with its severity) | 6.1.5, 6.2.5 | 8.2.1 | 21 |
| undriven | 6.2.4 | 8.2.1 | 23.3.1, 23.4.2, 23.5.1, 23.5.2 (an unresolvable import admits nothing; the seam is the per-file analysis) |
| dark spot | 6.2.4 (always empty) | 8.2.1 | 14, 16 remove the loop and `try` ones |
| gap | 6.2.1, 6.2.4 | 8.2.1 | 12.1.4, 12.2.4 (the parameter name) |
| P1 build error | 6.2.4 | 8.2.1, 8.3.1 | 23, 24.1.2, 24.2.7 |

### Not mapped to a task

- Named states: DESIGN.md decision "Named states" puts them outside this design. Branches whose state Assayer cannot
  model stay undriven (shared-state value `opaque-write`, task 4.3.3).
- The `random` source: DESIGN.md's source table says "Not generated yet". The source axis leaves it out (1.1.2).
- SHIMS.md, STUBS.md, CALLABLES.md and BACKLOG.md work that DESIGN.md does not change (shim doc pages, the shim
  engine check, the call matrix) stays in those documents. Shims keep loading and are never placed (2.2.1).
