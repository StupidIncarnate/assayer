# <Run name>: run gate

<!-- The planner writes this, and the run-end checker runs it after every slice has merged. It proves the run's
behaviors work together, end to end, the way a person would use them. Slice-level steps live in the review files;
this file covers what crosses slices. Delete these comments once filled in. -->

## Purpose

<!-- What this gate proves, in two to four sentences: which entry points, which data, which joins between slices. -->

## Verdict rule

The real surface is the verdict: the screen, the CLI output, the tool's answer. Logs, APIs and test routes are
diagnostics that explain a result; they never pass a step on their own. A screen that breaks during a step (a blank
panel, a frozen spinner, missing rows, a console error) fails the step even when the API answer is right.

## Preconditions

- Every slice has merged, and the full ward and the repo's extra verify commands are green.
- <What must be built, and how: compiled output a step runs.>
- Nothing else edits the root worktree while the gate runs.

## Setup

<!-- Variables, ports, the exact command to start the system, how to seed data, and how to stop everything. -->

| Item | Value |
|---|---|
| Start | `<command>` |
| Stop | `<command>` |
| Evidence folder | `tmp/<run name>-gate/` |

## The joins this gate covers

<!-- One row per place two slices meet. Every row is exercised by at least one step below. -->

| Join | Slices | Covered by |
|---|---|---|
| <what meets what> | <ids> | <step ids> |

## Part A: the happy path

| Step | Action | Must be seen | Also read | Fails if |
|---|---|---|---|---|
| A1 | <exactly what to do> | <exactly what must appear> | <log, console, network> | <what would mean it is broken> |

## Part B: glue stress tests

<!-- Steps that push on the joins: restarts, two clients at once, bad input at a boundary, a missing record. -->

| Step | Join | Action | Must be seen | Glue bug it catches |
|---|---|---|---|---|
| B1 | <join> | <exactly what to do> | <exactly what must appear> | <the defect this would expose> |

## Part C: hygiene

<!-- Leftovers to check: no stray files, processes or ports; nothing written outside where it belongs. -->

| Step | Check | Must be seen |
|---|---|---|
| C1 | <what to list or read> | <what must and must not be there> |

## Report

<!-- The run-end checker fills this in. -->

### Deviations from this gate

<!-- Anything the checker had to do differently from the steps above, and why. "None" if nothing. -->

### Results

| Step | Result | Evidence |
|---|---|---|

## User step

<!-- Only what truly needs the user (a real login, a paid account). Kept as short as possible. Nothing above waits
on it. "None" if nothing. -->

None.
