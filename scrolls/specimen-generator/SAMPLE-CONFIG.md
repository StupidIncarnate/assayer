# Specimen generator: a full sample config

This file shows the prototype's configs exactly as they are now. It is built from the real files in
`tmp/specimen-generator-prototype/configs/`, which git ignores. Those files are the source of truth. If
this doc and those files disagree, the files win.

Two stress tests have run these configs through the generator and then through Assayer.
`STRESS-TEST-1.md` and `STRESS-TEST-2.md` have the results.

## Running the prototype

| Command | What it does |
|---|---|
| `../../node_modules/.bin/tsx generate.ts <output src folder> <report folder>` | Writes every specimen and its test |
| `python3 mutate.py <work dir>` | Changes one config prop at a time, regenerates, and checks each change has the expected effect |
| `python3 build-sample-doc.py` | Rebuilds this doc from the config files and a generator run. Edit `RUN` at its top to point at that run's output |

Run both from `tmp/specimen-generator-prototype/`.

## How the config is split

| File | What it holds |
|---|---|
| One config per entry | One syntax or one complex specimen |
| `vocabulary.ts` | The shared lists every entry refers to by name: types, demands, sources, containers, message templates, naming |

The config folders mirror the output folders. A syntax is known by `<group>/<name>`, such as `array/at`.
The group is the thing the syntax belongs to: `array`, `string`, `control-flow`, and later `react`.

| Entry | Config file | Output folder |
|---|---|---|
| `array/at` | `configs/syntax/array/at/at.config.ts` | `src/syntax/array/at/` |
| `array/length` | `configs/syntax/array/length/length.config.ts` | `src/syntax/array/length/` |
| `string/length` | `configs/syntax/string/length/length.config.ts` | `src/syntax/string/length/` |
| `control-flow/if-gt` | `configs/syntax/control-flow/if-gt/if-gt.config.ts` | `src/syntax/control-flow/if-gt/` |
| `control-flow/if-opaque` | `configs/syntax/control-flow/if-opaque/if-opaque.config.ts` | `src/syntax/control-flow/if-opaque/` |
| complex `harness-callback-param` | `configs/complex/harness-callback-param/harness-callback-param.config.ts` | `src/complex/harness-callback-param/` |

## Rules the generator enforces on every config

The generator stops with an error, naming the file and the prop, when any of these fails:

1. Every config file typechecks.
2. `type` is `'syntax'` or `'complex'`.
3. `group` and `name` match the config's folder.
4. Every object in a config holds only props the generator reads. A typo like `literal:` instead of
   `literals:` is an error, not silently ignored.
5. Every key in `holes` names a template parameter, and every template parameter has a key.
6. The template's type parameters match `generics`.
7. A hole has a `demand` exactly when a test has to choose its values. That means when one of its sources
   is settable.
8. A hole with a known source has `literals`.
9. A branching syntax has `decide`. A syntax that does not branch has no `decide`.
10. A complex entry lists every container, and every one is `false`.
11. A complex entry writes out `undriven`, `darkSpots` and `gaps`, even when they are empty.

## Entry props

| Prop | Required | What it does |
|---|---|---|
| `type` | yes | `'syntax'` or `'complex'` |
| `group` | syntax only | The thing the syntax belongs to, such as `array` |
| `name` | yes | The syntax or specimen name |
| `description` | yes | One sentence, used in the generated test's title |
| `template` | syntax only | A typed arrow function. Each parameter is a hole, and its type is the hole's type. `arm('<name>')` marks one arm of a branch |
| `generics` | when the template has type parameters | The types that fill each type parameter |
| `decide` | branching syntax only | Given a value for each hole, returns which arm runs. The generator uses it to predict each case's exit, and to find the dead arm when every hole is fixed |
| `inverse` | optional | Given a result value `n`, builds an input that produces it. Used when another syntax needs this one to produce particular values |
| `holes` | syntax only | One entry per template parameter. See below |
| `containers` | yes | For a syntax: which containers it may go in. For a complex entry: every container, all `false` |
| `files`, `expect` | complex only | The specimen's files, and its expected results written out by hand |

## Hole props

| Prop | What it does |
|---|---|
| `sources` | Where the hole's value may come from. Each is a source name from `vocabulary.sources`, or `{ syntax: '<group>/<name>' }` to fill the hole with another syntax |
| `literals` | Named values a known source writes into the code. More than one name adds a variant per name |
| `demand` | Which values a test must try. Either a demand name, or `{ use, from, otherwise }`: use `use` when the sibling hole named by `from` is known, otherwise use `otherwise` |

## Source props, in `vocabulary.sources`

| Prop | What it does |
|---|---|
| `settable` | A test chooses this value. The hole needs a `demand` |
| `known` | The value is written in the code, so Assayer can fold it to one value. The hole needs `literals` |
| `declares` | What the source writes: `param`, `inline`, `const`, or `helper` |
| `opaqueValue` | For a `helper` source: the expression the helper returns, per hole type |

A source that is neither settable nor known is opaque. A branch decided by an opaque source can't be
steered by any test, so the generator predicts no cases for it and one undriven admission.

## Container props, in `vocabulary.containers`

| Prop | What it does |
|---|---|
| `offers` | The sources a hole may use in this container. `literal` is always allowed as well |
| `default` | The source that adds nothing to the specimen folder name |
| `entryKind` | `function`, `function-via-inner`, `module` or `none`. Decides what the entry is and what an expression syntax becomes |
| `calls` | For `function-via-inner`: the name of the private function the entry calls |
| `source` | The container's code, as TypeScript with marker identifiers |
| `arm` | What one arm of a branch becomes, such as `return ARM;` |
| `armExits` | Whether an arm ends the scope. `true` for `return`, `false` for `console.log` at module scope |
| `armResult` | The return type used when a branching syntax sits in a function |

The markers in a container's `source`:

| Marker | Where it sits | What replaces it |
|---|---|---|
| `CONSTS;` | A statement | The `const` declarations and helper functions holes need |
| `SLOT;` or `SLOT` | A statement, or an expression | The syntax |
| `ENTRY` | An identifier | The entry's name: the folder name in camelCase |
| `PARAMS: never` | A parameter | One parameter per hole whose source declares a `param` |
| `ARGS` | A call argument | The arguments the entry passes to the function named by `calls` |
| `RESULT` | A type | The syntax's result type, or `armResult` for a branching syntax |
| `ARM` | Inside `arm` | The arm's name, as a string literal |

## The entry configs

### `configs/syntax/array/at/at.config.ts`

```ts
export const config = {
  type: 'syntax',
  group: 'array',
  name: 'at',
  description: 'Array.prototype.at reading one element from an array, by index',

  template: <T>(chain: T[], index: number): T | undefined => chain.at(index),
  generics: { T: ['number'] },
  holes: {
    chain: {
      demand: 'cardinality',
      sources: ['param', 'literal', 'call-arg-literal'],
      literals: { three: [10, 20, 30] },
    },
    index: {
      // When `chain` is known, try every index up to one past its end. Otherwise try 0, -1 and 7.
      demand: { use: 'index-known', from: 'chain', otherwise: 'index-free' },
      sources: ['param', 'literal', 'call-arg-literal', { syntax: 'array/length' }, { syntax: 'string/length' }],
      literals: { 'in-range': 1, 'past-end': 3 },
    },
  },
  containers: {
    'module-scope': true,
    'function-params': true,
    'function-literal-arg': true,
    passthrough: true,
    'object-prop': true,
  },
};
```

### `configs/syntax/array/length/length.config.ts`

```ts
export const config = {
  type: 'syntax',
  group: 'array',
  name: 'length',
  description: 'the length property of an array',

  template: <T>(chain: T[]): number => chain.length,
  generics: { T: ['number', 'string'] },
  holes: {
    chain: { demand: 'cardinality', sources: ['param', 'literal'], literals: { three: [10, 20, 30] } },
  },
  // When another syntax needs this result to be `n`, the generator builds an input of length `n`:
  // the first `n` values of the element type's sample.
  inverse: (n: number, ctx: { sample: unknown[] }): unknown[] => ctx.sample.slice(0, n),
  containers: {
    'module-scope': true,
    'function-params': true,
    'function-literal-arg': true,
    passthrough: true,
    'object-prop': true,
  },
};
```

### `configs/syntax/string/length/length.config.ts`

```ts
export const config = {
  type: 'syntax',
  group: 'string',
  name: 'length',
  description: 'the length property of a string',

  template: (text: string): number => text.length,
  holes: {
    text: {
      demand: 'string-size',
      sources: ['param', 'literal', 'same-file-const', 'call-arg-literal'],
      literals: { 'some-text': 'SomeText' },
    },
  },
  // When another syntax needs this result to be `n`, the generator builds a string of length `n`.
  inverse: (n: number): string => 'a'.repeat(n),
  containers: {
    'module-scope': true,
    'function-params': true,
    'function-literal-arg': true,
    passthrough: true,
    'object-prop': true,
  },
};
```

### `configs/syntax/control-flow/if-gt/if-gt.config.ts`

```ts
import { arm } from '../../../../kit';

export const config = {
  type: 'syntax',
  group: 'control-flow',
  name: 'if-gt',
  description: 'an if statement comparing a number with a literal limit using >',

  template: (value: number, limit: number): void => {
    if (value > limit) {
      arm('then');
    }
    arm('else');
  },
  // Which arm a set of hole values takes. The generator uses it to predict each case's exit, and to
  // find the dead arm when every hole is fixed.
  decide: ({ value, limit }: { value: number; limit: number }): string => (value > limit ? 'then' : 'else'),
  holes: {
    value: {
      demand: { use: 'gt', from: 'limit' },
      sources: ['param', 'call-arg-literal', 'same-file-const'],
      literals: { below: 3, above: 7 },
    },
    limit: { sources: ['literal'], literals: { five: 5 } },
  },
  containers: {
    'module-scope': true,
    'function-params': true,
    'function-literal-arg': true,
    passthrough: true,
    'object-prop': false,
  },
};
```

### `configs/syntax/control-flow/if-opaque/if-opaque.config.ts`

```ts
import { arm } from '../../../../kit';

export const config = {
  type: 'syntax',
  group: 'control-flow',
  name: 'if-opaque',
  description: 'an if statement whose condition is a value the file computes, which no test can set',

  template: (flag: boolean): void => {
    if (flag) {
      arm('then');
    }
    arm('else');
  },
  decide: ({ flag }: { flag: boolean }): string => (flag ? 'then' : 'else'),
  holes: {
    // `opaque-call` writes a helper that returns Math.random() > 0.5, and the condition calls it.
    flag: { sources: ['opaque-call'] },
  },
  containers: {
    'module-scope': false,
    'function-params': true,
    'function-literal-arg': true,
    passthrough: false,
    'object-prop': false,
  },
};
```

### `configs/complex/harness-callback-param/harness-callback-param.config.ts`

```ts
export const config = {
  type: 'complex',
  name: 'harness-callback-param',
  description: 'a colocated harness supplies the callback parameter, so both arms of the branch run',

  // A complex entry writes out its own code, so every container is false.
  containers: {
    'module-scope': false,
    'function-params': false,
    'function-literal-arg': false,
    passthrough: false,
    'object-prop': false,
  },
  files: {
    'harness-callback-param.ts': [
      'export function audit(size: number, report: (message: string) => string): string {',
      '  if (size > 10) {',
      "    return report('big');",
      '  }',
      '',
      "  return report('small');",
      '}',
    ],
    'harness-callback-param.harness.ts': [
      "import { assayerHarness } from '@assayer/core';",
      '',
      'assayerHarness({ inputs: { audit: { report: (message: string): string => `audited:${message}` } } });',
    ],
  },
  // Written out by hand. A complex entry never runs through the outcome rules.
  expect: {
    overlays: ['harness-realize'],
    functions: [
      {
        name: 'audit',
        access: { kind: 'named' },
        cases: [
          { reaches: [{ line: 3 }], arrange: [{ kind: 'param', param: 'size', value: 11 }, { kind: 'harness', param: 'report', key: 'inputs.audit.report' }], salient: true },
          { reaches: [{ line: 6 }], arrange: [{ kind: 'param', param: 'size', value: 10 }, { kind: 'harness', param: 'report', key: 'inputs.audit.report' }], salient: true },
        ],
      },
    ],
    lints: [],
    undriven: [],
    darkSpots: [],
    gaps: [],
  },
};
```

## The shared vocabulary

### `configs/vocabulary.ts`

```ts
// The shared building blocks every entry config refers to by name.

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const vocabulary = {
  types: {
    number: { sample: [7, 8, 9, 10, 11, 12, 13] },
    string: { sample: ['abc123', 'abc123_1', 'abc123_2', 'abc123_3'] },
  } as Record<string, { sample: unknown[] }>,

  // Which values Assayer must try for a settable hole. `ctx.sample` is the generic type's sample.
  // `ctx.from` is the known value of the sibling hole the demand names in `from`.
  demands: {
    cardinality: (ctx: { sample: unknown[] }) => [[], ctx.sample.slice(0, 1), ctx.sample.slice(0, 2)],
    'index-free': () => [0, -1, 7],
    'index-known': (ctx: { from: unknown[] }) => range(0, ctx.from.length),
    gt: (ctx: { from: number }) => [ctx.from + 1, ctx.from],
    // A string that only has to exist: empty, one character, several characters. A guess at what
    // Assayer should try, still to be checked against it.
    'string-size': () => ['', 'a', 'abc123'],
  } as Record<string, (ctx: any) => unknown[]>,

  // A source is settable (a test chooses its value), known (folded to one value written in the code), or
  // opaque (neither). `declares` says what the source writes:
  //   param   a parameter of the function the syntax sits in
  //   inline  the value itself, written straight into the expression
  //   const   a `const` declaration above the code
  //   helper  a function above the code that returns `opaqueValue` for the hole's type
  sources: {
    param: { settable: true, known: false, declares: 'param' },
    literal: { settable: false, known: true, declares: 'inline' },
    'same-file-const': { settable: false, known: true, declares: 'const' },
    'call-arg-literal': { settable: false, known: true, declares: 'param' },
    'opaque-call': { settable: false, known: false, declares: 'helper', opaqueValue: { boolean: 'Math.random() > 0.5' } },
  } as Record<string, any>,

  // Each container is real TypeScript with marker identifiers. The generator parses it and swaps the
  // marker NODES, never text:
  //   CONSTS;   becomes the declarations holes need: consts and helper functions
  //   SLOT      becomes the syntax: a statement slot (`SLOT;`) or an expression slot
  //   ENTRY     becomes the entry's name
  //   PARAMS    (a parameter) becomes the parameters holes need
  //   ARGS      (an argument) becomes the arguments the entry passes to the function named by `calls`
  //   RESULT    (a type) becomes the syntax's result type, or armResult for a branching syntax
  //   ARM       (inside `arm`) becomes the arm's name as a string
  // entryKind decides what an expression syntax becomes: `return <expr>;` in a function, `<expr>;` at
  // module scope, and the expression itself for 'none'. armExits says whether an arm ends the scope.
  containers: {
    'module-scope': {
      offers: ['literal', 'same-file-const'],
      default: 'same-file-const',
      entryKind: 'module',
      source: 'CONSTS;\nSLOT;\n',
      arm: 'console.log(ARM);',
      armExits: false,
    },
    'function-params': {
      offers: ['param', 'literal', 'opaque-call'],
      default: 'param',
      entryKind: 'function',
      source: 'CONSTS;\nexport function ENTRY(PARAMS: never): RESULT {\n  SLOT;\n}\n',
      arm: 'return ARM;',
      armExits: true,
      armResult: 'string',
    },
    'function-literal-arg': {
      offers: ['call-arg-literal', 'literal', 'opaque-call'],
      default: 'call-arg-literal',
      entryKind: 'function-via-inner',
      calls: 'inner',
      source:
        'CONSTS;\nfunction inner(PARAMS: never): RESULT {\n  SLOT;\n}\n\nexport function ENTRY(): RESULT {\n  return inner(ARGS);\n}\n',
      arm: 'return ARM;',
      armExits: true,
      armResult: 'string',
    },
    passthrough: {
      offers: ['param'],
      default: 'param',
      entryKind: 'function-via-inner',
      calls: 'inner',
      source:
        'function inner(PARAMS: never): RESULT {\n  SLOT;\n}\n\nexport function ENTRY(PARAMS: never): RESULT {\n  return inner(ARGS);\n}\n',
      arm: 'return ARM;',
      armExits: true,
      armResult: 'string',
    },
    'object-prop': {
      offers: ['literal', 'same-file-const'],
      default: 'same-file-const',
      entryKind: 'none',
      source: 'CONSTS;\nexport const ENTRY = { value: SLOT };\n',
    },
  } as Record<string, any>,

  lintMessages: {
    'unreachable-exit':
      '`{fn}` can never reach the exit on line {deadLine}: `{operand}` is welded to `{value}`, so the ' +
      'branch on line {branchLine} always takes its other arm and this one is dead. Either a comparison ' +
      'is wrong, or this arm should be deleted.',
  } as Record<string, string>,

  admissionMessages: {
    'undriven-branch':
      '`{fn}` has a branch on line {line} whose deciding value is neither one of its parameters nor an ' +
      'environment variable, so no case can steer which arm runs: with nothing to vary, both arms would ' +
      'arrange the same inputs and one would fail against correct code. Assayer understood the branch — ' +
      'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
      'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
      'becomes a case Assayer drives.',
  } as Record<string, string>,

  naming: { syntaxRoot: 'syntax', complexRoot: 'complex', omitContainer: ['module-scope'] },
};
```

## How the generator expands a syntax entry

1. Takes each container the entry turns on.
2. For each hole, lists every source that is in the hole's `sources` and either offered by the container
   or `literal`. A known source counts once per literal name.
3. A `{ syntax }` source fills the hole with that other syntax. Its own holes take the container's
   default source if they allow it, otherwise the first source they allow. If the outer hole needs
   particular values, the other syntax's `inverse` turns each one into an input that produces it.
4. Writes one specimen for every combination of hole options and generic types.

`DIMENSIONS.md` shows how these lists multiply into a specimen count.

Each specimen folder is named
`<group>-<name>[-<container>][-<hole>-<source>][-<literal name>][-<generic type>]`:

- The container part is left out for `module-scope`.
- A hole adds `-<hole>-<source>` only when it had more than one option and did not use the container's
  default.
- A hole filled by another syntax always adds `-<hole>-<group>-<name>`, such as `-index-string-length`.
- A literal name is added when the hole has more than one.
- A generic type is added when the generic has more than one option.

The folder name repeats the group and name, so every specimen name is unique across the catalogue.

## Real generated output

These files come from a run of the current prototype.

### `src/syntax/array/at/array-at-function-params/array-at-function-params.ts`

```ts
export function arrayAtFunctionParams(chain: number[], index: number): number | undefined {
  return chain.at(index);
}
```

### `src/syntax/array/at/array-at-index-string-length/array-at-index-string-length.ts`

```ts
const stringLengthText = 'SomeText';
[10, 20, 30].at(stringLengthText.length);
```

### `src/syntax/array/at/array-at-function-params-chain-literal-index-array-length/array-at-function-params-chain-literal-index-array-length.ts`

```ts
export function arrayAtFunctionParamsChainLiteralIndexArrayLength(arrayLengthChain: number[]): number | undefined {
  return [10, 20, 30].at(arrayLengthChain.length);
}
```

### `src/syntax/control-flow/if-gt/control-flow-if-gt-function-literal-arg-below/control-flow-if-gt-function-literal-arg-below.ts`

```ts
function inner(value: number): string {
  if (value > 5) {
    return 'then';
  }
  return 'else';
}
export function controlFlowIfGtFunctionLiteralArgBelow(): string {
  return inner(3);
}
```

### `src/syntax/control-flow/if-opaque/control-flow-if-opaque-function-params/control-flow-if-opaque-function-params.ts`

```ts
function flag(): boolean {
  return Math.random() > 0.5;
}
export function controlFlowIfOpaqueFunctionParams(): string {
  if (flag()) {
    return 'then';
  }
  return 'else';
}
```

Each generated test runs Assayer on its specimen. It compares the functions, cases, lints and
admissions with the predicted values. It names an exit by line, through `exitOnLine(n)`, and looks up
the coverage ID Assayer gave that exit. The generator knows every line because it parses its own
finished output.
