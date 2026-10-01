# Assayer — Open defects

Everything in this file is a bug that exists right now, confirmed by running the code.
Each entry says what goes wrong, how to reproduce it, where the cause is, and what a fix
involves. Delete an entry when it is fixed. Do not mark it "resolved" and leave it here.

Things Assayer cannot do yet live in `plan/followups.md` instead. The difference is
whether Assayer lies. If it refuses a job and says so clearly, that is a missing feature.
If it gives a wrong answer, or claims it tested something it did not, that is a defect and
it belongs here.

Check any fix with all three commands. They cover different things and none is a superset
of the others:

- `npm run ward`
- `npm run test:syntax`
- `npm run typecheck:syntax`

Before you write down what the code does, run it. Use `npx tsx` with absolute import paths
for a single function. Use the built CLI at `packages/cli/dist/bin/assayer.js` for anything
end to end.

---

## A harness cannot supply a value for a callback's parameter

Some background first. When Assayer cannot invent an input for a function, it stops and
tells you to write a small file that supplies one. That file is called a harness.

This works now when the input belongs to a *named helper function* that Assayer folded into
its caller. Assayer reports the error against the outer function but names the helper, and
you can write a harness naming that helper. Both the error message and the checker read the
same list of helper names, so they agree.

It does not work when the input belongs to a *callback* — an inline function passed to
something like `items.map(n => ...)`.

Why it is not a quick fix. A callback's missing input is the array element itself. To supply
it, Assayer would have to put your value inside the array it builds for the outer function's
array parameter. The type that describes an arranged value has no option for "this slot is
filled from a harness." It only holds plain values. Until that option exists, allowing
harnesses to name callbacks would let the checker accept a key that nothing can actually
use — the same mismatch this whole area exists to prevent, just in the other direction.

The cross-file version has a second problem on top: the callback lives in a different file,
so closing it also needs that file's own harness pulled in.

Files: `packages/shared/src/contracts/arrange-value/arrange-value-contract.ts`,
`funnel-cases-transformer.ts`, `through-callback-cases-transformer.ts`,
`compose-cross-file-map-broker.ts`.

---

## Missing test fixtures

`smoke-repo/` holds small example files. Each one is a fixture that proves a piece of
behaviour still works. If a behaviour has no example there, it can break without any test
failing. These are the behaviours with no example.

**One thing to know first: a build error can never have an example here.** When a harness
has a bad key, Assayer fails the whole build. So one broken example file would stop every
other example from running, and would break the desktop and app tests too. That is correct
behaviour for a build error. It just means build errors get proven a different way, by an
integration test that compiles throwaway files in a temp directory. See
`compile-harness-graph-broker.integration.test.ts` for the pattern.

### No example of a missing input on a helper or callback

The existing examples under `sad-path/input-gap/` only cover an input missing on the
exported function itself.

The helper-function version can be written now. It needs two files that are byte-identical
except one has a harness beside it:

- `sad-path/input-gap/funnelled-param` — no harness, proves the error message names the
  helper
- `happy-path/harness/funnelled-param` — with a harness, proves real test cases come out

The callback version cannot be written yet. No harness can supply a callback's input (see
the first entry), so the example would only prove the thing is still broken.

### No example where one function has both a missing input and an unreachable branch

When a function has both, Assayer reports only the missing input and drops the branch
report. The reasoning is that you cannot run the function at all until you supply the input,
so telling you about the branch is noise.

No example file has both at once. Checked: no entry in `specimen-registry.ts` is tagged with
both `undriven` and `gap:input`. So this rule is only covered by a hand-written unit test,
never by a real parse.

### No example of a `.filter` / `.some` / `.every` / `.find` callback

Every array example passes a callback that either transforms its element (`map`) or has an
`if` inside it. None has a callback whose whole body is a comparison, like `n => n > 5`.

That shape is what `.filter`, `.some`, `.every` and `.find` look like in real code, and
Assayer handles it differently: it produces two test cases, one where the comparison is true
and one where it is false. That behaviour is only covered by unit tests right now.

To close it, add `happy-path/array/<name>/<name>.ts` containing something like
`items.filter(n => n > 5)`, plus its line in `specimen-registry.ts`. Follow the recipe in
section 6 of `packages/core/CLAUDE.md`. Coordinate with anyone else editing `smoke-repo/` at
the time, since the directory and the registry are shared.

### No example pairs a folded-in helper with a harness, or with a bare comparison

Four files build the request they hand to the case engine, all through one shared place, so an
option added to the engine reaches all four. Two of those options are not covered by any
example file.

To see it, remove each option from the shared place and watch which test goes red:

- Remove the harness option, and `npm run test:syntax` stays GREEN. No example pairs a helper
  folded into its caller with a harness that supplies that helper's own input. Both existing
  harness examples supply an input to a top-level function instead.
- Remove the return-comparison option, and `test:syntax` stays green too. No example pairs a
  folded-in helper with a function whose whole body is a comparison.

Both options are real and both are load-bearing. They are only held in place by unit tests in
`packages/core`. So a change that drops either one passes the example catalogue, which is the
suite meant to catch exactly that.

To close it, add an example whose exported function calls a private helper, where the helper
has an input Assayer cannot build, and put a harness beside it naming the helper. Then add a
second where the helper's whole body is a comparison like `n > 5`.

### `access:unreachable` can never have an example, and that is fine

`access:through-caller` now has one: `happy-path/composition/through-caller`.

`access:unreachable` cannot get one, no matter how the file is written. Assayer only assigns
that value to a function the module does not export, and it already drops unexported
functions before that value could ever be attached to anything. So the value only exists
briefly during parsing, and it is tested there, in
`read-entry-access-layer-transformer.test.ts`. Changing that would mean changing what the field
is allowed to hold, not writing an example file.

---

## Running the CLI against a scratch directory

`ts-jest` looks for `node_modules` by walking up from the directory you point it at. A
directory in `/tmp` has nothing above it, so the run dies with "Module ts-jest in the
transform option was not found" before it reaches any of your code.

A scratch directory created *inside this repo* works fine, because the walk up reaches the
monorepo root.

So a one-off end-to-end check is easy. Just put the directory in the right place. Permanent
test coverage should still go against `smoke-repo/`, which is a real npm workspace and does
not need cleaning up. See `run-console.e2e.ts` and `run-unit-broker.integration.test.ts`.

Separately: the catch-all error handler in `packages/cli/bin/assayer.ts` has no test. It
needs a genuine crash thrown through the real compiled pipeline, which is hard to arrange
on purpose.

---

## `??` throws away a valid `null`, and nothing stops it

In Assayer, `null` is a real value that a test case can use, not a stand-in for "missing."
The contract says so directly: "`null` is a value in the domain because a nullish operand
HAS one." When Assayer works out what value makes `config.mode ?? fallback` take its second
branch, the answer is `null`.

So writing `someValue ?? fallback` in Assayer's own code is a trap. If `someValue` is a
legitimate `null`, `??` replaces it with the fallback. The generated test case then stops
testing the branch it claims to test, and still passes.

**This has happened six times, in six different places:**

1. Three `??` chains in `objectArrangeTransformer`
2. `literal ?? rep` in `typeToRangeTransformer`
3. A filter that rejected `null` as a value for a `string` parameter
4. That filter's replacement, same mistake
5. `isTypeFillableGuard` refusing `null` for every scalar type
6. `typeToRangeTransformer` again, returning "no possible value" whenever the type had no
   simple example value

Each was fixed by checking `=== undefined` explicitly, or by allowing `null` outright.

Number six is the reason this needs a lint rule rather than care. It was in a file already
fixed once for exactly this, and nothing failed — it was found by going through every case
by hand.

**Only two of those six were written with `??`.** This was checked by reading each fix in
git, not by reading the list above:

- Entries 1 and 2 used `??`. That is five expressions in total, once the three chains are
  counted separately.
- Entry 5 was `value === undefined || typeof value === 'string'`, fixed by adding
  `|| value === null`. There is no `??` in it.
- Entry 6 was `rep === undefined ? unrealizable : …`, fixed by dropping the ternary. No `??`
  either.
- Entries 3 and 4 could not be found as separate commits. `is-type-fillable-guard.ts` has
  exactly one change in its whole history, which is entry 5. The most likely reading is that
  3, 4 and 5 are the same guard described three times, and that 3 and 4 were iterations
  nobody committed. That is a guess, and it is written here as one.

This matters because it changes what the lint rule below can do for you.

TypeScript cannot catch this. `??` is legal on every type, and there is no compiler setting
for "warn me when the left side is a null I meant to keep." TypeScript makes it worse, in
fact: `a ?? b` strips null out of the result type, so it reports the outcome as safer than it
is.

**A lint rule now catches the `??` shape.** It lives in `eslint-rules/` at the repo root, is
registered under `@assayer` in `eslint.config.js`, and runs as an error in `npm run ward`. Its
own tests run with `npm run test:eslint-rules`, which is a separate command from ward.

The rule asks the type checker what the left operand is. It fires when that type, or one of
its own union members, is a `RepresentativeValue` or an `ArrangeValue`.

It must not match on the checker's rendered type text, and this is the trap to avoid if you
change it. That text prints a type's whole nested shape, so the name appears wherever it
occurs at any depth. A text match fires on an array of objects that merely contains one of
these types three levels down, which is correct code.

It is a rule for people working on Assayer. It is not part of what Assayer ships. Nobody using
Assayer installs it, enables it, or ever sees it.

**The rule is not a fix for this defect. It covers one operator.** Of the six recorded
instances, it catches the two that were written with `??`. It cannot catch entry 5, which was
a `typeof` filter, or entry 6, which was a ternary. Both discarded a legitimate `null` just as
effectively. A seventh instance written as `!x`, `x || fallback`, or `x == null` would pass the
rule silently.

So treat the rule as a tripwire on the most common spelling, not as a guarantee.

**The fix that would kill the whole family: stop using JavaScript's `null` for the domain
value.** Use something like `{ kind: 'null' }` instead. Then `??` cannot fire on it, and
neither can `!x`, `== null`, or a `typeof` test. Every one of the six becomes impossible to
write rather than merely detectable in one of its forms.

It is invasive. Every producer, every consumer, and the cache file format all change. But the
evidence above is that this keeps happening in shapes a per-operator rule does not see, and
each new shape needs a new rule that only exists after the bug does.

There is a second reason to want it, unrelated to `??`. `null` currently has no `TypeDescriptor`
kind of its own. That entry is in `plan/followups.md`.

## Belongs to `@dungeonmaster/testing`, not here

A mock set up for one call can answer a different call, and the error you get does not say so.

Every proxy in this repo now describes its calls by their arguments. When a call matches
nothing that was described, the mock throws, and the message names both what the code asked
for and what was set up. That message is the most useful part of the design.

You do not always get it. When the unmatched call is a file read, and the test composes
several proxies over the same underlying read, the throw does not surface. What surfaces
instead is a `JSON.parse` failing on an empty string, further down, in whichever broker tried
to use the content. Confirmed by printing the raw value at the point of failure: it is `""`.

The protection itself is real. Corrupting a matcher does make the right tests go red. It is
the diagnostic that is missing, and that is the difference between a five-minute fix and an
afternoon, because the error names a file the test never mentions.

The fix belongs in `@dungeonmaster/testing`, in the sibling repo, not here.

---

## Not a defect, but worth knowing

Assayer cannot compile this repo. Running `assayer status` against
`repoRoot=/home/brutus-home/projects/assayer` (1781 files) runs out of memory and dies with
`FATAL ERROR: Ineffective mark-compacts near heap limit`, exit code 134, after about 150
seconds and 3.3GB. It dies during parsing, before any cross-file work starts.

That is why some features get tested with small copied files rather than by pointing Assayer
at this repo.
