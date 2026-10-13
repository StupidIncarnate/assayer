# <Run name>: run plan

<!-- The planner fills in every section and deletes these comments. Keep this file short: it is what the operator
re-reads all run. Detail lives in the slice documents. Overwrite the Handoff section each session; never append to it. -->

## Handoff

<!-- The operator writes this at a session switch. Seven lines at most. -->

| Item | State |
|---|---|
| Merged | <slice ids> |
| Running or ready | <slice ids, with their state> |
| Next | <the next slices to start> |
| Waiting on the user | <questions or steps, or "nothing"> |

## Goal

<!-- What exists when this run is done, in two to four sentences. Name the entry points a person can run. -->

## Out of scope

<!-- What this run does not do, one line each. -->

## Root worktree

| Item | Value |
|---|---|
| Path | `worktrees/<run name>` |
| Root branch | `<run name>` |
| Agent number | <set by the user> |

## Waves

<!-- A slice joins the earliest wave in which every slice it depends on has merged. Slices that change one file are
in different waves. Contracts, statics and gateways that more than one slice uses come first. -->

| Wave | Slices | Why they wait |
|---|---|---|
| 1 | <ids> | nothing: shared contracts, statics and gateways |
| 2 | <ids> | they import wave 1's exports |

## Slices

<!-- Shape: "worker" (the lead writes every file) or "manager" (the lead launches workers). Parts: the planner's
suggested part count for a manager slice, which the operator uses to size the lead's worker allowance. Model:
"default", or "opus" for an unusually hard slice. Fixed-port slot: "yes" only for the one e2e slice. -->

| Id | Title | Entry point | Shape | Parts | Model | Fixed-port slot | Depends on | Slice document |
|---|---|---|---|---|---|---|---|---|
| <id> | <title> | <CLI flag, route, tool or screen, or "shared"> | worker / manager | <n, or "-"> | default / opus | no / yes | <ids, or "none"> | [slices/<id>.md](slices/<id>.md) |

## Tracker

<!-- The operator updates this. [ ] not started. [▶] its slice lead is working. [R] its reviewer is working. [F] its
slice lead is doing fix tasks or a repair. [M] on the ready-to-merge list, or merging. [✓] merged into the root branch.
[B] blocked on a question for the user. -->

```text
<Run name> · [IN PROGRESS]
  Wave 1   <id> [ ]  <id> [ ]
  Wave 2   <id> [ ]  <id> [ ]
  Run-end check [ ]
```

## Ready to merge

<!-- The operator keeps this list, in order. One merge agent at a time takes the first entry. -->

None yet.

## Coverage

<!-- Every item of the request or its design document, mapped to the slice that delivers it. An item with no slice
is a gap; write it under "Questions for the user" if it is not yours to drop. -->

| Requirement | Slice |
|---|---|
| <requirement> | <id> |

## Decisions

<!-- One row per decision made during planning or the run, with its evidence and date. State the decision as it
stands; never narrate what changed. -->

| Date | Decision | Evidence |
|---|---|---|

## Run rules

<!-- Rules for this run only. A run rule adds to the role documents and never contradicts them. Where the two
disagree, the role document wins. -->

None.

## Questions for the user

<!-- Only choices that are the user's alone. Name the slices each question blocks. Every other slice still runs. -->

None.

## Post-run list

<!-- Defects found during the run that do not block it. Worked after the run, or handed to the user. -->

None.
