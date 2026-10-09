# Prototype 2: what you declare, and what comes out

`packages/specimen-generator` supersedes this prototype. This file is kept for its findings.

This file shows the second prototype's declaration files next to the specimens they generate. It covers
layer 2 of the build order in `PLAN.md`, containers crossed with syntax, plus a first cut of shims. A
shim is written into a specimen as a call to its builtin. The call matrix in `CALLABLES.md` is not built
yet.

The prototype lives in `tmp/specimen-generator-v2/`. **`tmp/` is git-ignored**, so the prototype is not
committed, and cleaning the checkout's ignored files deletes it. The first prototype is in
`tmp/specimen-generator-prototype/`. Its only parts still in use are the two builtin-inventory scripts
`SHIMS.md` names.

| Path in `tmp/specimen-generator-v2/` | What it is |
|---|---|
| `kit.ts` | The marker names the declaration files write |
| `configs/` | Every declaration file: containers, syntax, shims and the three settings files |
| `generate.ts` | The generator |
| `check-shims.ts` | Runs each shim against the real builtin. Covers `array-at` today |
| `review/build_review.py`, `review/review-template.html` | Build the review page from the configs and the three runs |
| `out/`, `subset/`, `subset-depth2/` | The three runs on 2026-10-08 |

## Running it

From `tmp/specimen-generator-v2/`:

| Command | What it does |
|---|---|
| `../../node_modules/.bin/tsc -p tsconfig.json` | Typechecks every declaration file |
| `../../node_modules/.bin/tsx generate.ts` | Writes every specimen into `out/src/`, plus `out/INDEX.md`, `out/REFUSED.txt` and `out/manifest.json` |
| `../../node_modules/.bin/tsx check-shims.ts` | Compares the `array-at` shim with `Array.prototype.at` on 48 inputs |
| `python3 review/build_review.py` | Writes `review/specimen-review.html` from `configs/` and the three runs' manifests |

The review page puts each config file beside every specimen it produced. The published copy is private to
its owner: https://claude.ai/code/artifact/3b754ead-3ae1-4907-9455-0dd94477d4c0. A session that changes
the configs reruns the three runs and the build script, then republishes to that link.

`generate.ts` takes three flags. It refuses any other argument before it writes anything.

| Flag | Meaning | Default |
|---|---|---|
| `--out=<dir>` | Where to write | `out/` |
| `--focus=<a,b>` | Only these syntax files in focus | `matrix.focus` |
| `--container=<a,b>` | Only these containers | every container |
| `--depth=<n>` | How many syntax or shim nodes may nest in a focus hole | `matrix.depth` |

A subset run, for reading a small sample:

```
../../node_modules/.bin/tsx generate.ts --out=subset --focus=if --container=function-declaration,class,module
```

Each run writes `INDEX.md`, which lists every specimen with its code and its predicted outcome.

## The files you declare

```
tmp/specimen-generator-v2/
  kit.ts                          the marker names the declarations write
  configs/
    types.ts                      per base type: the known value, array samples, and the env, random and external reads
    provenances.ts                where a leaf's value can come from
    matrix.ts                     which syntax is in focus, nesting depth, the plainest fills
    containers/
      <name>.container.ts         one per container
    syntax/
      <name>.syntax.ts            one per syntax: a statement such as `if`, or an expression such as `>`
    shims/
      <name>.shim.ts              one per builtin, such as `array-at.shim.ts` for `Array.prototype.at`
  generate.ts                     the generator
```

There are three kinds of file you add to: containers, syntax and shims. The other three files are shared
settings.

Each container, syntax or shim file exports exactly one const, named after the file: `class.container.ts`
exports `classContainer`, `gt.syntax.ts` exports `gtSyntax`, and `array-at.shim.ts` exports `arrayAtShim`. The generator stops with an error
naming the file when the export is missing, misnamed, or not alone.

### A container

A container is real TypeScript with markers where slots go. This is
`configs/containers/class.container.ts`:

```ts
export const classContainer = container({
  description: 'an exported class',
  slots: {
    method: { reach: 'construct-then-call', arm: 'return' },
    'static-method': { reach: 'call-static', arm: 'return' },
    getter: { reach: 'construct-then-read', arm: 'return' },
    'constructor-body': { reach: 'construct', arm: 'log' },
    field: { reach: 'construct' },
    'static-field': { reach: 'module-load' },
  },
  code: () => {
    class $Entry {
      public label = $expr('field');
      public static label = $expr('static-field');
      public constructor($params: never) {
        $stmts('constructor-body');
      }
      public run($params: never): $R {
        $stmts('method');
      }
      public static run($params: never): $R {
        $stmts('static-method');
      }
      public get result(): $R {
        return $stmts('getter');
      }
    }
  },
});
```

| Marker | Meaning |
|---|---|
| `$stmts('name')` | A statement slot. `return $stmts('name');` is the same slot, for a getter, because TypeScript requires a getter to contain a `return` |
| `$expr('name')` | An expression slot |
| `$params: never` | Where the generator puts the parameters the focus asks for |
| `$R` | Where the generator puts the result type |
| `$Entry` | The entry's name. The generator exports it |
| `$exportDefault(x)` | Becomes `export default x;` |

Each slot declares two things:

- **`reach`:** how a test gets to the slot. Examples: `call`, `construct-then-call`, `module-load`.
- **`arm`:** what an arm of a branch becomes in a statement slot. `return` writes `return 'then';`. `log`
  writes `console.log('then');`. `yield` writes `yield 'then';`. An expression slot has no arm.

The generator works out the rest from the code. Whether a slot can take parameters comes from whether the
function around it has `$params`. Whether a slot is a statement slot or an expression slot comes from the
marker.

When one entry has two different shapes, the container puts each shape in its own block. The generator
keeps the block that holds the slot in focus. This is `configs/containers/function-declaration.container.ts`:

```ts
code: () => {
  {
    function $Entry($params: never): $R {
      $stmts('body');
    }
  }
  {
    function $Entry($params: never, label: $R = $expr('default-param')): $R {
      return label;
    }
  }
},
```

### A syntax

A syntax file declares one statement or one expression, as a typed arrow function. Its parameters are its holes. The type checker reads each hole's
type and the result type from the code. Nobody declares them twice.

`configs/syntax/if.syntax.ts`:

```ts
export const ifSyntax = syntax({
  description: 'an if statement whose else falls through to the code after it',
  code: <T>(cond: T): void => {
    if (cond) {
      $arm('then');
    }
    $arm('else');
  },
});
```

`configs/syntax/gt.syntax.ts`:

```ts
export const gtSyntax = syntax({
  description: 'a value compared with a limit using >',
  code: <T extends number | string>(value: T, limit: T): boolean => value > limit,
  anchors: { limit: { number: 5, string: 'm' } },
});
```

`configs/syntax/ternary.syntax.ts`:

```ts
export const ternarySyntax = syntax({
  description: 'a conditional expression',
  code: <T>(cond: T): string => (cond ? $arm('then') : $arm('else')),
});
```

- **`$arm('name')`** marks one arm of a branch.
- **`anchors`** gives the literal a hole takes whenever it is not the hole being varied. `gt`'s `limit` is
  anchored to `5` for numbers, so `gt<number>` always reads as `value > 5`.

Three more expression files sit beside these: `eq.syntax.ts` (`===`), `not.syntax.ts` (`!`) and
`nullish.syntax.ts` (`??`).

### A generic syntax or shim

Every syntax file is generic, and so is every array shim. Each one is generic over what its operator
actually accepts:

| Declaration | Type parameter | Why |
|---|---|---|
| `if`, `ternary` | `<T>(cond: T)` | They test truthiness, so the condition can be any type: `if (count)`, `if (name)`, `if (flag)` |
| `not` | `<T>(value: T)` | `!` also tests truthiness |
| `eq` | `<T>(value: T, expected: T)` | `===` compares any two values of one type |
| `gt` | `<T extends number \| string>` | Code compares numbers and strings with `>`. TypeScript also accepts booleans, but nobody writes `true > false`, so a boolean instance would add files that test nothing |
| `nullish` | `<T>(value: T \| undefined, fallback: T)` | `??` defaults any type |
| `array-at`, `array-includes`, `array-length` | `<T>(receiver: readonly T[], ...)` | They work on an array of anything |
| `string-length` | none | Its receiver is a string by definition |

The ternary's result stays `string`, because its arms are `$arm` markers the generator writes as their
names. `configs/syntax/nullish.syntax.ts` shows a generic hole's anchor:

```ts
export const nullishSyntax = syntax({
  description: 'a value that may be undefined, defaulted with ??',
  code: <T>(value: T | undefined, fallback: T): T => value ?? fallback,
  anchors: { fallback: { number: 0, string: '', boolean: false } },
});
```

- **The generator makes one instance per type in `matrix.typeArguments`:** `nullish<number>`,
  `nullish<string>` and `nullish<boolean>`. Each instance fills only holes of its own type. So `.at` on a
  `readonly string[]`, which returns `string | undefined`, fills `nullish<string>`'s `value`.
- **A constraint narrows the list.** `gt` is `<T extends number | string>`, so it has no `boolean`
  instance.
- **A constraint is for what the operator accepts, not for one bad combination.** `eq` has a `boolean`
  instance. When its value is `const flag: boolean = true`, TypeScript narrows it to `true` and rejects
  `flag === false`. The generator refuses that one file, and every other `eq<boolean>` file is written.
- **An anchor on a generic hole gives one value per type,** because `0` is only a `number`. The generator
  stops with an error naming the hole when a type argument has no anchor value.
- **The instance's type goes in the folder name:** `array-at-string-...`, `nullish-number-...`.

Nobody says that `gt` can fill `if`'s condition. `gt` returns `boolean`, and `if<boolean>`'s `cond` takes
`boolean`, so the generator fills one with the other. The same goes for `eq` and `not`. Because `if` is
generic, `if<number>` takes any `number` expression too, such as `if (receiver.length)` or
`if (value ?? 0)`.

The prototype has no `decide` prop. To find which arm a set of known values reaches, the generator calls
the syntax file's own `code`. `$arm` throws, and the generator catches which arm it was. The syntax file's
declaration is the only place its condition is written.

### A shim

A shim is the plain-TypeScript model of one builtin. Its first parameter is the receiver, the value the
method is called on. `configs/shims/array-at.shim.ts`:

```ts
export const arrayAtShim = shim({
  description: 'reads one element of an array, counting back from the end for a negative index',
  builtin: 'Array.prototype.at',
  form: { kind: 'method', name: 'at' },
  code: <T>(receiver: readonly T[], index: number): T | undefined => {
    const whole = index !== index ? 0 : index - (index % 1);
    const k = whole >= 0 ? whole : receiver.length + whole;
    if (k < 0 || k >= receiver.length) {
      return undefined;
    }
    return receiver[k];
  },
});
```

The first line is the spec's step that cuts a fractional index down to a whole number, with `NaN` as 0.
The shim matches the real `Array.prototype.at` on 48 inputs, including fractions, `NaN` and both
infinities.

| Prop | Meaning |
|---|---|
| `builtin` | The declaration the shim stands for |
| `form` | How a specimen writes the call. `method` writes `receiver.at(index)`. `getter` writes `receiver.length` |
| `code` | The builtin's behavior, written from the spec. The generator runs it only to predict a call whose inputs are all known |

The shims so far are `array-at`, `array-includes`, `array-length` and `string-length`. The three array
shims are generic over `T`, like `nullish`.

A shim fills a hole by its result type, the same as a syntax does:

- `array-length` returns `number`, so it fills `gt`'s `value`. That gives `receiver.length > 5`.
- `array-includes` returns `boolean`, so it fills an `if` condition.
- `array-at<string>` returns `string | undefined`, so it fills `nullish<string>`'s `value`. That gives
  `receiver.at(index) ?? ''`.

A shim can also be the focus. Then its holes vary like any syntax's holes. For example, `array-at`'s index
can be a parameter, a literal, a const, `Math.random()`, `Number(process.argv[2])`,
`arrayLengthReceiver.length` or `value ?? 0`.

`configs/shims/math-random.shim.ts` is a shim with no inputs. It declares a `range` and `pin: 'range'`.
`SHIMS.md` explains both. It never fills a hole as a node. It reaches a hole only through the `random`
provenance below.

### The shared settings

`configs/matrix.ts`:

```ts
export const matrix = {
  focus: ['if', 'ternary'],
  depth: 1,
  plainest: ['param', 'env', 'const'],
  typeArguments: ['number', 'string', 'boolean'],
};
```

| Setting | Meaning |
|---|---|
| `focus` | The syntax or shims under test. Everything else only fills holes |
| `depth` | How many syntax or shim nodes may nest inside a focus hole. `1` allows `if (value > 5)` |
| `plainest` | The fill a leaf takes when it is not the one being varied: the first of these that the slot offers |
| `typeArguments` | The types a type parameter can become |

`configs/provenances.ts` lists where a leaf's value can come from:

| Provenance | Can a test set it? | What the generator writes |
|---|---|---|
| `param` | yes | a parameter of the function around the slot |
| `env` | yes, at module level | a top-level const read from `process.env` |
| `literal` | no, its one value is known | the value, inline |
| `const` | no, its one value is known | a top-level const |
| `random` | by pinning, inside the shim's range | `Math.random()`, inline. It names the `math-random` shim |
| `external` | no | a read of `process.argv`, inline |

`external` stands in for any input from outside the program. If Assayer learns to set `process.argv` the
way it sets `env`, `external` moves to settable, and a new unsettable source replaces it.

`configs/types.ts` lists only base types: `number`, `string` and `boolean`. Each gives:

- its known value: `3`, `'abc'`, `true`
- three samples for an array of it
- how to read it, and an array of it, from `process.env`
- its `random` expression, such as `Math.random() > 0.5` for `boolean`, and a function giving that
  expression's value for a pinned `Math.random()` value `r`
- its `external` expression, such as `Number(process.argv[2])` for `number`

The generator derives `readonly X[]` and `X | undefined` from these, so neither is listed. A known value is
written as a `const` with the hole's type, such as `const value: number = 3;`.

## How one specimen is built

Take `if<boolean>` in focus, in the class container's `method` slot, with the leaf inside `gt<number>`
varying to `random`.

1. **Pick the slot.** The generator keeps the class member holding `method` and drops every member holding
   another slot.
2. **Build the fill tree.** `if<boolean>`'s `cond` takes `gt<number>`, because both are `boolean`.
   `gt<number>`'s `value` is the varying leaf, set to `random`. Its `limit` takes its number anchor, `5`.
3. **Write what the leaves need.** A random leaf is written inline as `Math.random()`, so nothing goes above
   the code.
4. **Swap the markers.** `$stmts('method')` becomes the `if`. Each `$arm` becomes `return 'then';` or
   `return 'else';`, because the slot's arm is `return`. `$params` becomes nothing, because no leaf is a
   parameter. `$R` becomes `string`.
5. **Name and export it.** The folder name is
   `<focus>-<type>-<container>-<slot>-<path to the varying leaf>-<provenance>`. Each generic node in the path
   carries its type too: `cond-gt-number-value`.

The result, `if-boolean-class-method-cond-gt-number-value-random.ts`:

```ts
export class IfBooleanClassMethodCondGtNumberValueRandom {
  public run(): string {
    if (Math.random() > 5) {
      return 'then';
    }
    return 'else';
  }
}
```

Predicted: locked. The `Math.random` shim's range is `[0, 1)`, which never exceeds 5. So the only case
reaches `else`, and the `then` arm is reported as unreachable.

## More real output

The same `if` and `gt` declarations, in other containers:

`if-boolean-module-statement-cond-gt-number-value-env.ts`, predicted driven, one case per arm:

```ts
const value = Number(process.env.VALUE);

if (value > 5) {
  console.log('then');
}

console.log('else');

export {};
```

`if-boolean-generator-function-cond-gt-number-value-param.ts`, predicted driven, one case per arm:

```ts
export function* ifBooleanGeneratorFunctionCondGtNumberValueParam(value: number): Generator<string> {
  if (value > 5) {
    yield 'then';
  }
  yield 'else';
}
```

`if-boolean-class-getter-cond-gt-number-value-const.ts`, predicted locked to `else`, with the `then` arm reported as
unreachable:

```ts
const value = 3;

export class IfClassGetterCondGtValueConst {
  public get result(): string {
    if (value > 5) {
      return 'then';
    }
    return 'else';
  }
}
```

`ternary-boolean-function-declaration-default-param-cond-gt-number-value-param.ts`, predicted driven:

```ts
export function ternaryBooleanFunctionDeclarationDefaultParamCondGtNumberValueParam(
  value: number,
  label: string = value > 5 ? 'then' : 'else',
): string {
  return label;
}
```

`ternary-number-class-static-field-cond-env.ts`, predicted driven:

```ts
const cond = Number(process.env.COND);

export class TernaryNumberClassStaticFieldCondEnv {
  public static label = cond ? 'then' : 'else';
}
```

## The rules the generator applies

1. **Exactly one leaf varies per specimen.** Every other leaf takes its anchor, or the plainest fill its
   slot offers.
2. **An anchored hole never varies.** This keeps `value > limit` with two parameters out for now. That case
   waits on the two-argument rule, an open question in `CALLABLES.md`.
3. **A slot offers only the provenances it can use.** `param` needs `$params` on the function around the
   slot. `env` needs the slot to run at module load. `literal`, `const`, `random` and `external` are always offered.
4. **A syntax whose every hole is a literal is never written.** `if (true)` and `3 > 5` are not good
   code. A known value always goes through a `const`.
5. **A syntax's kind is the node kind of its code's body.** A block body makes it a statement, and the
   generator refuses a block body that returns a value. An expression body makes it an expression of its
   return type. A shim is always an expression, because a specimen writes it as a call. A statement never
   fills a hole, so `if` can never become a call argument, a condition or an initializer.
6. **A statement syntax never goes in an expression slot.** An expression syntax goes in a statement
   slot wrapped in the slot's arm: `return`, `console.log(...)` or `yield`.
7. **TypeScript is the last judge of good code.** Every file is typechecked under `strict`,
   `noUnusedLocals`, `noUnusedParameters` and `noImplicitReturns`. A file TypeScript rejects is not written.
   It is listed in `REFUSED.txt` and in the manifest as refused, with TypeScript's reason. The rules above
   cannot foresee every narrowing. One example: a ternary's type is really `'then' | 'else'`, so
   `(cond ? 'then' : 'else') === 'xyz'` can never be true, and TypeScript refuses it.

## The prediction rules

The generator predicts each specimen's outcome from the fill tree. It never runs Assayer.

| The tree's leaves | Predicted |
|---|---|
| Any leaf is `external` | Undriven: no cases, one undriven admission |
| Any leaf can be set by a test (`param`, `env`) | Driven: one case per arm |
| Every leaf is known or `random`, and the known values together with the whole `Math.random` range reach more than one arm | Driven: Assayer pins `Math.random()` in each region, one case per reachable arm |
| Every leaf is known or `random`, and they reach only one arm | Locked: one case, reaching that arm. Every other arm is reported as unreachable, except an arm that is just the code after the branch |
| TypeScript rejects the file | Refused: no file is written |

To find which arms a `random` leaf can reach, the generator runs the syntax files' own `code` with
`Math.random()` replaced by 200 evenly spaced values across the shim's range. Those values only answer
"which arms can be reached". They are not test values. Assayer picks the test values itself, one per
region.

When a shim is the focus, a driven specimen predicts one case per path through the shim, and a locked one
predicts the value the shim's `code` returns. The generator does not yet list the paths themselves.

## The full run on 2026-10-08

Focus `if` and `ternary`, every container, depth 1, type arguments `number`, `string` and `boolean`:

| Focus | Container | Specimens | Driven | Locked | Undriven | Refused |
|---|---|---|---|---|---|---|
| if | arrow-function | 99 | 52 | 23 | 24 | 15 |
| if | async-function | 100 | 52 | 24 | 24 | 14 |
| if | class | 376 | 168 | 112 | 96 | 53 |
| if | default-export | 99 | 52 | 23 | 24 | 15 |
| if | function-declaration | 100 | 52 | 24 | 24 | 14 |
| if | function-expression | 99 | 52 | 23 | 24 | 15 |
| if | generator-function | 100 | 52 | 24 | 24 | 14 |
| if | iife | 99 | 52 | 23 | 24 | 15 |
| if | module | 99 | 52 | 23 | 24 | 15 |
| if | object-literal | 198 | 104 | 46 | 48 | 30 |
| ternary | arrow-function | 198 | 104 | 46 | 48 | 6 |
| ternary | async-function | 100 | 52 | 24 | 24 | 2 |
| ternary | class | 552 | 232 | 176 | 144 | 12 |
| ternary | default-export | 99 | 52 | 23 | 24 | 3 |
| ternary | function-declaration | 200 | 104 | 48 | 48 | 4 |
| ternary | function-expression | 99 | 52 | 23 | 24 | 3 |
| ternary | generator-function | 100 | 52 | 24 | 24 | 2 |
| ternary | iife | 99 | 52 | 23 | 24 | 3 |
| ternary | module | 198 | 104 | 46 | 48 | 6 |
| ternary | object-literal | 297 | 156 | 69 | 72 | 9 |

That run wrote 3311 specimens from 10 container files, 6 syntax files, 4 shim files and 3 settings
files. TypeScript refused 250. The shims only fill holes here, because no shim is in focus.

## Two subset runs on 2026-10-08

| Run | Focus | Containers | Depth | Written | Refused by TypeScript | Folder |
|---|---|---|---|---|---|---|
| Small | `if`, `array-at`, `array-includes` | function-declaration, module | 1 | 957 | 39 | `subset/` |
| Depth 2 | `if` | function-declaration, module | 2 | 806 | 270 | `subset-depth2/` |

Depth 2 is what allows `if (receiver.length > 5)`.

TypeScript's refusals across the three runs have three causes:

| TypeScript's reason | Example the generator wrote |
|---|---|
| This kind of expression is always truthy | `if (cond ? 'then' : 'else')`: both arms are non-empty strings |
| The types 'true' and 'false' have no overlap | `const value: boolean = true;` then `value === false` |
| The types '"then" \| "else"' and '"xyz"' have no overlap | `(cond ? 'then' : 'else') === 'xyz'` |

Some files the `random` and `external` provenances produce, from the small run:

`if-boolean-function-declaration-body-cond-gt-number-value-random.ts`, predicted locked:

```ts
export function ifBooleanFunctionDeclarationBodyCondGtNumberValueRandom(): string {
  if (Math.random() > 5) {
    return 'then';
  }
  return 'else';
}
```

`if-boolean-function-declaration-body-cond-gt-string-value-random.ts`, predicted driven:

```ts
export function ifBooleanFunctionDeclarationBodyCondGtStringValueRandom(): string {
  if ((Math.random() > 0.5 ? 'abc' : 'xyz') > 'm') {
    return 'then';
  }
  return 'else';
}
```

`if-number-function-declaration-body-cond-random.ts`, predicted driven. The `else` arm is reachable because 0 is inside the range:

```ts
export function ifNumberFunctionDeclarationBodyCondRandom(): string {
  if (Math.random()) {
    return 'then';
  }
  return 'else';
}
```

`if-number-function-declaration-body-cond-external.ts`, predicted undriven:

```ts
export function ifNumberFunctionDeclarationBodyCondExternal(): string {
  if (Number(process.argv[2])) {
    return 'then';
  }
  return 'else';
}
```


Some files from the small run:

`array-at-number-function-declaration-body-index-array-length-number-receiver-param.ts`, predicted driven:

```ts
export function arrayAtNumberFunctionDeclarationBodyIndexArrayLengthNumberReceiverParam(
  receiver: readonly number[],
  arrayLengthReceiver: readonly number[],
): number | undefined {
  return receiver.at(arrayLengthReceiver.length);
}
```

`array-at-string-function-declaration-body-index-nullish-number-value-param.ts`, predicted driven. The receiver is a `string` array, and the index still takes `nullish<number>`, because an index is always a number:

```ts
export function arrayAtStringFunctionDeclarationBodyIndexNullishNumberValueParam(
  receiver: readonly string[],
  value: number | undefined,
): string | undefined {
  return receiver.at(value ?? 0);
}
```

`array-includes-string-function-declaration-body-search-element-nullish-string-value-external.ts`, predicted undriven:

```ts
export function arrayIncludesStringFunctionDeclarationBodySearchElementNullishStringValueExternal(
  receiver: readonly string[],
): boolean {
  return receiver.includes((process.argv[2] === undefined ? undefined : (process.argv[2] ?? '')) ?? '');
}
```

`if-boolean-function-declaration-body-cond-array-includes-number-receiver-literal.ts`, predicted driven:

```ts
export function ifBooleanFunctionDeclarationBodyCondArrayIncludesNumberReceiverLiteral(
  searchElement: number,
): string {
  if ([10, 20, 30].includes(searchElement)) {
    return 'then';
  }
  return 'else';
}
```

From the depth-2 run:

`if-boolean-function-declaration-body-cond-gt-number-value-array-length-number-receiver-param.ts`, predicted driven:

```ts
export function ifBooleanFunctionDeclarationBodyCondGtNumberValueArrayLengthNumberReceiverParam(
  receiver: readonly number[],
): string {
  if (receiver.length > 5) {
    return 'then';
  }
  return 'else';
}
```


## What is not built yet

| Missing | What it needs |
|---|---|
| Tests against Assayer | The first prototype wrote a Jest test per specimen. This one writes the specimen and a predicted outcome in words only. Turning each prediction into a test needs exact values: the cases with their arranged inputs, the exit each case reaches, and the exact text of each lint and admission |
| Calls | Layer 3 in `CALLABLES.md` |
| The stub dimension | `STUBS.md` |
| A shim's paths | A driven shim prediction says "one case per path through the shim" without listing the paths |
| Range-aware prediction through a shim | A `random` leaf inside a shim, such as `receiver.at(Math.random())`, predicts driven from the other, settable hole. The generator does not carry the range through the shim's code |
| Pin functions | `kit.ts` declares `pin: (want) => value`. The generator only uses `pin: 'range'` |
| A generic ternary | The ternary's arms are `$arm` markers, so its type is always `string`. Making its arms holes of type `T` needs a way to name an arm that is also a hole |
| The repo's standards | `LINT.md` |

`BACKLOG.md` lists the containers, syntax, shims, provenances, types and values still to declare.

## Findings

1. **`$stmts` is typed `never` in the kit.** A function whose whole body is a slot then needs no `return`
   of its own to typecheck. A getter still needs one, so the getter slot is written
   `return $stmts('getter');`.
2. **One entry, two shapes, goes in two blocks.** A function with a body slot and a function with a
   default-parameter slot are both `$Entry`. Two declarations of one name do not typecheck, so each shape
   sits in its own block.
3. **A module-level specimen with no export is a script.** The generator adds `export {};` so two specimens
   that declare the same name don't clash. Whether that changes Assayer's analysis is an open
   question in `ASSAYER-FINDINGS.md`.
4. **A class field and a getter can only be locked or undriven.** Neither one takes parameters, and
   neither runs at module load. So no test can set its value. That is correct, and the matrix shows it.
5. **A known value needs the hole's type written on it.** `const value = 3;` gives `value` the type `3`, not
   `number`. TypeScript then rejects `value === 7` as a comparison that can never be true. The generator
   writes `const value: number = 3;`, so the leaf has the type the hole asked for. The strict typecheck of
   the output caught this.
6. **Two leaves can share a hole name.** `receiver.at(receiver.length)` would declare `receiver` twice. The
   first leaf rendered keeps the plain name, and a later one is prefixed with its owner:
   `arrayLengthReceiver`.
7. **A node never fills its own hole directly.** That rule keeps out `!!flag` and `a ?? b ?? c`.
8. **A focus with two free holes is never locked.** Only one leaf varies, and the other hole takes a
   parameter wherever the slot offers one. So `const receiver = [10, 20, 30]; receiver.at(3)` is never
   generated in a function slot. Producing it needs a rule for varying two leaves at once.
9. **An array read from `env` uses builtins that have no shim.** The generator writes
   `(process.env.RECEIVER ?? '').split(',').map(Number)`. `split` and `map` have no shims yet.
10. **Generic instances multiply the count.** Three type arguments made the small subset 600 files where it
    was 176 with `number` alone. `matrix.typeArguments` is the setting to narrow for a readable run.
11. **`Math.random()` is not undriven once it has a shim.** Its range `[0, 1)` decides
    `Math.random() > 5` and `Math.random() === 7` before any test runs, so their `then` arms are dead. Pinning
    drives `Math.random() > 0.5`. So only an `external` leaf predicts undriven.
12. **A fractional index is where a shim that skips a spec step goes wrong.** Without the step that cuts an
    index down to a whole number, `.at(0.37)` would read `receiver[0.37]`, which is `undefined`. The real
    builtin returns `receiver[0]`. The shim does the step, and it matches the builtin on 48 inputs.
13. **The prototype's own code breaks the repo's lint rules.** It uses `any` and positional parameters. It
    is throwaway and git-ignored, so it is exempt. The real generator has to meet the repo's rules.
