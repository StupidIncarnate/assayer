# Review of slice <id>: <title>

<!-- The reviewer fills in every section and deletes these comments. It edits no other file. -->

| Verdict | Blocking fixes | After fixes | Manual steps | Questions |
|---|---|---|---|---|
| PASS / FIXES NEEDED | <n> | <n> | <n> | <n> |

## Scope

- Covered: <the commits and files read, in full>
- Not covered: <what was not read, and why; "nothing" if all was read>

## Traces

<!-- Values and paths followed by hand: an expected test value traced back to its cause, or the entry point
followed down to the new code. One row each. -->

| What was traced | Where | Verdict |
|---|---|---|

## Fix tasks

<!-- Root causes first. Each task can be done without asking anything. -->

### BLOCKING

#### B1. <what is wrong, in one sentence>

- Files: `<path>`, `<path>`
- Evidence: `<path>:<line>`: "<the line, quoted>". <What is wrong with it.>
- Change: <the exact change>

### AFTER

<!-- Defects that do not block the merge. The operator copies them to the run plan's post-run list. -->

## Manual verification

### Audit of the slice document's steps and the slice lead's results

<!-- One row per step in the slice document. -->

| Step | Covers its behavior, with an exact value? | Slice lead ran it? | Result matches "must be seen"? | Finding |
|---|---|---|---|---|
| V1 | yes / no | yes / no / could not | yes / no | <fix task id, or "none"> |

### Missing behaviors

<!-- Behaviors the slice adds that no step covers. Each gets a step in the table below. "None" if none. -->

### Glue steps

<!-- Always attempted. One step per join traced from the entry point down, or to a changed export's other callers.
The merge agent runs these steps, and the slice document's, on the slice merged with the latest root branch. A step
that needs the app running starts a siegelense instance. If none are needed, write "No glue steps added: <reason>". Each step names
what to start, exactly what to do, exactly what must be seen, what to read for a hidden failure, and what fails it. A
screen that breaks fails the step even when the API answer is right. -->

**Setup:** <what to start, with the exact command, and how to stop it>

| Step | Action | Must be seen | Also read | Fails if |
|---|---|---|---|---|
| M1 | <the command, request, tool call, or clicks with test ids> | <the exact output, body, text or row> | <server log, browser console, network> | <what would mean the glue is broken> |

## Questions for the operator

<!-- The operator reads this section and nothing else. One question each, with options and a recommendation. The
operator writes its decision under each. -->

### Q1. <the question>

- Options: <a>, <b>
- Recommended: <a>, because <evidence>
- Decision: <the operator writes this>
