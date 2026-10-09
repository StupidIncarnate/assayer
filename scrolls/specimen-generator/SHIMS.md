# Specimen generator: shims for builtins

A shim is a plain TypeScript function that does what one builtin does, such as `Array.prototype.at`. When
Assayer meets a call to a builtin, it analyzes the shim as if the shim were the builtin's source code in a
sibling file. This file says why shims are needed, what one looks like, the rules every shim follows, and
the doc set the generator writes for them.

`CALLABLES.md` explains how the generator tests a shim: as one more callable in the call matrix.

## Why Assayer needs shims

Assayer derives test cases from the branches in code it can read. A builtin has no code it can read:

| Source of a builtin's behavior | What it holds | Why Assayer can't use it |
|---|---|---|
| TypeScript's `lib.*.d.ts` files | Types only. `node_modules/typescript/lib/lib.es2022.array.d.ts:22` reads `at(index: number): T \| undefined;` | No body, so no branches |
| V8, the engine Node uses | C++ and Torque, V8's own internal language | Not TypeScript or JavaScript |
| SpiderMonkey and JavaScriptCore, the Firefox and Safari engines | Some builtins written in JavaScript | They call internal engine functions that ordinary code cannot |
| Polyfills such as `core-js` and `es-shims` | Real JavaScript versions of each builtin | No types, and wrapped in feature-detection and install code that Assayer would read as branches |
| The ECMAScript spec | The official algorithm, as numbered steps | Prose, not code. It is the authority each shim is written from |

So the type graph tells Assayer a builtin's signature, and nothing about what happens inside it. Today
Assayer fills that gap with values picked by hand. For `.at`, they are
`AT_INDEX_MEMBERS = [0, -1, representativeValueStatics.number]`, in
`packages/core/src/transformers/cause-arrange/cause-arrange-transformer.ts:107`. A shim replaces values
picked by hand with values derived from branches.

## What a shim looks like

The spec's steps for `Array.prototype.at` are:

1. Let `len` be the array's length.
2. Convert `index` to an integer, cutting toward zero. `NaN` becomes 0.
3. If the index is 0 or more, `k` is the index. Otherwise `k` is `len + index`.
4. If `k < 0` or `k >= len`, return `undefined`.
5. Return the element at `k`.

The shim writes those steps as plain TypeScript. Step 2 uses `%`, which is syntax, so the shim needs no
`Math.trunc` shim underneath it:

```ts
export const at = <T>(receiver: readonly T[], index: number): T | undefined => {
  const whole = index !== index ? 0 : index - (index % 1);
  const k = whole >= 0 ? whole : receiver.length + whole;

  if (k < 0 || k >= receiver.length) {
    return undefined;
  }

  return receiver[k];
};
```

The object a method is called on, the receiver, becomes the shim's first parameter. So `xs.at(i)` is
analyzed as the call `at(xs, i)`. Assayer already follows a call from one function into another, so it
reads the shim's branches the way it reads any callee's.

The shim's branches ask for four kinds of index:

- 0 or more, inside the array
- 0 or more, past the end
- negative, inside the array
- negative, too far back

When the receiver is `[10, 20, 30]`, `receiver.length` is a known 3. So the boundaries become known values
too. That is cause C in `ASSAYER-FINDINGS.md`.

## Rules every shim follows

1. **A shim uses only syntax and other shims.** Syntax here means what Assayer understands without a
   shim. The draft list is below. Without this rule, shims never bottom out.
2. **A shim is written from the spec, step by step.** Its doc page shows each spec step next to the line
   that does it. Skipping a step is how a shim goes wrong. A version of the `.at` shim that skipped step 2
   read `receiver[0.37]` for `.at(0.37)`, which is `undefined`. The real builtin returns `receiver[0]`.
3. **A shim is checked against the real builtin.** Assayer's own test suite runs each shim and the real
   builtin on many inputs, and the results must match. The prototype's `.at` shim matches
   `Array.prototype.at` on 48 inputs: 3 arrays crossed with 16 indexes, including fractions, `NaN` and both
   infinities. The official conformance tests for each builtin
   (test262) are another source of inputs. This test is what keeps a wrong shim from fooling both Assayer
   and the generator, which would otherwise read the same wrong shim. It has to exist before any shim is
   trusted.
4. **Assayer picks a shim by the declaration the type checker resolves the call to.** `at` exists on
   `Array`, `ReadonlyArray`, every typed array, and `String`. Each needs its own shim. Assayer never picks
   a shim by method name. This is rule P3 in `plan/requirements.md`: detect by the type graph, never by
   convention.
5. **A builtin with no shim is a dark spot.** The message names the builtin, for example "Assayer has no
   shim for `Array.prototype.findLast`". A dark spot is Assayer's own debt, and adding the shim closes it.
6. **Every builtin in the base library gets a shim.** The base library is what TypeScript's lib files
   declare for the repo's target, without the DOM. "The inventory" below lists them.

## The floor: syntax and internal state

Every shim is built from code Assayer understands directly, with no shim: syntax, and reads of a value's
internal state. This
list is a draft, to be checked against what Assayer handles today.

| Syntax | Example |
|---|---|
| Literals | `3`, `'a'`, `true`, `undefined`, `[1, 2]`, `{ a: 1 }` |
| A name in scope | `n` |
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Comparison | `<`, `<=`, `>`, `>=`, `===`, `!==` |
| Logic | `&&`, `\|\|`, `!`, `??` |
| Ternary | `a ? b : c` |
| `typeof` | `typeof x === 'string'` |
| Index read | `xs[i]` |
| Property read on an object the code declared | `o.p` |
| A value's internal state | an array's size and its element at a position, a string's code units, a map's entries |

`.length` is not syntax. It is a shim that reads a value's internal state. The same goes for
`Map.prototype.size` and every other property a builtin defines. Internal state is the floor that every
shim bottoms out on. It is what the spec calls a value's internal slots.

The spec defines `size` on `Map` and `Set` as a getter. It defines `length` on an array or a string as a
property each value carries. For a shim, both are a read of internal state. The difference that matters is
that an array's `length` can be assigned: `xs.length = 0` empties the array. So the array `length` shim
covers both the read and the assignment.

## The inventory

The full list of builtins comes from the type graph, not a hand-kept list. A script reads TypeScript's lib
files for one target. The prototype's copies are `tmp/specimen-generator-prototype/inventory-builtins.cjs`
and `inventory-traits.cjs`. It lists every global value, its static members, and its instances' members.

A run on 2026-10-08, against TypeScript's `lib.es2022.d.ts` with no DOM, found:

| What | Count in that run |
|---|---|
| Global values, such as `Array`, `Math`, `JSON` | 59 |
| Members of those values | about 1,000, including `prototype` and symbol-keyed members |
| Methods | 696 |
| Methods that take a callback | 144 |
| Methods that can return `undefined` | 30 |
| Methods that return nothing | 38 |
| Array methods missing from `ReadonlyArray`, which marks them as changing the array | 9: `pop`, `push`, `reverse`, `shift`, `sort`, `splice`, `unshift`, `fill`, `copyWithin` |

Adding `lib.dom.d.ts` to the same run raised the count to 853 global values and about 64,800 members. The
DOM is out of scope for the base library. "Beyond the base library" below says where it goes.

The traits in that table are read off the signatures alone. Each trait selects the part of the call
matrix in `CALLABLES.md` that a shim needs:

| Trait read from the signature | Rows of the call matrix the shim takes |
|---|---|
| Number and types of parameters | the arity, and the argument provenances that fit each type |
| A parameter that is a function | the callback rows |
| A return type that includes `undefined` | the `undefined` exit |
| Returns nothing | the "returns nothing" exit, and the "discards it" result use |
| On `Array` but not on `ReadonlyArray` | the rows where a callee changes its argument |

So a shim never lists its own matrix rows. Its typing selects them. The shim's body adds only what the
typing cannot say: its deciders, and which arguments each exit depends on.

The generator writes the inventory as part of the doc set. Each row says whether the builtin has a shim
yet.

## Which builtins can be shimmed now

| Kind | Examples | Can be shimmed when |
|---|---|---|
| Reads its receiver and arguments, returns a value | `.at`, `.slice`, `.includes`, `.indexOf`, `.startsWith` | as soon as the call matrix passes |
| Takes a callback | `.map`, `.filter`, `.find`, `.reduce` | once Assayer drives a callback passed to a callee. Today that is undriven, as in `sad-path/undriven/hof-callback` |
| Changes its receiver | `.push`, `.pop`, `.shift`, `.sort` | once Assayer follows a callee changing its argument back to the caller. That needs its own row in the call matrix |
| Returns something no input decides | `Math.random`, `Date.now`, `crypto.randomUUID` | as soon as the call matrix passes. The shim declares a range or a pin function. See "Where a shim's result comes from" below |

## Where a shim's result comes from

A shim's result values come from one of three places. Only the first needs a declared range.

| Kind | Examples | Where the possible values come from |
|---|---|---|
| Fixed range | `Math.random()` is at least 0 and below 1 | Declared on the shim, because nothing in the code computes it |
| Set by the inputs | `xs.at(i)` is one of `xs`'s elements, or `undefined`. `xs.length` runs from 0 to `xs`'s size | The shim's own code. Declaring a range as well would write one fact twice, so the generator refuses a range on a shim that has inputs |
| Unbounded | A file read, a `fetch` result, `process.argv` | Nothing inside the program bounds it |

The `Math.random` shim:

```ts
export const mathRandomShim = shim({
  description: 'a pseudo-random number, at least 0 and below 1',
  builtin: 'Math.random',
  form: { kind: 'call', name: 'Math.random' },
  range: { min: 0, max: 1, maxExclusive: true, whole: false },
  pin: 'range',
  code: (): number => Math.random(),
});
```

`form: { kind: 'call' }` writes `Math.random()`, a builtin with no receiver.

### Pinning

To pin a builtin is to replace its result, inside one generated test, with a value Assayer chose. For that
test only, `Math.random()` returns `0.75`. It does what `jest.spyOn(Math, 'random').mockReturnValue(0.75)`
does, but Assayer does it inside the test it builds. No author ever writes the line. Pinning is a
capability Assayer wraps, so it follows rule R1 in `plan/requirements.md`.

| The shim declares | Used for | How a test gets its value |
|---|---|---|
| No range and no pin | Shims set by their inputs, such as `.at` and `.length` | Assayer sets the inputs. The result follows from them |
| `range`, with `pin: 'range'` | `Math.random` | Assayer picks one value in each region of the range that the code's checks create, plus each check's threshold |
| `pin: (want) => value` | A builtin whose type alone cannot produce a valid value: `crypto.randomUUID()` needs a real UUID, and `Date.now()` needs a time on the right side of a check | Assayer says which region it wants, and the function returns a value inside it |
| Nothing pinnable | File reads and network calls | These are effects. They need an effect model, which "Beyond the base library" describes |

### What a range decides before any test runs

Assayer compares the range with each check on the result:

| Code | The range `[0, 1)` says | Outcome |
|---|---|---|
| `Math.random() > 5` | never true | Locked. The `then` arm is dead, and Assayer reports it as unreachable |
| `Math.random() === 7` | never true | Locked, the same way |
| `Math.random() > 0.5` | either way | Driven. Assayer pins `0.5` and `0.75` |
| `if (Math.random())` | either way, because 0 is in the range | Driven. Assayer pins `0` and a value above it |

A test never tries every value in the range. It tries one value in each region the checks create, and each
threshold itself, because `>` and `>=` disagree exactly there. So n thresholds inside the range need at
most 2n + 1 values. A threshold outside the range splits nothing, and that is what makes an arm dead.

### What stays undriven

With every base builtin shimmed, very little cannot be driven:

- An input from outside the program that Assayer has no way to set, such as `process.argv`, a file read or
  a `fetch` result with no effect model.
- Code from outside the program: a closure that an outside caller applies later.

## The generated doc set

The generator writes one doc page per shim, plus an index of all of them. These pages are generated and
committed like the specimens. A check fails when a page would change on regeneration.

Each page holds:

| Section | What it shows |
|---|---|
| Signature | The declaration the shim stands for, as the type checker resolves it, and the `.d.ts` file it comes from |
| Spec steps | Each step from the spec, next to the shim line that does it. Steps the shim leaves out, and why |
| Source | The shim's code |
| Shape | Its arity, deciders and exits, in the terms of `CALLABLES.md` |
| Cases | The kinds of input its branches ask for, such as the four index kinds for `.at` |
| Containers tested | Every call-matrix row the shim appears in, and whether each passes against Assayer |
| Engine check | Whether the check against the real builtin passes, and how many inputs it ran in that run |

The index lists every shim, and every builtin a specimen calls that has no shim yet.

## Beyond the base library

A package in `node_modules` is handled one of three ways:

| The package ships | What Assayer does |
|---|---|
| JavaScript source with type declarations | Analyzes the source directly, the same way it analyzes the repo. The declarations supply the types the JavaScript lacks |
| Types only, or source Assayer cannot read, such as minified bundles | Requires a shim. Without one, every call into it is a dark spot |
| Code whose point is a side effect, such as React Testing Library, the DOM, `fetch` or the file system | Requires a shim, plus an effect model. The effect model says what a call changes outside the code, and how a test observes that change |

A shim says what a call returns. An effect model says what a call does to the world. A shim alone cannot
describe `render(<App />)`, because its result is not the point. The point is what is now in the DOM.

Shims and effect models for a package ship in that package's own `@assayer/*` plugin package. They do not
go in core. This follows rule R17 in `plan/requirements.md`. The effect model is the plugin's "observe at
runtime" callback from rule R15.

## Open questions

| Question | Why it matters |
|---|---|
| Do shims live in core, or in their own package? | The root `CLAUDE.md` keeps tech-specific code out of core. JavaScript's own builtins are arguably not tech-specific |
| Where do the engine-check inputs come from: test262, the type samples, or random generation? | Decides how strong rule 3 is |
| When analyzing a package's JavaScript directly, how deep does Assayer follow its own imports? | A large package pulls in a large dependency graph |
| What does an effect model look like? | Nothing defines its shape yet. React Testing Library is the first real case |
| Does the base library include Annex B, the legacy features such as `String.prototype.big`? | They are in the lib files and in the inventory count, but no modern code calls them |
