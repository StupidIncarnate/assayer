# Specimen generator: callables and the call matrix

This file defines the set of callables the generator writes to test calls. A callable is anything a caller
can call: a function, a method, a builtin like `Array.prototype.at`. The generator does not test each
callable one at a time. It writes one made-up callable per signature shape, and crosses those shapes with
the cases at the call site. A real callable, such as a builtin shim, then reuses the rows that match its
shape.

`CONTAINERS.md` defines the slots a call sits in. `SHIMS.md` defines the shims that stand in for builtins.

## Why calls get their own matrix

A call moves values between two scopes. The caller's values go in as arguments. The callee's result comes
back out. Assayer has to follow both directions, and the stress tests found three call bugs:

| Cause | What Assayer gets wrong | Which part of the call |
|---|---|---|
| A | The callee's `return` is missing from the caller's path | the result coming back |
| B | The values `.at` needs for its index are lost through a passthrough function | the demand going back up to the caller's parameter |
| G | An undriven branch inside a private helper is reported nowhere | a branch inside the callee |

Every shim depends on the same mechanism, because `xs.at(i)` is a call. So calls have to be proven before
shims can be.

## A callable's shape

The shape is read from the callable's signature and body. It has three parts.

### Arity: how many arguments it takes

0, 1, 2 or 3. Optional, default and rest parameters come later.

### Exits: what each way out returns

| Exit | Example, with `a`, `b`, `c` as numbers | What the result's value depends on |
|---|---|---|
| Nothing | `console.log(a);`, typed `void` | nothing. The call is only an effect |
| `undefined` | `return undefined;`, typed `T \| undefined` | nothing |
| Constant | `return 1;` | nothing. The value is known |
| One argument, unchanged | `return a;` | that argument |
| An expression of one argument | `return a + 1;` | that argument |
| An expression of two arguments | `return a + b;` | both arguments |
| An expression of three arguments | `return a + b * c;` | all three |
| A pinned builtin | `return Math.random();` | nothing a test sets directly. Assayer pins it inside its range |
| An outside input | `return Number(process.argv[2]);` | nothing a test can set |

The argument and return types come from the type list. They decide which expressions are legal. With two
`string` arguments, the two-argument expression is `a + b` as concatenation. With a `number[]` and a
`number`, it is `a[b]`.

### Deciders: what each branch is decided by

| Decider | Example |
|---|---|
| No branch | none |
| One argument against a literal | `if (a > 5)` |
| Two arguments compared | `if (a > b)` |
| An expression of arguments | `if (a + b > c)` |

A branching callable has one exit per arm. The arms must return different exit kinds, or the branch
cannot be told apart by its result.

### Example shapes

```ts
// 1 argument, no branch, returns an expression of it
function f(a: number): number {
  return a + 1;
}

// 2 arguments, branch on the two compared, returns undefined or an expression of both
function f(a: number[], b: number): number | undefined {
  if (b >= a.length) {
    return undefined;
  }
  return a[b];
}

// 3 arguments, branch on an expression of all three, returns an argument or a constant
function f(a: number, b: number, c: number): number {
  if (a + b > c) {
    return a;
  }
  return 0;
}
```

The second example is the shape of `Array.prototype.at`, without its negative-index branch.

## The call site

A call site is where the caller calls the callable. It has three parts that vary.

### Where each argument comes from

Each argument slot is an `{{expr: T}}` slot, as in `CONTAINERS.md`. What matters for the expected cases is
the argument's provenance: where its value came from.

| Provenance | Example call | Can a test set it? |
|---|---|---|
| A parameter of the caller | `f(n)` | yes |
| A literal | `f(3)` | no. Its one value is known |
| A same-file const | `f(LIMIT)` | no. Its one value is known |
| An expression of the caller's parameters | `f(n + 1)`, `f(n, n)` | yes, by working back through the expression |
| `process.env`, at module level | `f(Number(process.env.N))` | yes |
| A captured name: the callee reads the caller's variable instead of taking an argument | `inner()`, where `inner` reads `limit` | the same as that variable |
| The result of another call | `f(g(n))` | the same as that result |
| A pinned builtin: one no input decides, whose shim declares a range | `f(Math.random())` | yes, by pinning: Assayer picks one value in each region of the range the callee's checks create |
| An outside input | `f(Number(process.argv[2]))` | no |

A pinned builtin's range can decide a check before any test runs. `Math.random()` is at least 0 and below
1, so a callee that checks `n > 5` can only take its `else` arm. That `then` arm is dead code, not undriven
code. `SHIMS.md` explains ranges and pinning.

### What the caller does with the result

| Use | Example |
|---|---|
| Returns it | `return f(n);` |
| Branches on it | `if (f(n) > 5)` |
| Passes it into another call | `g(f(n))` |
| Stores it | `const x = f(n);`, then reads `x` |
| Discards it | `f(n);`. Generated only for a callable that returns nothing. A discarded pure result is dead surface |

### Where the callee lives

| Location | Example |
|---|---|
| A private function in the same file | `function helper(...)` above the caller |
| An inner function | declared inside the caller's body |
| An exported function in a sibling file | `import { helper } from './helper';` |
| A builtin, through its shim | `xs.at(i)`. `SHIMS.md` explains how the receiver `xs` becomes the first argument |

## Predicting the outcome

The generator predicts each row from the shapes and provenances alone. It never runs Assayer to find out.
These rules extend the outcome rules in `PLAN.md`.

1. **A callee's branch is decided by its deciding arguments' provenances.**
   - Any deciding argument is an outside input: no cases, and one undriven admission.
   - Any deciding argument is settable: one case per arm. Each case sets the caller's settable values so
     the callee takes that arm.
   - Otherwise every deciding argument is known or pinned. Assayer checks which arms the known values and
     the pinned builtin's whole range can reach. One reachable arm: the branch is locked, the arm is the only
     case, and every other arm that exits gets an `unreachable-exit` lint. More than one: one case per
     reachable arm, each with the builtin pinned inside the region that reaches it.
2. **The callee's exits are part of the caller's path.** A case that goes through the callee reaches the
   callee's exit first, then the caller's. This is cause A in `ASSAYER-FINDINGS.md`.
3. **A result's provenance follows from the exit that produced it.**

   | Exit | Result's provenance |
   |---|---|
   | Nothing, `undefined`, constant | known |
   | One argument, unchanged | the same as that argument |
   | An expression of arguments | combined from those arguments' provenances |
   | A pinned builtin | pinned |
   | An outside input | an outside input |

4. **Provenances combine the same way everywhere.**

   | Inputs | Combined |
   |---|---|
   | All known | known |
   | Any outside input | an outside input |
   | Known and pinned, nothing settable | pinned |
   | Settable and known | settable, if the expression can be worked back from result to input |
   | Two settable | settable. The rule for choosing both values is still open |

5. **The caller's own branch on a result uses rule 1, with the result's provenance.**

Working back from a result to an input is what the prototype calls `inverse`. `a + 1` can be worked back.
`a % 3` can be for some results and not others. A demanded value that no input produces is dropped from
the cases.

## Chains

A chain is a call whose argument is another call's result: `f(g(n))`, or `xs.slice(1).at(0)`. Each link
is one more row of the call matrix, so a chain needs no rules of its own. Its result's provenance comes
from rule 3 applied link by link.

Chain length is the nesting depth in `CONTAINERS.md`. It needs a limit, set once.

## How big the matrix is, and where to start

The full matrix is every shape, times every provenance for each argument, times every result use, times
every callee location, times every container the caller can sit in. It is too large to generate whole on
day one.

Start from one baseline row and move one dimension at a time:

| Dimension | Baseline |
|---|---|
| Arity | 1 |
| Decider | one argument against a literal |
| Exits | the argument unchanged, and a constant |
| Argument provenance | a parameter of the caller |
| Result use | returned |
| Callee location | a private function in the same file |
| Caller's container | an exported function declaration |

Each specimen changes one dimension away from the baseline. When those pass, cross the dimensions that
interact: deciders with argument provenance, and exits with result use.

## How shims reuse the call matrix

A shim is a callable with a shape like any other. `SHIMS.md` shows the `.at` shim:

| Part | `.at`'s shape |
|---|---|
| Arity | 2: the receiver array and the index |
| Deciders | the index against a literal (`index >= 0`), and an expression of both (`k >= receiver.length`) |
| Exits | `undefined`, and an expression of both arguments (`receiver[k]`) |

Once the made-up callables with those features pass in every container and provenance, the generator
writes the shim's specimens by putting the shim in the callee's place in the same rows. The predictions
carry over unchanged, because they come only from the shape and the provenances.

Each shim row also gets an equivalence check. Assayer must report the same cases for `xs.at(i)` as for
the shim called by name as an ordinary function, `at(xs, i)`. This compares Assayer with itself across two
spellings of one call. It is a cheap extra check. It does not replace the predictions.

## Open questions

| Question | Why it matters |
|---|---|
| Does a shim declare its shape in config, or does the generator read the shape by parsing the shim? | Parsing removes a second copy of the facts. Declaring keeps a check that the parse is right |
| How are both values chosen when two settable arguments feed one decider, as in `if (a > b)`? | Rule 4 has no answer yet. It is the same open question as `n + m` in `CONTAINERS.md` |
| Which shapes count as the core set worth generating in full? | The full cross is too large. The baseline-plus-one approach is a start, not an answer |
| Is an exit that returns `undefined` different from one that returns nothing, for Assayer's analysis? | If not, the two rows can merge |
