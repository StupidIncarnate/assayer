# Working with sub agents

How to run a large piece of work across several sub agents at once. Written down because it
worked, and because most of the value came from a handful of rules that are easy to forget.

Two passes were run this way. One closed a list of known bugs. One hunted a single bug shape
across the whole codebase. Together they fixed about twenty real bugs.

About a quarter of the written-down bug reports turned out to be wrong in some way. That is the
main reason for the rules below.

## Splitting the work

**Give each agent a file set nobody else has.** This is the thing that makes running five at
once safe. Two agents editing one file will clobber each other, and neither will know.

**Watch for collisions that are not file collisions.** Two agents can have completely separate
files and still ruin each other's work. One changes what the analyzer outputs while another is
writing example files that record that output. The second one either breaks or, worse, records
the moving value as correct. When that risk exists, run them one after the other and say why.

**When work does not split cleanly, do not force it.** Some jobs converge on the same few
files. Sequence those. Running three agents into one file to hit a parallelism target produces
three conflicting edits and a lot of wasted time.

**Bundle entries that are secretly one job.** Several times, two or three separate defect
entries turned out to be one fix. Splitting them would have put two agents in one file arguing
about the same lines. Read the entries before assigning, not just the titles.

## What every agent must be told

**Reproduce before fixing.** This is the highest-value rule by a wide margin. Roughly one in
four written-down reports was wrong: a reproduction case that did not reproduce, two of five
listed symptoms that did not occur, code confidently described as unreachable that was
reachable through an ordinary call. An agent told to fix a report will fix it whether or not it
is real. An agent told to reproduce it first will tell you the report is wrong.

**Prove every new test by breaking the thing it tests.** Revert the fix, confirm the test goes
red, restore it, confirm green. Report both. A test that stays green when you break what it
names was never testing it. This caught five tests in this repo that were asserting a bug as
the expected answer.

**Demand evidence for "unreachable" and "already fine".** These are the two claims agents make
when they want to stop. Rule: an agent may skip something only if it is genuinely unreachable
and it says so with a file, a line, and the probe it ran — or if it is already covered. "Low
value", "defensive", and "symmetric to another case" are not acceptable. One agent nearly
deleted live code it had declared dead; the thing that saved it was being made to replace the
code with a crash and run the full suite.

**Tell them to trust the code over you.** Prompts written by an orchestrator contain mistakes.
Mine did, several times: a field I said existed did not, a rule I called a contract invariant
was enforced somewhere else entirely. Two agents checked and refused, which was the right
outcome. Make it explicit: if the brief contradicts the code, the code wins, and say so in the
report.

**Give them the gates, and tell them which ones do not overlap.** In this repo `npm run ward`,
`npm run test:syntax` and `npm run typecheck:syntax` cover different things and none contains
the others. An agent that runs one and reports green has not checked its work.

**Never let them run the full test suite while others are working.** With several agents on one
working tree, a full run measures the tree's state at that instant, not the agent's work. Three
agents each burned twenty-plus minutes chasing failures in files they had never opened. Scoped
runs while working. One authoritative full run by the orchestrator at the end, on a quiet tree.

**No Jest run in this repo builds anything.** Unit tests read TypeScript source. Core's
integration tests drive the wrapped Jest runner in-process, and that runner loads core's source
too. A broken sibling package therefore fails only the tests that import it.

The CLI integration tests are the exception. They spawn the built CLI binary, so they test
whatever compiled output is on disk. Only one process may build at a time, and a dispatched
agent never builds. Tell an agent that those tests need a current build, and that you will run
the build and those tests yourself at the end.

The failure mode to watch for is an agent reporting its work complete on the strength of a
clean typecheck. That happened here. The package was fine to compile and had four genuinely
failing tests, which only appeared in the orchestrator's final run.

**Warn them what other agents' breakage looks like.** One agent's half-finished edit can
break the tests of every package that imports it. Tell them: a failure naming a file you do not own is almost
certainly someone else mid-edit. Wait, retry, and report it — never fix it.

**Reference documents by content, not by number.** Entries renumber as agents delete them. Say
"the entry about a harness not being able to supply a callback's value", not "C1". Numbers
handed an agent the wrong defect more than once.

## For a sweep rather than a fix

When hunting one bug shape rather than closing a list, the method is different.

**Make them build a grid and fill every cell.** Rows are the things that should behave alike —
each arm of a union, each of several routes doing the same job, each level a rule should hold
at. Columns are the behaviours. Every cell gets one of: has it, correctly does not need it, or
defect.

This finds things reading cannot. The bugs of this shape are invisible in the file they live
in, because that file is internally consistent and reads fine. They only appear next to a
sibling.

**A blank cell is a guess, not a finding.** Every gap has to be probed against real code before
it counts.

**Say explicitly not to invent symmetry.** Some differences are deliberate and correct. Making
everything uniform is worse than the duplication. Give them the known-correct differences up
front so they do not "fix" them.

**Give them calibration examples.** Two or three confirmed instances, concrete, with what broke.
Agents given examples found real bugs; the shape is too abstract to hunt from a description.

## Reading what comes back

**The best outcome is an agent correcting the premise, not an agent fixing something.** When a
report says "this did not reproduce, here is what actually happens", that is worth more than a
fix, because everything downstream of a wrong premise is wasted.

**Ask for the observation, not the conclusion.** "I probed it and it is fine" is not evidence.
"Before: one case arranging `[7]`. After: two cases, `[6]` and `[5]`" is. Require before-and-
after values for anything claimed fixed.

**Watch for rationalised skips.** An agent that wants to stop will produce a reason. The tells
are "low value", "defensive", "symmetric to a case that exists", and "probably fine". Send it
back. Twice this turned a shrug into a real bug.

**Do not pass a heuristic on without its exceptions.** A heuristic that worked for one agent was
handed to others and turned out to have false positives. A hint passed from one agent to another
was actively wrong, and would have shipped a test that passes while testing nothing. If an agent
gives you a rule of thumb, ask what it does not cover before repeating it.

**Cross-check claims between agents.** Two agents independently concluded the same code was
dead. Both were wrong. Agreement between agents is not evidence — they share the same blind
spots, especially when one has read the other's conclusion.

**Pass findings to agents already running.** When one agent finds something that bears on
another's job, tell that agent while it is still working. Several fixes got better this way,
and one agent was stopped from re-deriving a conclusion another had already reached.

**Expect them to inherit your errors.** Anything stated as fact in a brief gets built on. Check
the reports for conclusions that trace back to something you asserted rather than something they
observed.
