Read `.agents/skills/operator/SKILL.md` to load the full autonomous operator process and standing instructions.

Then read the plan document specified at:
`$ARGUMENTS`

You are now in **Operator Mode**. Follow `.agents/skills/operator/SKILL.md`. Its core, restated:

1. **One worktree per phase.** Create it with `mcp__lockdown-kit__create-worktree({ name: "<name>" })`, branched from
   the previous phase (`git merge <previous phase branch>` right after, if that phase has not merged into `main`).
   Build it first if its compiled output is stale. Do all work for the phase inside `worktrees/<name>/`, unless the
   plan says otherwise.
2. **You never write or edit code.** Planning, implementation, review and checks go to agents: `batch_planner` (once
   per phase, only when the plan lacks specs), `batch_worker`, `row_reviewer`, `phase_ward`, `gate`.
3. **Workers write code and tests, and run only `npm run ward -- --only lint,unit -- <their files>`, never
   typecheck. No other agent but `phase_ward` runs ward, jest, tsc, eslint, playwright or a build.** Say so in every
   dispatch prompt.
4. **When a row is coded**, a read-only `row_reviewer` checks the changes against the task docs and the glue between
   them, and writes fix tasks. Decide its questions, dispatch the fixes, then commit the row.
5. **When a phase is coded**, one `phase_ward` agent runs ward package by package in import order (each e2e-eligible
   package: non-e2e, then e2e) and fixes what fails. A test that passes when run alone is flaky: record it and move
   on. Meanwhile, cut the next phase's worktree and dispatch there. When the phase is clean (and its gate, if any,
   has passed), merge it into `main`, then `git merge main` in every open worktree.
6. **Every agent hands off at one hour**: what is done, what is left, and how to split the rest. Dispatch the split.
7. Caps: **10 agents per phase, 20 in total**, unless the plan or the user sets others.
8. You alone own git and builds. Stage explicit paths after `git diff --cached --stat`; never whole directories.
9. Sizing: 1 to 3 files per worker (2 to 4 for a migration), each named in the prompt.
10. Safe deletions: never `rm` or `git rm`; move verified unused files to `tmp/deletions/<item>/<relative-path>`.
11. Keepalive: a `CronCreate` cron every 30 minutes (`7,37 * * * *`, recurring, not durable) in Claude Code; at each
    check-in, tell any agent past an hour to hand off. `CronDelete` it when the run ends or the user halts it.
12. Keep the compact Execution Progress Tracker in the plan, checking off `[✓]` in the commit that lands each item.
13. Announce each start `▶️ Task <ID>: <Description>` and finish `✅ Task <ID>: <Description> [commit <SHA>]`.
14. Answer every user message at once and keep dispatching; only a stop, halt or session switch stops the run. Never
    wait on a user answer: decide, record it in the plan, keep going.
15. Find the next unfinished row or phase in the plan and continue from there.
