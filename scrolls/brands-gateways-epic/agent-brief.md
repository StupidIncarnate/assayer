# Standing brief for every agent on assayer's brands and gateways epic

You were handed one item from `scrolls/brands-gateways-epic/`, and possibly a list of files in it. Do that item, or
the part of it you were named, and nothing else. `EPIC.md` beside this file is the operator's run sheet. Read its
"Concessions" table before you start, because it overrides dungeonmaster's docs.

Work from the repo root, `/home/brutus-home/projects/assayer`. Never `cd` into a package.

## What you never do

The operator owns these jobs. If you do one, you break another agent's work.

One exception: when your item is a fix inside the dungeonmaster checkout (`/home/brutus-home/projects/codex-of-consentient-craft`),
you work there the normal way. You run its ward, build the package you changed, and commit your own files there by
explicit path, on its current branch. You never run `npm link`. Rules 1, 2 and 3 below still apply to the assayer
checkout.

1. Never build: no `npm run build` and no `tsc -b`. If a step needs compiled output, stop and report "build needed"
   with the package name.
2. Never commit, branch, `git add`, `git mv`, `git stash`, `git checkout -- <file>` or `git reset`. The git index is
   shared. Never restore a file with `git show HEAD:<path> > <path>` either, because another agent's unsaved work may
   be in it.
3. Never run a bare `npm run ward`. Scope it to your files: `npm run ward -- -- <paths>`.
4. Ward's lint is safe to run on your own files: EPIC item P0-2 turned the three autofixing brand rules off.
5. Never `npm install`, `npm ci`, `npm link` or `npm rebuild`. If a dependency is missing, report it.
6. Never edit `.claude/settings.json`, `.mcp.json` or any `.env*` file.
7. Never dispatch sub-agents or forks. A fork edits the same checkout beside you and redoes your task.
8. Never edit a file outside your item's file list. Report the problem under LEFT STANDING. If you must touch an
   unlisted file to finish, stop and report it. The operator adds it to the plan first.
9. Never delete a file. Once `discover` proves nothing imports it, move it with plain `mv` to
   `tmp/deletions/<your item>/<its original repo-relative path>` and list it under DELETIONS. Temporary files your own
   script makes under `tmp/` are the one exception.
10. Never touch `smoke-repo/`, `vendored-fixture/` or `eslint-rules/`. Specimens use raw `process` and `console` on
    purpose.
11. Never add a per-file or per-line rule suppression: no `eslint-disable` and no file-scoped `off` entry. If a rule
    cannot be satisfied, report it under DECISIONS.

## Before you write code

1. Call `get-architecture` and `get-testing-patterns` once. Call `get-folder-detail` once per folder type you write
   into. If you write a gateway wrapper, read its section "Adding a Gateway npm or bin Wrapper" in `.agents/plugins/dungeonmaster/rules/AGENTS.md` too. These
   docs outrank your item file. When they disagree with it, follow the docs and report the disagreement under
   DECISIONS.
2. Read `CLAUDE.md`. Read `packages/core/CLAUDE.md` too if you touch `packages/core`.
3. Find files with `get-project-map`, `get-project-inventory` and `discover`, then `Read` them. When the discover
   index and `Read` disagree, `Read` wins.
4. Check your item's numbers and paths against the code. They were measured on 2026-09-30. When the code differs,
   the code wins; say so in your report.

## How you work

- Tests assert real values: states, content, payloads. A test that only checks "was called" does not count.
- Error text is a contract. Every P1 message (a build-blocking error that exits with code 1) keeps its exact words
  unless your item says to change them. Tests assert those words exactly.
- Never mock a gateway wrapper that has a real body with `registerMock({ fn })`. Compose its proxy instead. If the
  gateway proxy cannot stage what a caller needs, stop and report it as a gateway gap.
- Import a gateway function from its barrel (`#gateway/node/fs__promises`). Import its proxy or stub from its own
  file.
- Scan your diff before reporting for: `as never`, `as unknown as`, `calledWith([])`, `onceFor([])`, staging that
  accepts anything, raw `fs`, `path`, `os` or `process` imports, and a real `process.cwd()` or `homedir()` in a test.
- If you touch `packages/core/src`, run `npm run test:syntax` as well as ward. The specimen output must stay
  byte-identical.
- Never edit `packages/core/test/harnesses/specimen-registry.ts` to match analyzer output. Its declarations are
  written by reading the specimen.
- Write in plain language in every comment, test name and message. Describe what the code does now, never what it
  used to do.
- If you are blocked, say what blocks you and what you tried. Do not stop at the first error; look for its cause.

## Your report

End with exactly these sections, in this order:

```
CHANGED — one line per file: path, then what changed. Quote one verbatim line from each file you wrote.
WARD — the exact ward command you ran last, its run id, and its result. Add the test:syntax result if you ran it.
LEFT STANDING — every failure or problem you saw and did not fix, with path and reason. "None" if none.
DECISIONS — every place you departed from the item, and why. "None" if none.
BUILD NEEDED — the packages whose compiled output must be rebuilt before the next step. "None" if none.
DELETIONS — every file you moved to tmp/deletions/, one per line: original path, then why. "None" if none.
```
