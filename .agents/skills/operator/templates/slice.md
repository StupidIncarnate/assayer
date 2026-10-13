# Slice <id>: <title>

<!-- The planner fills in every section above "Parts" and deletes these comments. The slice lead fills in "Parts"
(as a manager), "Decisions" and "Result". Cite symbols and files; treat any line number as a hint, because earlier
slices may have moved it. This slice owns every name it creates: other documents read the file as it stands. -->

| Wave | Shape | Suggested parts | Depends on | Model | e2e slice |
|---|---|---|---|---|---|
| <n> | worker / manager | <n, or "-"> | <slice ids, or "none"> | default / opus | no / yes |

<!-- A manager slice lists its suggested parts here: each part's files, and which parts wait for which. The slice lead
turns them into briefs under "Parts". -->

## Entry point

<!-- The one real thing someone runs to see this slice work, and what they see. "Shared" for a contracts, statics
or gateways slice, with the slices that consume it. -->

## Read first

<!-- Only what this slice needs: design sections, package CLAUDE.md files, interface notes files. -->

- <path or section>

## Files

| Action | Path | Folder type | Companions |
|---|---|---|---|
| create / edit / move / delete | `<repo-relative path>` | <folder type> | `.proxy.ts`, `.stub.ts`, `.test.ts`, as the folder type requires |

## Callers outside the slice

<!-- Every caller, importer, proxy, stub and barrel entry outside "Files" that a changed export reaches, and what
happens to each: updated in this slice (then it belongs in "Files"), or unaffected, with the reason. -->

| Caller | What happens |
|---|---|

## Changes

<!-- File by file: the exports, with full signatures where another slice imports them, and what each does. Leave the
bodies to the slice lead. -->

### `<path>`

- <export and signature>: <what it does>

## Tests

<!-- What each test proves, with real input and output values. Error text word for word. Expected values are worked
out from what the code should do, never from running it. -->

- `<test file>`: <case> gives <exact result>

## Extra verify commands

<!-- Each command from the root CLAUDE.md that covers what this slice changes, exactly as it is run, or "None". The
slice lead and the merge agent run these as well as ward. Ward's commands are fixed by the roles, not listed here. -->

None.

## Manual verification

<!-- How to see the entry point work: what to start, what to run or click, exactly what must appear, what log or
console to read, and how to stop it. A step that needs the app running starts a siegelense instance, never
`npm run dev`. If the repo's siegelense cannot start the app, write the step with `npm run dev` and mark it
"merge agent: needs the fixed-port slot". These steps decide whether the slice passes: the slice lead runs them before handing back, and the
merge agent runs them again after merging the root branch in. A slice with nothing anyone can see says
"None: <the reason>", never nothing. The reviewer adds steps in the review file. -->

**Setup:** <what to start, with the exact command, and how to stop it>

| Step | Action | Must be seen | Also read | Fails if |
|---|---|---|---|---|
| V1 | <the command, request, tool call, or clicks with test ids> | <the exact output, body, text or row> | <server log, browser console> | <what would mean it is not wired or not working> |

## Interface notes this slice writes

<!-- Only if another slice consumes a shape this slice settles. Name the notes file and the slices that read it.
Otherwise "None". -->

None.

## Parts

<!-- Manager shape only. The slice lead writes one part per worker. Parts share no file. -->

## Decisions

<!-- The slice lead's, and the operator's answers to this slice's questions. -->

## Result

<!-- The slice lead writes this before replying. -->

- CHECKLIST:
- CALLERS:
- LEFT STANDING:
- DECISIONS:
- DELETIONS:
- WARD:
- MANUAL:

## Merge

<!-- The merge agent writes this: the root commit it merged, the ward run id, each manual step's result, and what the
merge broke and it fixed, or why it handed the slice back. -->
