# Layered specimens: the design

This is the design for rebuilding the specimen generator in `packages/specimen-generator`. It replaces the matrix model in `scrolls/specimen-generator/PLAN.md` ("The direction" and "Decisions") and in `scrolls/specimen-generator/CONTAINERS.md`. Those docs still hold the parts this design does not change: shims, stubs, callables, the backlog, and the findings about Assayer.

It was worked out with the user on 2026-10-10. A private review page shows the same content with highlighted code: https://claude.ai/code/artifact/c57474a5-95b3-4dc0-bc46-ffdfeb3ea28c. This file is the source of truth. The implementation plan lives in `plan/` beside it.

Every card below is a hand-written example of one specimen the generator must write, with everything Assayer should report for it. The generator must predict those reports from the piece declarations alone, never from running Assayer (rule P4).

Hand-written mockups of what the generator would write after the pivot. Nothing here is generated yet, and no test runs. Each card shows one specimen and everything Assayer should report for it. The generator would predict those reports from the piece declarations alone, never from running Assayer.

This version folds in an independent review against Assayer's core. Where Assayer behaves differently today, a card says so under "Today". The card's prediction is what Assayer should do, so a specimen like that fails until Assayer catches up.

## Decisions so far

| Question | Decision |
|---|---|
| `&&`, `\|\|`, `??` in a value position | They are branches. Their two arms meet again after the expression, like a value-position ternary. Every route lists each cause of an arm as its own case: for `x ?? 5`, a normal value, a falsy value and a missing value. |
| Is a default a branch? | Yes, for parameters and for destructuring. Its arms are "given" and "defaulted". Only `undefined` triggers it, not `null`. |
| Should Assayer pass a parameter that has a default? | Yes, in at least one case, including a parameter whose default is a ternary. The "given" route is real behavior any caller can reach. |
| Promise callbacks | A `.then` callback runs once, when the promise resolves. A `.catch` callback runs once, when it rejects. Their "runs" and "skipped" arms come from the promise's resolved and rejected arms, never from array size. A `.finally` callback runs on both arms, like a `try`'s `finally`. |
| Loops and shared mutable state | One mechanism solves both. Each piece records, for each arm, what must hold to enter it and what it writes. A parent combines its children's records to find the states it can reach. A loop repeats its body's record once per pass. A sequence of calls repeats a function's record once per call, so a module-level counter is a loop across calls. A case may make several calls in a row to reach a later state. Only a write Assayer cannot model, such as the result of an opaque call, leaves a branch undriven, and a named state is the human-written way into it. |
| "Declared but never read" | Assayer reports it, even where TypeScript or ESLint would too. A parameter, a local or an export that nothing reads is a lint: the repo's debt, on its own line. It fails the build by default, the same way a gap does. It rides the existing global `deadSurface` toggle (`off`, `warn`, `error`, default `error`), because it is the same kind of debt as a private function nothing calls. A value nobody reads owes no test, so a branch that only feeds it is not tested. |
| Edge values | Two parts. First, every type has a fixed list of edge values, such as `''`, `0`, `NaN`, `[]` and `null`, and Assayer always includes them as cases. Second, a lint family called "edge-value merge" reports when implicit coercion puts an edge value on the same arm as a different kind of value, and the type graph proves it. Each rule has its own global toggle, defaulting to `warn`, with no per-site waivers. |
| A cast from `unknown` | It stays a gap. Assayer builds inputs only from a parameter's declared type, and a cast never changes that. A harness supplies the value, or the author types the parameter properly. A cast is the author overruling the type checker, so tests built from it would only feed values that make the cast true. |
| `x!` | Assayer builds a parameter from its declared type. `count: number \| undefined` already includes `undefined`, so Assayer tries it. The `!` changes nothing Assayer builds, because a cast never changes a value. |
| `noUncheckedIndexedAccess` | The default is the smoke repo's tsconfig, which leaves it off. Assayer reads the flag, so turning it on is a value on a new compiler-options axis. Only pieces that index into an array cross that axis. |
| Two arguments feeding one check | The generator varies both leaves. This is an iterative shape: `count > limit` with both as parameters. |
| Which values are separate cases in "every route" | Every route lists one case per edge value of each leaf operand's type that lands on an arm, plus one ordinary value per arm. The edge values are the fixed list in "Edge values": `0`, `NaN` and a negative number for a number; `''` for a string; `false` for a boolean; `null` and `undefined` where the type allows them; an array empty, with one item and with many; each member of a union; each missing `?.` level; an unset environment variable. A value an edge-value-merge rule names, such as `'0'` for loose equality, is also a case. This matches the extra cases Assayer's core already adds per array size and per union member. Fewest runs is unchanged. |
| When is an arm unreachable? | Only when a known value proves it. A known value is a literal in code, a literal at a call site, or a value in a stub file, and it can sit several hops away from the branch, in another function or another file. Each file records, for every arm, what must hold to enter it, and that metadata merges upward through every consumer. Assayer flags the dead arm at the consumption point, where the known value enters, and shows the full path trace from that point down to the arm. Where no known value ever reaches a branch, nothing is flagged and every arm is assumed reachable. "No test input reached this arm" is never evidence. |
| How the generator predicts routes | The generator runs each rendered specimen with inputs and records which arms each input reaches. It derives an input for each arm from that arm's own condition, such as a string of 6 characters for `name.length > 5`, plus the edge values. It predicts an unreachable arm only when a known value in the specimen kills it, at the consumption point, with its trace. If it cannot derive an input that reaches an arm no known value kills, it refuses the specimen, naming the arm, the same way TypeScript refuses a file. Running the specimen does not break P4: the code under test is Assayer, and JavaScript decides which arm runs. |
| Derived stub values | The same arm conditions decide the stub values Assayer derives for each entry: one value that reaches every arm. That derived set is what a human reviews. A value such as a 6-character name is the hint that some code expects it. A correction that rules a value out becomes a known value, so the arm it fed is flagged dead at the consumption point. Cards with an object or environment parameter list the stub values Assayer derives. |
| Does "never read" apply to exports? | Yes, with one exception. An export is read when anything in the repo imports it, including another export further along a chain, or when the package's declared entry points reach it: what `package.json` `exports` or `main` name, and what those re-export. A published package's public API is therefore never flagged. Every other export that nothing reaches gets the never-read lint. The smoke repo's hand-written `package.json` declares the specimens as entry points, so a specimen's `entry` is never flagged. |
| `do…while` arms | Its body always runs once, so it has no `skipped` arm. Its arms are "repeats" and "stops", from its condition after each pass. |
| Matrix size | There is no cap. The matrix is meant to be combination-heavy, to shake out cases Assayer's unit tests miss. Every count or generate run reports the total, broken down per axis and per layer, so the user can watch it grow. |
| Running at scale | Generation and the generated test run both take machine capacity through lockdown-kit's load balancer (`@legendscribe/lockdown-kit-load-balancer`), the same lease and capacity system ward uses, so a heavy process already running slows them down instead of crashing the machine. Generation keeps a content-keyed cache, outside git, so adding a layer regenerates only what changed. Its output is still byte-identical to a fresh generation, because ward's `--check` compares against that. |
| Speed of the generated run | Not optimized in this design. The initial set is generated and run as it is, with no cap, under the load balancer. If the run takes too long, the user diagnoses the root cause after the initial set exists. |
| Which channel reports a dead arm | A literal in code or at a call site that kills an arm is an unreachable-exit lint, under the `deadSurface` toggle. A stub correction that kills an arm is a P1 build error, as it is today. Both are reported at the consumption point with a path trace. |
| Does a type count as a known value? | Yes, when every member of the type is a literal. A union such as `'a' \| 'b'` is a known set of values, so `if (mode)` on it has a provably dead else arm. A type with any non-literal member, such as `number` or `string`, is not known. |
| Named states | A separate feature, outside this design. Branches whose state Assayer cannot model stay undriven, and their admission says a named state will close them. |
| Containers the pieces table does not name | Dropped, including `iife` and `default-export`. The pieces table is the full list. |
| An import that cannot resolve | A P1 build error at the call site, never an admission, so its specimen predicts no undriven route. |
| A guard narrowing `unknown` | Driven, as the `retype/guard` card predicts. The generator derives inputs for each arm from the guard, and core needs a change to drive it. |
| Core gaps found while planning | In scope. A card's prediction is what Assayer should do, so every gap a card exposes gets a core phase. |
| Which value the other inputs take in an edge-value case | When a case sets one input to an edge value, every other input takes the first ordinary value that lets the edge-valued input be read, in the order most cards list their routes. That order puts an input's value for its then arm, or its first arm, before its value for its else arm: `count 3` before `count 2`, `enabled true` before `enabled false`. So in `optional-param/alone`, `label ''` pairs with `count 3`. |
| Do generated tests compare derived stub values? | Yes. A generated test compares the stub values Assayer derives with the generator's, not only the paths they sit at. |
| `try` arms | The reported arms are `finishes` and `catches`. Each point in `try` that can throw is a separate cause of `catches`, so each one is its own route. |
| Where a type known value is reported | At the parameter that declares the type. The path trace runs from that parameter to the dead arm. |
| Lint severity | Each lint takes the severity of its rule's default config. The smoke repo uses the default config, so a card's `warn` or `error` is what Assayer reports. |
| Leases on the load balancer | Generation and the generated run take leases with the load balancer's existing `'ward'` tool value. Lockdown-kit gets no new tool value. |
| Where a generated stub correction lives | At the root of the repo Assayer analyses, as root `CLAUDE.md` fixes: `assayer/stubs/objects/<definitionRelPath>/<TypeName>.json`. For the smoke repo that is `smoke-repo/assayer/stubs/objects/packages/syntax-repository/src/<folder>/entry.ts/<Type>.json`, so card `known/stub-correction`'s long path is right. The generator owns `smoke-repo/assayer/stubs/` exactly as it owns `src/`: a write clears and rewrites it, `--check` compares it, and the generation cache covers it. |
| `?.` arms | The reported arms stay `then` and `else`. `present` and `absent` are names the generator uses internally, and never appear in a report. |

Every open question on this page is now decided.

## The pieces

Every piece carries a tag that says where it can go: a statement slot, an expression slot, a parameter list or a loop head. Every slot says which tag it accepts, and which position it puts the piece in. The generator puts each piece in every slot that accepts its tag.

A piece's arms depend on its position. Assayer reads the same syntax three ways. In a condition, `a && b` is one branch whose condition has two leaves. As an exit, `return a && b` is one exit per arm. In a value position, a ternary is a branch whose arms meet again after it. A specimen's expected branches are the arms of every branching piece in it, read in its position.

| Piece | Goes in | Its slots, and the position each sets | Arms, by position | Axes it crosses |
|---|---|---|---|---|
| `const`, `let` | statement, loop head | value: value | none | routes, consumption |
| reassignment `x = …` | statement | value: value | none | routes |
| `??=`, `\|\|=`, `&&=` | statement | value: value | kept, assigned. Today Assayer stops following the variable after one | type |
| `+=` and other compound assignments | statement | value: value | none. Today Assayer stops following the variable after one | shared state |
| parameter | parameter list | default: value, optional | with a default: given, defaulted. Assayer passes it in at least one case | type, wrapper, source |
| optional `?` and rest `...` parameters | parameter list | none | none. A call that leaves them out is complete | none |
| destructuring, object or array | statement, parameter list, loop head | each default: value | with a default: present, defaulted | wrapper |
| comparison: `===`, `>`, `!` | expression | operands: value | none. In a condition each one is a leaf | type |
| ternary `a ? b : c` | expression | condition: condition. then, else: the ternary's own position | exit: one exit per arm. value: then, else, meeting again after | position, type |
| `&&`, `\|\|` | expression | left: condition. right: the operator's own position | condition: no branch, two leaves. exit: one exit per arm. value: stops at left, evaluates right, meeting again after | position, type |
| `??` | expression | left, right: the operator's own position | condition: a non-nullish leaf. exit: one exit per arm. value: left, right, meeting again after | position, type |
| `?.`, one level | expression | receiver: value | condition: a non-nullish leaf. exit: one exit per arm | position, wrapper |
| `a?.b?.c`, `fn?.()`, `a?.[0]` | expression | receiver: value | the same as one level. Today Assayer splits only a single-level `a?.b` | wrapper |
| reach-in: `.x`, `[0]`, a getter read | expression | receiver: value | none | wrapper, array size |
| retyping: `as`, `!`, `as const`, `satisfies` | expression | operand: value | none. It changes the type, never the value | none |
| type check: `typeof`, `instanceof`, `in`, a guard | expression | operand: value | none. A leaf whose arms take different union members | type |
| template literal | expression | parts: value | none. Today it ends Assayer's env chain | source |
| a call | expression | arguments: value | none. A same-file callee's branches are followed through it | file boundary, consumption |
| recursion | a call | arguments: value | none. Following a function that calls itself must stop somewhere | none |
| object literal | expression | property values: value. Method bodies: statement | none | level |
| array literal | expression | elements: value | none | level |
| arrow function, function expression | expression | parameters: parameter list. Body: statement, or one exit | none | level, exit kind |
| array callback: `.map`, `.filter`, `.forEach` | expression | callback: an arrow function | skipped, runs, from array size | array size |
| promise callback: `.then`, `.catch`, `.finally` | expression | callback: an arrow function | `.then` runs once if the promise resolves, else skipped. `.catch` runs once if it rejects, else skipped. `.finally` runs on both, like a try's finally | exit kind |
| returned closure | expression in an exit | body: statement | none. An outside caller sets its parameters, so its branches are undriven | none |
| function declaration | statement | parameters: parameter list. Body: statement | none | level, exit kind |
| async function, including an async arrow | statement, or expression for an async arrow | parameters: parameter list. Body: statement, or one exit | none. Each exit resolves the promise it returns, and each throw rejects it | level, exit kind |
| generator function `function*` | statement | parameters: parameter list. Body: statement. Each `yield` operand: value | none. A `yield` is a value position, so a branch in it meets again after it | level, exit kind |
| class | statement | fields: value. Constructor, methods, getter, setter, static members: statement | none | level, shared state |
| `if` | statement | condition: condition. then, else: statement | then, else | iteratives |
| `switch` | statement | subject: condition. Each case: statement | one per case. With no default: a no-match arm. Labels that fall through share one arm | type, iteratives |
| `for`, `for…of`, `for…in`, `while` | statement | head: loop head or condition. Body: statement | skipped, runs. A dark spot today | array size, iteratives |
| `do…while` | statement | body: statement. Condition: condition | repeats, stops. No skipped arm, because the body always runs once. A dark spot today | iteratives |
| `break`, `continue`, labelled break, `return` in a loop | statement | none | none. Each is a way out of a loop body | none |
| `try…catch…finally` | statement | try, catch, finally: statement | finishes, plus one arm per point in try that can throw. A return in finally overrides the others. A dark spot today | iteratives |
| `new Promise(...)` | expression | executor body: statement | none. resolve and reject are its exits | exit kind |
| `await` | expression | operand: value | none. A point that can throw | exit kind |
| `return`, `throw` | statement | value: exit | none. Each is a way out | exit kind |
| module | the root | top level: statement | none | source |

## How the matrix is built

1. The generator puts each piece in every slot whose tag it matches, up to 2 levels deep. A piece's level is the number of pieces holding it, whether a holder is a container such as an `if` or an expression such as a ternary. Neither the module nor the entry itself counts as a holder: the entry is the exported arrow function, function or class a test reaches. So a `const` directly in the entry's body is level 0, a `const` inside an `if` in that body is level 1, and the innermost of three nested ternaries is level 2. Objects and arrays go to level 3, both as literals and as the types a parameter is built from, because real data nests that deep.
2. Every slot sets one of four positions. A statement slot holds a whole statement. A condition slot is read for true or false. An exit slot is where a value leaves the function. A value slot passes the value on into the code around it. A piece declares its arms for each position it can take.
3. Each specimen varies one thing. Every other position takes the plainest choice. The plainest container is an exported arrow function, the plainest source is a parameter, and the plainest expression is a bare read of that parameter.
4. Each piece declares which axes change its behavior. The matrix crosses a piece with an axis only when the piece declares it. Every other axis stays at its default. So the matrix grows by the sum of the axes, not their product.
5. A piece that never branches, such as `const`, gets the plainest reader after it: an `if` that reads its value. The reader must read a value Assayer can follow. It never reads a loop counter.
6. Every card predicts every report channel: branches and routes, lints, undriven admissions, dark spots, gaps and P1 build errors. The same specimen with a harness file or a stub correction beside it is a variant on its own axis.
7. Objects and arrays hold expressions only. A statement such as `if` reaches them only inside a function they hold.
8. Where Assayer behaves differently today, the card's prediction is still what Assayer should do. The "Today" line records the gap, so the specimen is the regression test for closing it.
9. Each piece records, for each arm, what must hold to enter it and what it writes. A parent combines those records to find the states it can reach. The next section shows how.

## How a parent finds its states

A piece never works out its routes alone. It records two things for each arm: what must hold to enter it, and what it writes. Its parent combines those records with its own.

1. Pieces in a row: the parent carries each piece's writes forward into the next piece's entry conditions.
2. A nested piece: the parent adds its own arm's condition to everything inside that arm.
3. A loop: the parent repeats the body's record once per pass. After pass k, a variable that starts at 0 and gains 1 per pass holds k.
4. A sequence of calls: the same as a loop. Each call is one pass over the function's record, so module-level and `this` state work like loop variables.
5. A route is a combination of arms whose conditions can all hold together. A combination that contradicts itself is dropped.
6. When a write cannot be modelled, such as a value from an opaque call, the branches that read it stay undriven. A named state, written by a human under `assayer/states/`, is the way into them.

#### `loop · a counter reaches a branch`

Folder: `src/state/loop-counter`

```ts
export const entry = (limit: number): number => {
  let count = 0;
  while (count < limit) {
    if (count === 3) {
      break;
    }
    count += 1;
  }
  return count;
};
```

- **Expected branches:** `while` (skipped, runs); `if` (then (break), else)
- **What each piece records:**
  - `while`: runs a pass while count < limit
  - `if`: then when count === 3
  - `count += 1`: writes count: 0, then one more per pass
- **Every route (5):**
  - `limit 0`: skipped
  - `limit NaN`: skipped
  - `limit -1`: skipped
  - `limit 2`: runs: else, else
  - `limit 5`: runs: else, else, else, then
- **Fewest runs:** 2
- **Note:** The loop combines its children. On pass k, count is k. So the then arm needs a pass where count is 3, and that pass happens only when limit is above 3.
- **Today:** The loop is a dark spot, and Assayer does not follow a variable written inside a loop.

#### `calls in a row · a module counter`

Folder: `src/state/call-sequence`

```ts
let calls = 0;

export const entry = (limit: number): string => {
  calls += 1;
  if (calls > limit) {
    return 'over';
  }
  return 'under';
};
```

- **Expected branches:** `if` (then, else)
- **What each piece records:**
  - `calls += 1`: writes calls: 0 at module load, then one more per call
  - `if`: then when calls > limit
- **Every route (5):**
  - `limit 0, 1 call`: then
  - `limit NaN, 1 call`: else
  - `limit -1, 1 call`: then
  - `limit 1, 1 call`: else
  - `limit 1, 2 calls`: else, then
- **Fewest runs:** 1
- **Note:** Each call is one pass of a loop whose parent is the case. Most routes need one call. The last makes two calls in a row to reach the later state. That case takes both arms, so it alone covers every arm. calls > NaN is always false, so limit NaN takes else on every call. Each case starts from a freshly loaded module.
- **Today:** Assayer stops following calls after the compound assignment, so the if is undriven.

#### `loop · a sum reaches a branch`

Folder: `src/state/loop-sum`

```ts
export const entry = (items: number[]): string => {
  let total = 0;
  for (const item of items) {
    total += item;
  }
  if (total > 10) {
    return 'big';
  }
  return 'small';
};
```

- **Expected branches:** `for…of` (skipped, runs); `if` (then, else)
- **What each piece records:**
  - `for…of`: runs one pass per item
  - `total += item`: writes total: 0, then the sum of the items so far
  - `if`: then when total > 10
- **Every route (7):**
  - `items []`: skipped, else
  - `items [10]`: runs, else
  - `items [0]`: runs, else
  - `items [NaN]`: runs, else
  - `items [-1]`: runs, else
  - `items [11]`: runs, then
  - `items [5, 6]`: runs, then
- **Fewest runs:** 2
- **Note:** The if sits after the loop, so it reads the loop's final write. Assayer picks item values so the sum lands on each side of 10. A NaN item makes the sum NaN, and NaN > 10 is false.
- **Today:** The loop is a dark spot, and Assayer does not follow a variable written inside a loop.

## Which axes each piece crosses

This is what keeps the matrix small. A piece only meets the axes that change what Assayer must do with it. A `===` never meets array size. A loop never meets type.

| Axis | Default | What varies | Pieces that cross it |
|---|---|---|---|
| Position | statement, or exit for an expression | condition, exit, value | ternary, `&&`, `\|\|`, `??`, `?.` |
| Level | level 0, directly in a plain arrow function's body | level 0 to level 2, through every slot that fits, counting expressions that hold expressions. Objects and arrays go to level 3 | every piece |
| Iteratives | one branch | nested or in a row, shared or separate arguments, 1 to 3 arguments, an unused argument | every branching piece |
| Routes | read directly | const, let, destructuring, a stored ternary, a same-file call | bindings, and anything read through one |
| Type | the piece's own default | `number`, `boolean`, `string`, literal unions, enums | truthiness, `!`, `===`, `>`, `??`, `switch`, type checks |
| Nullability | never missing | optional `?`, `\| undefined`, `\| null`, both, an optional property | parameters, `??`, `?.`, defaults, truthiness, equality checks |
| Wrapper | plain | array, object, optional object, nested object, array of objects, class instance | reach-in pieces, destructuring, parameters |
| Array size | empty, one, many | Assayer already builds all three for every array parameter | loops, callbacks, `[0]`, `.length` |
| Exit kind | `return` a string | literal union, promise, void with a side effect, throw | containers with a body |
| File boundary | same file | sibling import, barrel, package, builtin, unresolvable | calls, type references |
| Consumption | returned | stored then returned, passed to a call, compared, never read | bindings, calls |
| Compiler options | the smoke repo's tsconfig | `noUncheckedIndexedAccess` on, `exactOptionalPropertyTypes` on | reach-in by index, optional properties |
| Source | parameter | literal, const, env at module load, env in a function, argv, random, prop | every leaf |
| Companion files | none | a harness file, a stub correction | specimens with a gap or an object parameter |

## Position: condition, exit or value

The same operator in three positions gives three different reports. This is why arms belong to the piece and its position together.

#### `arrow › if.condition › &&`

Folder: `src/and/as-condition`

```ts
export const entry = (ready: boolean, count: number): string => {
  if (ready && count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (6):**
  - `ready false`: else
  - `ready true, count 2`: else
  - `ready true, count 0`: else
  - `ready true, count NaN`: else
  - `ready true, count -1`: else
  - `ready true, count 3`: then
- **Fewest runs:** 2
- **Note:** In a condition, && adds no branch. It splits the if's condition into two leaves. Every route lists each short-circuit cause and each edge value of count as its own case. Five of them take the else arm, so fewest runs keeps one.

#### `arrow › exit › &&`

Folder: `src/and/as-exit`

```ts
export const entry = (ready: boolean, count: number): boolean => ready && count > 2;
```

- **Expected branches:** `&& exit` (stops at left, evaluates right)
- **Every route (6):**
  - `ready false`: stops at left
  - `ready true, count 3`: evaluates right
  - `ready true, count 2`: evaluates right
  - `ready true, count 0`: evaluates right
  - `ready true, count NaN`: evaluates right
  - `ready true, count -1`: evaluates right
- **Fewest runs:** 2
- **Note:** As an exit, each arm of && is its own exit. The same operator, read a second way. count only matters once ready is true, so each value of count is a case on the evaluates right arm.

#### `arrow › call argument › ternary`

Folder: `src/ternary/as-value`

```ts
export const entry = (count: number): string[] => {
  const seen: string[] = [];
  seen.push(count > 2 ? 'big' : 'small');
  return seen;
};
```

- **Expected branches:** `ternary` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** In a value position the ternary is a branch whose arms meet again at the push. The function still has one exit.

#### `arrow › call argument › &&`

Folder: `src/and/as-value`

```ts
export const entry = (ready: boolean, count: number): string => {
  console.log(ready && count > 2);
  return 'done';
};
```

- **Expected branches:** `&& value` (stops at left, evaluates right)
- **Every route (6):**
  - `ready false`: stops at left
  - `ready true, count 3`: evaluates right
  - `ready true, count 2`: evaluates right
  - `ready true, count 0`: evaluates right
  - `ready true, count NaN`: evaluates right
  - `ready true, count -1`: evaluates right
- **Fewest runs:** 2
- **Note:** In a value position && is a branch whose arms meet again at console.log, like a value-position ternary. The function still has one exit.
- **Today:** Assayer reads only a ternary as a value-position branch. This && is not a branch.

### A ternary in every exit slot

Every container with a body has exit slots, and the generator puts a ternary in each one. An exit ternary splits into one exit per arm. A `yield` looks like an exit but is a value position: the generator keeps running after it, so its two arms meet again.

#### `function declaration › return › ternary`

Folder: `src/ternary/exit/function-return`

```ts
export function entry(count: number): string {
  return count > 2 ? 'big' : 'small';
}
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: exits big
  - `count 2`: exits small
  - `count 0`: exits small
  - `count NaN`: exits small
  - `count -1`: exits small
- **Fewest runs:** 2
- **Note:** The return holds the ternary, so each arm is its own exit.

#### `arrow, concise body › ternary`

Folder: `src/ternary/exit/concise-body`

```ts
export const entry = (count: number): string => (count > 2 ? 'big' : 'small');
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: exits big
  - `count 2`: exits small
  - `count 0`: exits small
  - `count NaN`: exits small
  - `count -1`: exits small
- **Fewest runs:** 2
- **Note:** A concise body is an exit with no return keyword. Assayer splits it the same way.

#### `class getter › return › ternary`

Folder: `src/ternary/exit/getter-return`

```ts
export class Entry {
  public constructor(private readonly count: number) {}

  public get label(): string {
    return this.count > 2 ? 'big' : 'small';
  }
}
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `new Entry(3), read label`: exits big
  - `new Entry(2), read label`: exits small
  - `new Entry(0), read label`: exits small
  - `new Entry(NaN), read label`: exits small
  - `new Entry(-1), read label`: exits small
- **Fewest runs:** 2
- **Note:** A test constructs Entry, then reads label. The value reaches the getter through a constructor parameter.

#### `async function › return › ternary`

Folder: `src/ternary/exit/async-return`

```ts
export async function entry(count: number): Promise<string> {
  return count > 2 ? 'big' : 'small';
}
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: resolves big
  - `count 2`: resolves small
  - `count 0`: resolves small
  - `count NaN`: resolves small
  - `count -1`: resolves small
- **Fewest runs:** 2
- **Note:** Each exit is a resolved promise. A test awaits the call.

#### `function › throw › ternary`

Folder: `src/ternary/exit/throw`

```ts
export function entry(count: number): number {
  if (count >= 0 && count <= 100) {
    return count;
  }
  throw count < 0 ? new RangeError('below 0') : new RangeError('above 100');
}
```

- **Expected branches:** `if` (then, else); `ternary exit (throw)` (then, else)
- **Every route (5):**
  - `count 50`: if then, returns
  - `count 0`: if then, returns
  - `count -1`: if else, throws below 0
  - `count 101`: if else, throws above 100
  - `count NaN`: if else, throws above 100
- **Fewest runs:** 3
- **Note:** A throw is an exit slot too, so the ternary splits into two throwing exits. The && sits in a condition, so it is two leaves of the if, not a branch. NaN fails both checks, and NaN < 0 is false, so count NaN throws above 100.

#### `generator › yield › ternary`

Folder: `src/ternary/exit/yield`

```ts
export function* entry(count: number): Generator<string> {
  yield count > 2 ? 'big' : 'small';
  yield 'done';
}
```

- **Expected branches:** `ternary` (then, else)
- **Every route (5):**
  - `count 3`: yields 'big', then 'done'
  - `count 2`: yields 'small', then 'done'
  - `count 0`: yields 'small', then 'done'
  - `count NaN`: yields 'small', then 'done'
  - `count -1`: yields 'small', then 'done'
- **Fewest runs:** 2
- **Note:** A yield is a value position, not an exit. The generator keeps running, so both arms meet again at the second yield. A test iterates the generator to the end.

#### `function › if.then › return › ternary`

Folder: `src/ternary/exit/inside-if`

```ts
export function entry(count: number, ready: boolean): string {
  if (ready) {
    return count > 2 ? 'big' : 'small';
  }
  return 'waiting';
}
```

- **Expected branches:** `if` (then, else); `ternary exit` (then, else)
- **Every route (6):**
  - `ready false`: exits waiting
  - `ready true, count 3`: exits big
  - `ready true, count 2`: exits small
  - `ready true, count 0`: exits small
  - `ready true, count NaN`: exits small
  - `ready true, count -1`: exits small
- **Fewest runs:** 3
- **Note:** The function has three exits: waiting, and one for each ternary arm. The ternary only runs on the if's then arm.

## Each piece alone

Each piece sits in the plainest container and reads a parameter.

#### `arrow › if`

Folder: `src/if/alone`

```ts
export const entry = (flag: boolean): string => {
  if (flag) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (2):**
  - `flag true`: then
  - `flag false`: else
- **Fewest runs:** 2

#### `arrow › switch`

Folder: `src/switch/alone`

```ts
export const entry = (mode: 'a' | 'b'): string => {
  switch (mode) {
    case 'a':
      return 'first';
    default:
      return 'other';
  }
};
```

- **Expected branches:** `switch` (case 'a', default)
- **Every route (2):**
  - `mode 'a'`: case 'a'
  - `mode 'b'`: default
- **Fewest runs:** 2

#### `arrow › switch with no default`

Folder: `src/switch/no-default`

```ts
export const entry = (mode: 'a' | 'b' | 'c'): string => {
  switch (mode) {
    case 'a':
      return 'first';
    case 'b':
      return 'second';
  }
  return 'none';
};
```

- **Expected branches:** `switch` (case 'a', case 'b', no match)
- **Every route (3):**
  - `mode 'a'`: case 'a'
  - `mode 'b'`: case 'b'
  - `mode 'c'`: no match
- **Fewest runs:** 3
- **Note:** The no-match arm has no label of its own. It is the route where mode is 'c'.

#### `arrow › switch that falls through`

Folder: `src/switch/fallthrough`

```ts
export const entry = (mode: 'a' | 'b' | 'c'): string => {
  switch (mode) {
    case 'a':
    case 'b':
      return 'early';
    default:
      return 'late';
  }
};
```

- **Expected branches:** `switch` (case 'a' or 'b', default)
- **Every route (3):**
  - `mode 'a'`: case 'a' or 'b'
  - `mode 'b'`: case 'a' or 'b'
  - `mode 'c'`: default
- **Fewest runs:** 2
- **Note:** Two labels share one arm. Both values reach the same exit.

#### `arrow › ternary`

Folder: `src/ternary/alone`

```ts
export const entry = (flag: boolean): string => (flag ? 'then' : 'else');
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (2):**
  - `flag true`: then
  - `flag false`: else
- **Fewest runs:** 2

#### `arrow › ??`

Folder: `src/nullish/alone`

```ts
export const entry = (name: string | undefined): string => name ?? 'anon';
```

- **Expected branches:** `?? exit` (left, right)
- **Every route (3):**
  - `name 'x'`: left
  - `name ''`: left
  - `name undefined`: right
- **Fewest runs:** 2

#### `arrow › ===`

Folder: `src/eq/alone`

```ts
export const entry = (count: number): boolean => count === 7;
```

- **Expected branches:** none
- **Every route (5):**
  - `count 7`: returns true
  - `count 8`: returns false
  - `count 0`: returns false
  - `count NaN`: returns false
  - `count -1`: returns false
- **Fewest runs:** 2
- **Note:** A comparison is not a branch. Assayer still counts a returned comparison's true and false results as two arms, return-true and return-false, so a test checks both.

#### `arrow › default parameter`

Folder: `src/default-param/alone`

```ts
export const entry = (count: number = 7): number => count;
```

- **Expected branches:** `default parameter` (given, defaulted)
- **Every route (5):**
  - `count 3`: given
  - `count 0`: given
  - `count NaN`: given
  - `count -1`: given
  - `count left out`: defaulted
- **Fewest runs:** 2
- **Note:** A default is the same logic as count === undefined ? 7 : count. Only undefined triggers it, not null.
- **Today:** Assayer does not report a default as a branch.

#### `arrow › optional parameter`

Folder: `src/optional-param/alone`

```ts
export const entry = (count: number, label?: string): string => {
  if (label) {
    return label;
  }
  return count > 2 ? 'big' : 'small';
};
```

- **Expected branches:** `if` (then, else); `ternary exit` (then, else)
- **Other expected reports:** lint, warn: edge-value merge (truthiness): label '' takes the else arm, the same arm as label left out
- **Every route (7):**
  - `label 'x'`: if then
  - `label '', count 3`: if else, ternary then
  - `label left out, count 3`: if else, ternary then
  - `label left out, count 2`: if else, ternary else
  - `label left out, count 0`: if else, ternary else
  - `label left out, count NaN`: if else, ternary else
  - `label left out, count -1`: if else, ternary else
- **Fewest runs:** 3
- **Note:** A call that leaves label out is complete. Assayer never reports a missing input for it.

#### `arrow › ??=`

Folder: `src/nullish-assign/alone`

```ts
export const entry = (name: string | undefined): string => {
  let label = name;
  label ??= 'anon';
  if (label === 'anon') {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `??=` (kept, assigned); `if` (then, else)
- **Every route (4):**
  - `name undefined`: assigned, then
  - `name 'x'`: kept, else
  - `name ''`: kept, else
  - `name 'anon'`: kept, then
- **Fewest runs:** 2
- **Note:** assigned always leads to then, so assigned, else never happens. name '' stays on kept, because ??= only replaces undefined.
- **Today:** Assayer stops following a variable after a compound assignment, so the if is undriven.

#### `arrow › try…catch`

Folder: `src/try/alone`

```ts
const checkLow = (count: number): void => {
  if (count < 0) {
    throw new Error('count must be 0 or more');
  }
};

const checkHigh = (count: number): void => {
  if (count > 100) {
    throw new Error('count must be 100 or less');
  }
};

export const entry = (count: number): string => {
  try {
    checkLow(count);
    checkHigh(count);
    return 'ok';
  } catch {
    return 'failed';
  }
};
```

- **Expected branches:** `checkLow if` (then, else); `checkHigh if` (then, else); `try` (finishes, catches)
- **Every route (5):**
  - `count 50`: finishes
  - `count 0`: finishes
  - `count NaN`: finishes
  - `count -1`: checkLow throws, catches
  - `count 101`: checkHigh throws, catches
- **Fewest runs:** 3
- **Note:** Two calls in try can throw, so there are 3 arm combinations, not 2: one per throw point, plus finishing. NaN < 0 and NaN > 100 are both false, so count NaN finishes. A return in finally would override all of them.
- **Today:** try is a dark spot.

#### `arrow › new Promise › if`

Folder: `src/promise/alone`

```ts
export const entry = (count: number): Promise<string> =>
  new Promise((resolve, reject) => {
    if (count > 2) {
      resolve('big');
      return;
    }
    reject(new Error('too small'));
  });
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then, resolves
  - `count 2`: else, rejects
  - `count 0`: else, rejects
  - `count NaN`: else, rejects
  - `count -1`: else, rejects
- **Fewest runs:** 2
- **Note:** The executor is a container, like a function body. resolve and reject are its two exits, so a test expects a resolved value on one arm and a rejection on the other.

## One piece inside another

An expression inside an expression, inside a binding, or inside a container's block.

#### `arrow › if.condition › > › ??`

Folder: `src/nullish/in/if-condition/gt`

```ts
export const entry = (count: number | undefined): string => {
  if ((count ?? 0) > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (6):**
  - `count undefined`: else
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The ?? sits inside a condition, so it is a leaf of the if, not a branch of its own. The fallback 0 is a literal, so Assayer evaluates it instead of reading it as a leaf.

#### `arrow › default parameter › ternary`

Folder: `src/ternary/in/default-param`

```ts
export const entry = (count: number, label: string = count > 2 ? 'big' : 'small'): string => label;
```

- **Expected branches:** `default parameter` (given, defaulted); `ternary` (then, else)
- **Every route (7):**
  - `label 'x'`: given
  - `label ''`: given
  - `label left out, count 3`: defaulted, ternary then
  - `label left out, count 2`: defaulted, ternary else
  - `label left out, count 0`: defaulted, ternary else
  - `label left out, count NaN`: defaulted, ternary else
  - `label left out, count -1`: defaulted, ternary else
- **Fewest runs:** 3
- **Note:** The ternary only runs on the defaulted arm, so there are 3 arm combinations, not 4.
- **Today:** Assayer never passes a parameter whose default is a ternary, so the given route has no test.

#### `arrow › if.then › ternary`

Folder: `src/ternary/in/if-then`

```ts
export const entry = (count: number, big: boolean): string => {
  if (big) {
    return count > 2 ? 'huge' : 'big';
  }
  return 'small';
};
```

- **Expected branches:** `if` (then, else); `ternary exit` (then, else)
- **Every route (6):**
  - `big false`: if else
  - `big true, count 3`: if then, ternary then
  - `big true, count 2`: if then, ternary else
  - `big true, count 0`: if then, ternary else
  - `big true, count NaN`: if then, ternary else
  - `big true, count -1`: if then, ternary else
- **Fewest runs:** 3
- **Note:** The ternary only runs on the if's then arm, so there are 3 arm combinations.

## Ternaries inside ternaries

A ternary has three slots: its condition, its `then` and its `else`. Each accepts an expression, so a ternary can sit in any of them. Where the inner ternary sits decides the routes. The iteratives apply here too: the same argument or different ones, and nested or one after another.

#### `ternary.else › ternary.else › ternary · 1 arg` (level 2)

Folder: `src/ternary/in/ternary-else/ternary-else`

```ts
export const entry = (count: number): string =>
  count > 10 ? 'huge' : count > 5 ? 'big' : count > 2 ? 'medium' : 'small';
```

- **Expected branches:** `count > 10` (then, else); `count > 5` (then, else); `count > 2` (then, else)
- **Every route (7):**
  - `count 11`: huge
  - `count 6`: big
  - `count 3`: medium
  - `count 2`: small
  - `count 0`: small
  - `count NaN`: small
  - `count -1`: small
- **Fewest runs:** 4
- **Note:** An else-if chain. Each inner ternary only runs on the else arm of the one before it, so there are 4 arm combinations, not 8. Each combination reaches its own exit, so fewest runs needs one case from each.

#### `ternary.then › ternary.then › ternary · 3 args` (level 2)

Folder: `src/ternary/in/ternary-then/ternary-then`

```ts
export const entry = (a: boolean, b: boolean, c: boolean): string =>
  a ? (b ? (c ? 'abc' : 'ab') : 'a') : 'none';
```

- **Expected branches:** `a` (then, else); `b` (then, else); `c` (then, else)
- **Every route (4):**
  - `a false`: none
  - `a true, b false`: a
  - `a true, b true, c false`: ab
  - `a true, b true, c true`: abc
- **Fewest runs:** 4
- **Note:** The same shape as three nested ifs. Each inner ternary only runs on the then arm of the one around it.

#### `ternary.then › ternary · 2 args` (level 1)

Folder: `src/ternary/in/ternary-then`

```ts
export const entry = (ready: boolean, count: number): string =>
  ready ? (count > 2 ? 'big' : 'small') : 'waiting';
```

- **Expected branches:** `ready` (then, else); `count > 2` (then, else)
- **Every route (6):**
  - `ready false`: waiting
  - `ready true, count 3`: big
  - `ready true, count 2`: small
  - `ready true, count 0`: small
  - `ready true, count NaN`: small
  - `ready true, count -1`: small
- **Fewest runs:** 3

#### `ternary.condition › ternary · 2 args` (level 1)

Folder: `src/ternary/in/ternary-condition`

```ts
export const entry = (strict: boolean, count: number): string =>
  (strict ? count > 5 : count > 2) ? 'pass' : 'fail';
```

- **Expected branches:** `strict (inner)` (then, else); `outer` (then, else)
- **Every route (7):**
  - `strict true, count 6`: inner then, pass
  - `strict true, count 5`: inner then, fail
  - `strict true, count 0`: inner then, fail
  - `strict true, count NaN`: inner then, fail
  - `strict true, count -1`: inner then, fail
  - `strict false, count 3`: inner else, pass
  - `strict false, count 2`: inner else, fail
- **Fewest runs:** 2
- **Note:** The inner ternary picks which check the outer one tests. It sits in a condition, so it is a value-position branch whose arms meet again at the outer condition. Every mix can happen, so there are 4 arm combinations. Two runs take all 4 arms.

#### `ternary, then ternary · in a row` (level 1)

Folder: `src/ternary/sequence`

```ts
export const entry = (count: number, loud: boolean): string => {
  const size = count > 2 ? 'big' : 'small';
  const volume = loud ? '!' : '.';
  return size + volume;
};
```

- **Expected branches:** `size ternary` (then, else); `volume ternary` (then, else)
- **Every route (7):**
  - `count 3, loud true`: then, then
  - `count 3, loud false`: then, else
  - `count 2, loud true`: else, then
  - `count 0, loud true`: else, then
  - `count NaN, loud true`: else, then
  - `count -1, loud true`: else, then
  - `count 2, loud false`: else, else
- **Fewest runs:** 2
- **Note:** Two ternaries side by side, each in a value position. They do not depend on each other, so there are 4 arm combinations.

## One piece everywhere it fits: `const`

`const` goes in any statement slot and in a `for…of` head. Level 0 is directly in the module or in the entry's own body. A method body is a slot of its class or object, not a piece of its own, so a method of an entry class counts as the entry's own body. Level 1 puts it inside one more piece, such as an `if` or a `for…of`. Level 2 puts it two pieces deep. Level 3 is allowed only when one of its holders is an object or an array. The last three cards go the other way: they fill the `const`'s own slot.

#### `module › const` (level 0)

Folder: `src/const/in/module`

```ts
const size = Number(process.env.SIZE);

if (size > 2) {
  console.log('then');
}

export {};
```

- **Expected branches:** `if` (then, else)
- **Every route (6):**
  - `SIZE '3'`: then
  - `SIZE '2'`: else
  - `SIZE '0'`: else
  - `SIZE '-1'`: else
  - `SIZE ''`: else
  - `SIZE unset`: else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `SIZE`: `'3'` for then, `'2'` for else
- **Note:** The top level has no parameter, so the plainest source a test can set is an environment variable read at module load. An unset SIZE gives Number(undefined), which is NaN, so it stands for the NaN edge value. SIZE '' gives 0.

#### `arrow › const` (level 0)

Folder: `src/const/in/arrow-body`

```ts
export const entry = (count: number): string => {
  const size = count;
  if (size > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The if is the plainest reader. It gives the specimen a branch to observe.

#### `class › method › const` (level 0)

Folder: `src/const/in/class-method`

```ts
export class Entry {
  public run(count: number): string {
    const size = count;
    if (size > 2) {
      return 'then';
    }
    return 'else';
  }
}
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The class is the entry, and a method body is a slot of the class, not a piece of its own. So the const has no holder and sits at level 0, the same as a const directly in an arrow entry's body.

#### `arrow › if.then › const` (level 1)

Folder: `src/const/in/if-then`

```ts
export const entry = (count: number, enabled: boolean): string => {
  if (enabled) {
    const size = count;
    if (size > 2) {
      return 'then';
    }
  }
  return 'else';
};
```

- **Expected branches:** `if (enabled)` (then, else); `if (size > 2)` (then, else)
- **Every route (6):**
  - `enabled false`: outer else
  - `enabled true, count 3`: then, then
  - `enabled true, count 2`: then, else
  - `enabled true, count 0`: then, else
  - `enabled true, count NaN`: then, else
  - `enabled true, count -1`: then, else
- **Fewest runs:** 3
- **Note:** The reader only runs on the outer then arm, so there are 3 arm combinations, not 4. The iteratives section has the version with 4.

#### `arrow › for…of.body › const` (level 1)

Folder: `src/const/in/for-of-body`

```ts
export const entry = (count: number, items: number[]): number => {
  let total = 0;
  for (const item of items) {
    const size = count;
    if (size > 2) {
      total += item;
    }
  }
  return total;
};
```

- **Expected branches:** `for…of` (skipped, runs); `if` (then, else)
- **Every route (7):**
  - `items []`: skipped
  - `items [1], count 2`: runs, else
  - `items [1], count 0`: runs, else
  - `items [1], count NaN`: runs, else
  - `items [1], count -1`: runs, else
  - `items [1], count 3`: runs, then
  - `items [1, 2], count 3`: runs, then
- **Fewest runs:** 3
- **Note:** The reader reads count through the const, never the loop item. So this card tests where a const can go, not loop reasoning. No branch reads item, so the items cases vary only the array size.
- **Today:** The loop is a dark spot, and Assayer does not follow a variable written inside a loop.

#### `arrow › for…of.head › const` (level 1)

Folder: `src/const/in/for-of-head`

```ts
export const entry = (items: number[]): number => {
  let total = 0;
  for (const item of items) {
    if (item > 2) {
      total += item;
    }
  }
  return total;
};
```

- **Expected branches:** `for…of` (skipped, runs); `if` (then, else)
- **Every route (7):**
  - `items []`: skipped
  - `items [2]`: runs, else
  - `items [0]`: runs, else
  - `items [NaN]`: runs, else
  - `items [-1]`: runs, else
  - `items [3]`: runs, then
  - `items [2, 3]`: runs, else and then
- **Fewest runs:** 2
- **Note:** Here the const is the loop head itself. Its value comes from each element, so this card belongs with loops: with many items, one run takes both if arms.
- **Today:** The loop is a dark spot.

#### `arrow › switch.case › const` (level 1)

Folder: `src/const/in/switch-case`

```ts
export const entry = (mode: 'a' | 'b', count: number): string => {
  switch (mode) {
    case 'a': {
      const size = count;
      if (size > 2) {
        return 'then';
      }
      return 'else';
    }
    default:
      return 'other';
  }
};
```

- **Expected branches:** `switch` (case 'a', default); `if` (then, else)
- **Every route (6):**
  - `mode 'b'`: default
  - `mode 'a', count 3`: case 'a', then
  - `mode 'a', count 2`: case 'a', else
  - `mode 'a', count 0`: case 'a', else
  - `mode 'a', count NaN`: case 'a', else
  - `mode 'a', count -1`: case 'a', else
- **Fewest runs:** 3

#### `arrow › for…of.body › if.then › const` (level 2)

Folder: `src/const/in/for-of-body/if-then`

```ts
export const entry = (count: number, enabled: boolean, items: number[]): number => {
  let total = 0;
  for (const item of items) {
    if (enabled) {
      const size = count;
      if (size > 2) {
        total += item;
      }
    }
  }
  return total;
};
```

- **Expected branches:** `for…of` (skipped, runs); `if (enabled)` (then, else); `if (size > 2)` (then, else)
- **Every route (8):**
  - `items []`: skipped
  - `items [1], enabled false`: runs, outer else
  - `items [1], enabled true, count 2`: runs, then, else
  - `items [1], enabled true, count 0`: runs, then, else
  - `items [1], enabled true, count NaN`: runs, then, else
  - `items [1], enabled true, count -1`: runs, then, else
  - `items [1], enabled true, count 3`: runs, then, then
  - `items [1, 2], enabled true, count 3`: runs, then, then
- **Fewest runs:** 4
- **Today:** The loop is a dark spot, and Assayer does not follow a variable written inside a loop.

#### `arrow › object.method › if.then › const` (level 2)

Folder: `src/const/in/object-method/if-then`

```ts
export const entry = (count: number, enabled: boolean) => ({
  check(): string {
    if (enabled) {
      const size = count;
      if (size > 2) {
        return 'then';
      }
    }
    return 'else';
  },
});
```

- **Expected branches:** `if (enabled)` (then, else); `if (size > 2)` (then, else)
- **Every route (6):**
  - `enabled false`: outer else
  - `enabled true, count 3`: then, then
  - `enabled true, count 2`: then, else
  - `enabled true, count 0`: then, else
  - `enabled true, count NaN`: then, else
  - `enabled true, count -1`: then, else
- **Fewest runs:** 3
- **Note:** A method body is a slot of the object literal, not a piece of its own. So the const has two holders, the object and the if, and sits at level 2.

#### `arrow › const › ternary` (level 1)

Folder: `src/const/holds/ternary`

```ts
export const entry = (count: number): string => {
  const size = count > 2 ? 'big' : 'small';
  return size;
};
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The const flows straight into the return, so Assayer reads the ternary as an exit: one exit per arm. No reader is needed.

#### `arrow › const › arrow function › ternary` (level 2)

Folder: `src/const/holds/arrow`

```ts
export const entry = (count: number): string => {
  const pick = (): string => (count > 2 ? 'big' : 'small');
  return pick();
};
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2

#### `arrow › const › object` (level 1)

Folder: `src/const/holds/object`

```ts
export const entry = (count: number): string => {
  const box = { size: count };
  if (box.size > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The reader reads a property of the object the const holds.

## Iteratives: how branches and arguments relate

These cards keep the same pieces, two or three `if`s, and change only how they relate. The branches are nested or come one after another. They read the same argument or different ones. The entry takes 1, 2 or 3 arguments, and an argument may feed no branch at all. Each card lists every route a test can take, and how many runs cover every arm.

The generator runs these same shapes for every pair of branching pieces, such as a ternary inside a `??`, or a `for…of` around an `if`.

#### `nested · 2 args, one per branch`

Folder: `src/shape/if-if/nested/two-args`

```ts
export const entry = (count: number, enabled: boolean): string => {
  if (enabled) {
    if (count > 2) {
      return 'then';
    }
  }
  return 'else';
};
```

- **Expected branches:** `if (enabled)` (then, else); `if (count > 2)` (then, else)
- **Every route (6):**
  - `enabled false`: outer else
  - `enabled true, count 3`: outer then, inner then
  - `enabled true, count 2`: outer then, inner else
  - `enabled true, count 0`: outer then, inner else
  - `enabled true, count NaN`: outer then, inner else
  - `enabled true, count -1`: outer then, inner else
- **Fewest runs:** 3
- **Note:** The inner if only runs on the outer then arm, so outer else is one arm combination.

#### `in a row · 2 args, one per branch`

Folder: `src/shape/if-if/sequence/two-args`

```ts
export const entry = (count: number, enabled: boolean): string[] => {
  const seen: string[] = [];
  if (enabled) {
    seen.push('enabled');
  }
  if (count > 2) {
    seen.push('big');
  }
  return seen;
};
```

- **Expected branches:** `if (enabled)` (then, else); `if (count > 2)` (then, else)
- **Every route (7):**
  - `enabled true, count 3`: then, then
  - `enabled true, count 2`: then, else
  - `enabled true, count 0`: then, else
  - `enabled true, count NaN`: then, else
  - `enabled true, count -1`: then, else
  - `enabled false, count 3`: else, then
  - `enabled false, count 2`: else, else
- **Fewest runs:** 2
- **Note:** The same two ifs, side by side. Every mix of arms can happen, so there are 4 arm combinations. Two runs take all 4 arms.

#### `in a row · 1 arg feeds both, overlapping`

Folder: `src/shape/if-if/sequence/one-arg-overlap`

```ts
export const entry = (count: number): string[] => {
  const seen: string[] = [];
  if (count > 2) {
    seen.push('big');
  }
  if (count > 5) {
    seen.push('huge');
  }
  return seen;
};
```

- **Expected branches:** `if (count > 2)` (then, else); `if (count > 5)` (then, else)
- **Every route (6):**
  - `count 2`: else, else
  - `count 0`: else, else
  - `count NaN`: else, else
  - `count -1`: else, else
  - `count 3`: then, else
  - `count 6`: then, then
- **Fewest runs:** 2
- **Note:** A count above 5 is always above 2, so else, then contradicts itself. That leaves 3 arm combinations.

#### `in a row · 1 arg feeds both, exclusive`

Folder: `src/shape/if-if/sequence/one-arg-exclusive`

```ts
export const entry = (count: number): string[] => {
  const seen: string[] = [];
  if (count < 2) {
    seen.push('small');
  }
  if (count > 5) {
    seen.push('huge');
  }
  return seen;
};
```

- **Expected branches:** `if (count < 2)` (then, else); `if (count > 5)` (then, else)
- **Every route (6):**
  - `count 1`: then, else
  - `count 0`: then, else
  - `count -1`: then, else
  - `count 3`: else, else
  - `count NaN`: else, else
  - `count 6`: else, then
- **Fewest runs:** 2
- **Note:** A count cannot be below 2 and above 5, so then, then contradicts itself. That also leaves 3 arm combinations, for a different reason. NaN fails both checks, so it lands on else, else.

#### `one branch · 2 args feed it together`

Folder: `src/shape/if/two-args-one-check`

```ts
export const entry = (count: number, limit: number): string => {
  if (count > limit) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if (count > limit)` (then, else)
- **Every route (8):**
  - `count 3, limit 2`: then
  - `count 2, limit 2`: else
  - `count 0, limit 2`: else
  - `count NaN, limit 2`: else
  - `count -1, limit 2`: else
  - `count 3, limit 0`: then
  - `count 3, limit NaN`: else
  - `count 3, limit -1`: then
- **Fewest runs:** 2
- **Note:** Both leaves are parameters feeding one check, so the generator varies both. Each edge value of one leaf is a case while the other keeps its value from the first route. Today's generator never varies two leaves at once, so it never writes this.

#### `in a row · 3 args, one feeds nothing`

Folder: `src/shape/if-if/sequence/three-args-one-unused`

```ts
export const entry = (count: number, enabled: boolean, label: string): string[] => {
  const seen: string[] = [];
  if (enabled) {
    seen.push('enabled');
  }
  if (count > 2) {
    seen.push('big');
  }
  return seen;
};
```

- **Expected branches:** `if (enabled)` (then, else); `if (count > 2)` (then, else)
- **Other expected reports:** lint, error: label is declared but never read
- **Every route (7):**
  - `enabled true, count 3`: then, then
  - `enabled true, count 2`: then, else
  - `enabled true, count 0`: then, else
  - `enabled true, count NaN`: then, else
  - `enabled true, count -1`: then, else
  - `enabled false, count 3`: else, then
  - `enabled false, count 2`: else, else
- **Fewest runs:** 2
- **Note:** label reaches no branch, so the routes match the 2-argument card. A value nothing reads owes no test, so label's edge value '' adds no case. The lint fails the build by default.
- **Today:** Assayer has no lint for an unused parameter.

#### `in a row · 3 args, one per branch`

Folder: `src/shape/if-if-if/sequence/three-args`

```ts
export const entry = (count: number, enabled: boolean, label: string): string[] => {
  const seen: string[] = [];
  if (enabled) {
    seen.push('enabled');
  }
  if (count > 2) {
    seen.push('big');
  }
  if (label === 'x') {
    seen.push('named');
  }
  return seen;
};
```

- **Expected branches:** `if (enabled)` (then, else); `if (count > 2)` (then, else); `if (label === 'x')` (then, else)
- **Every route (12):**
  - `enabled true, count 3, label 'x'`: then, then, then
  - `enabled true, count 3, label 'y'`: then, then, else
  - `enabled true, count 3, label ''`: then, then, else
  - `enabled true, count 2, label 'x'`: then, else, then
  - `enabled true, count 0, label 'x'`: then, else, then
  - `enabled true, count NaN, label 'x'`: then, else, then
  - `enabled true, count -1, label 'x'`: then, else, then
  - `enabled true, count 2, label 'y'`: then, else, else
  - `enabled false, count 3, label 'x'`: else, then, then
  - `enabled false, count 3, label 'y'`: else, then, else
  - `enabled false, count 2, label 'x'`: else, else, then
  - `enabled false, count 2, label 'y'`: else, else, else
- **Fewest runs:** 2
- **Note:** Three independent branches give 2 × 2 × 2 = 8 arm combinations. The edge values of count and label add 4 more cases. Each edge value pairs with the then values of the other inputs, so count's edge values land on then, else, then, and label '' lands on then, then, else. Two runs still take all 6 arms.

#### `nested · 3 args, one per branch`

Folder: `src/shape/if-if-if/nested/three-args`

```ts
export const entry = (count: number, enabled: boolean, label: string): string => {
  if (enabled) {
    if (count > 2) {
      if (label === 'x') {
        return 'named';
      }
    }
  }
  return 'else';
};
```

- **Expected branches:** `if (enabled)` (then, else); `if (count > 2)` (then, else); `if (label === 'x')` (then, else)
- **Every route (8):**
  - `enabled false`: outer else
  - `enabled true, count 2`: then, middle else
  - `enabled true, count 0`: then, middle else
  - `enabled true, count NaN`: then, middle else
  - `enabled true, count -1`: then, middle else
  - `enabled true, count 3, label 'y'`: then, then, inner else
  - `enabled true, count 3, label ''`: then, then, inner else
  - `enabled true, count 3, label 'x'`: then, then, inner then
- **Fewest runs:** 4
- **Note:** The same 3 arguments and 3 ifs as the card above. Nesting gives 4 arm combinations instead of 8, and fewest runs needs one case from each.

## Routes from a parameter to a branch

Every example here ends in the same `if (… > 2)`. Only the route the parameter takes to get there changes.

#### `param › if`

Folder: `src/route/direct`

```ts
export const entry = (count: number): string => {
  if (count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The baseline. Every other route below ends in this same if.

#### `param › const › if`

Folder: `src/route/const`

```ts
export const entry = (count: number): string => {
  const size = count;
  if (size > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2

#### `param › let reassigned › if`

Folder: `src/route/let`

```ts
export const entry = (count: number): string => {
  let size = 0;
  size = count;
  if (size > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2

#### `destructured param › if`

Folder: `src/route/destructure`

```ts
export const entry = ({ count }: { count: number }): string => {
  if (count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `{ count: 3 }`: then
  - `{ count: 2 }`: else
  - `{ count: 0 }`: else
  - `{ count: NaN }`: else
  - `{ count: -1 }`: else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `count`: `3` for then, `2` for else
- **Note:** The value is a property of an object parameter. Assayer arranges it from the stub view when the test runs.

#### `param › const › ternary › if`

Folder: `src/route/ternary-binding`

```ts
export const entry = (count: number): string => {
  const big = count > 2 ? true : false;
  if (big) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `ternary` (then, else); `if` (then, else)
- **Every route (5):**
  - `count 3`: ternary then, if then
  - `count 2`: ternary else, if else
  - `count 0`: ternary else, if else
  - `count NaN`: ternary else, if else
  - `count -1`: ternary else, if else
- **Fewest runs:** 2
- **Note:** The if's arm follows from the ternary's arm. So there are 2 arm combinations, not 4.

#### `param › same-file call › if`

Folder: `src/route/same-file-call`

```ts
const isBig = (value: number): boolean => value > 2;

export const entry = (count: number): string => {
  if (isBig(count)) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The > inside the helper does not branch. Only the if does.

## Loops and callbacks

A loop breaks the idea that a route takes one arm per branch. An `if` inside a loop can take both arms in one run. Assayer's core already has the words for this. A callback a host maps over an array gets the arms `skipped` and `runs`, and every array parameter is built empty, with one item, and with many. Loops use the same arms and the same three sizes.

Today every loop and every `try` is a dark spot, because no handler reads them yet (`significant-syntax-kinds-statics.ts`). These cards predict the behavior once a handler lands.

#### `for…of › if`

Folder: `src/loop/for-of`

```ts
export const entry = (items: number[]): number => {
  let total = 0;
  for (const item of items) {
    if (item > 2) {
      total += item;
    }
  }
  return total;
};
```

- **Expected branches:** `for…of` (skipped, runs); `if` (then, else)
- **Every route (7):**
  - `items []`: skipped
  - `items [2]`: runs, else
  - `items [0]`: runs, else
  - `items [NaN]`: runs, else
  - `items [-1]`: runs, else
  - `items [3]`: runs, then
  - `items [2, 3]`: runs, else and then
- **Fewest runs:** 2
- **Note:** With many items, one run takes both if arms. So [] and [2, 3] cover every arm. Each array size is its own case.
- **Today:** The loop is a dark spot.

#### `while › if › break`

Folder: `src/loop/while-break`

```ts
export const entry = (limit: number): number => {
  let count = 0;
  while (count < limit) {
    if (count === 3) {
      break;
    }
    count += 1;
  }
  return count;
};
```

- **Expected branches:** `while` (skipped, runs); `if` (then (break), else)
- **Every route (5):**
  - `limit 0`: skipped
  - `limit NaN`: skipped
  - `limit -1`: skipped
  - `limit 2`: runs, else only
  - `limit 5`: runs, else then break
- **Fewest runs:** 2
- **Note:** break is a way out of the loop body, not an exit of the function.
- **Today:** The loop is a dark spot, and count is a variable written inside a loop, so Assayer does not follow it.

#### `for…of › return inside`

Folder: `src/loop/return-inside`

```ts
export const entry = (items: number[]): string => {
  for (const item of items) {
    if (item > 2) {
      return 'found';
    }
  }
  return 'none';
};
```

- **Expected branches:** `for…of` (skipped, runs); `if` (then, else)
- **Every route (7):**
  - `items []`: skipped, exits none
  - `items [2]`: runs, else, exits none
  - `items [0]`: runs, else, exits none
  - `items [NaN]`: runs, else, exits none
  - `items [-1]`: runs, else, exits none
  - `items [3]`: runs, then, exits found
  - `items [2, 3]`: runs, else then then, exits found
- **Fewest runs:** 2
- **Note:** A return inside a loop leaves the function from inside the body. The function has two exits.
- **Today:** The loop is a dark spot.

#### `.map callback › ternary`

Folder: `src/callback/map`

```ts
export const entry = (items: number[]): string[] =>
  items.map((item) => (item > 2 ? 'big' : 'small'));
```

- **Expected branches:** `callback` (skipped, runs); `ternary exit` (then, else)
- **Every route (7):**
  - `items []`: skipped
  - `items [2]`: runs, else
  - `items [0]`: runs, else
  - `items [NaN]`: runs, else
  - `items [-1]`: runs, else
  - `items [3]`: runs, then
  - `items [2, 3]`: runs, else and then
- **Fewest runs:** 2
- **Note:** Assayer drives this today: a callback a host maps over an array gets skipped and runs. [] and [2, 3] take every arm.

#### `.then callback › ternary`

Folder: `src/callback/then`

```ts
export const entry = (count: number): Promise<string> =>
  Promise.resolve(count).then((value) => (value > 2 ? 'big' : 'small'));
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: callback runs, ternary then
  - `count 2`: callback runs, ternary else
  - `count 0`: callback runs, ternary else
  - `count NaN`: callback runs, ternary else
  - `count -1`: callback runs, ternary else
- **Fewest runs:** 2
- **Note:** The callback runs once, when the promise resolves. Promise.resolve never rejects, so there is no skipped arm here. A promise that can reject would give .then a skipped arm and .catch a runs arm.

#### `.then, .catch, .finally › a promise that can reject`

Folder: `src/callback/then-catch-finally`

```ts
const load = async (count: number): Promise<number> => {
  if (count < 0) {
    throw new Error('count must be 0 or more');
  }
  return count;
};

export const entry = (count: number): Promise<string> =>
  load(count)
    .then((value) => (value > 2 ? 'big' : 'small'))
    .catch(() => 'failed')
    .finally(() => console.log('done'));
```

- **Expected branches:** `load if` (then (rejects), else (resolves)); `.then callback` (runs, skipped); `ternary exit` (then, else); `.catch callback` (runs, skipped)
- **Every route (5):**
  - `count -1`: rejects, .then skipped, .catch runs, .finally runs
  - `count 2`: resolves, .then runs, ternary else, .catch skipped, .finally runs
  - `count 0`: resolves, .then runs, ternary else, .catch skipped, .finally runs
  - `count NaN`: resolves, .then runs, ternary else, .catch skipped, .finally runs
  - `count 3`: resolves, .then runs, ternary then, .catch skipped, .finally runs
- **Fewest runs:** 3
- **Note:** .finally runs on every route, so it adds no arm. The other callbacks take their arms from whether load resolves or rejects. NaN < 0 is false, so count NaN resolves.

#### `returned closure › ternary`

Folder: `src/callback/returned-closure`

```ts
export const entry = (limit: number) => (value: number): string => (value > limit ? 'big' : 'small');
```

- **Expected branches:** `ternary exit` (then, else)
- **Other expected reports:** undriven: an outside caller sets value
- **Every route (2):**
  - `value above limit`: then (undriven: listed, never run)
  - `value at or below limit`: else (undriven: listed, never run)
- **Fewest runs:** none: every route is undriven, so none runs
- **Note:** The closure is returned and applied later by code outside this file. No input entry takes can decide which way value goes.

## Objects, arrays and classes hold the other layers

An object holds bindings (properties) and functions (methods). An array holds elements, which can be expressions, functions, objects or other arrays. A class holds fields, a constructor and methods. Objects and arrays never hold a statement directly.

#### `arrow › object › property ternary, method if`

Folder: `src/object/property-and-method`

```ts
export const entry = (count: number) => ({
  label: count > 2 ? 'big' : 'small',
  check(): string {
    if (count > 2) {
      return 'then';
    }
    return 'else';
  },
});
```

- **Expected branches:** `ternary` (then, else); `if` (then, else)
- **Every route (5):**
  - `count 3`: ternary then, check then
  - `count 2`: ternary else, check else
  - `count 0`: ternary else, check else
  - `count NaN`: ternary else, check else
  - `count -1`: ternary else, check else
- **Fewest runs:** 2
- **Note:** A test calls entry, then calls check on what it returns.

#### `arrow › object › object › ??`

Folder: `src/object/in/object`

```ts
export const entry = (name: string | undefined) => ({
  user: { display: name ?? 'anon' },
});
```

- **Expected branches:** `?? value` (left, right)
- **Every route (3):**
  - `name 'x'`: left
  - `name ''`: left
  - `name undefined`: right
- **Fewest runs:** 2
- **Note:** Every route keeps the empty string as its own case. ?? keeps it on the left, where || would send it right.
- **Today:** Assayer reads only a ternary as a value-position branch, so this ?? is not a branch.

#### `arrow › array › ternary element`

Folder: `src/array/element-ternary`

```ts
export const entry = (count: number): string[] => [count > 2 ? 'big' : 'small', 'fixed'];
```

- **Expected branches:** `ternary` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2

#### `arrow › array › function element › if`

Folder: `src/array/element-function`

```ts
export const entry = (count: number): (() => string)[] => [
  () => {
    if (count > 2) {
      return 'then';
    }
    return 'else';
  },
];
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The if sits inside a function the array holds. A test calls entry, then calls the first element.

#### `arrow › array destructuring default`

Folder: `src/array/destructure-default`

```ts
export const entry = (values: number[]): number => {
  const [first = 0] = values;
  return first;
};
```

- **Expected branches:** `destructuring default` (present, defaulted)
- **Every route (6):**
  - `values []`: defaulted
  - `values [5]`: present
  - `values [0]`: present
  - `values [NaN]`: present
  - `values [-1]`: present
  - `values [5, 6]`: present
- **Fewest runs:** 2
- **Note:** Assayer already reaches both arms through its empty-array and one-item cases.
- **Today:** Assayer does not name the destructuring default as a branch.

#### `class › constructor › field › method › ternary`

Folder: `src/class/constructor-to-method`

```ts
export class Entry {
  private readonly size: number;

  public constructor(count: number) {
    this.size = count;
  }

  public label(): string {
    return this.size > 2 ? 'big' : 'small';
  }
}
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `new Entry(3)`: then
  - `new Entry(2)`: else
  - `new Entry(0)`: else
  - `new Entry(NaN)`: else
  - `new Entry(-1)`: else
- **Fewest runs:** 2
- **Note:** The value travels from the constructor parameter, through a field, into a method.

## Type variation

Every section above uses each piece's default type: `boolean` for a bare `if` or ternary, `number` for `>`, `string | undefined` for `??`. This section runs the pieces that cross the type axis through each type. Each cell gives the check, then the ordinary value a test passes for each arm. Those values come from the type itself, never from running the code. Every route also holds one case per edge value of the type, on the arm it lands on, as the "Edge values" section describes.

| Shape | `number` | `boolean` | `string` | literal union `'a' \| 'b'` |
|---|---|---|---|---|
| `if (x)`, `x ? a : b` | `if (count)`: then `1`; else `0` | `if (flag)`: then `true`; else `false` | `if (name)`: then `'a'`; else `''` | `if (mode)`: then `'a'`; else is unreachable: no member is falsy. Expect an unreachable-exit lint. |
| `!x` | `!count`: true for `0`; false for `1` | `!flag`: true for `false`; false for `true` | `!name`: true for `''`; false for `'a'` | `!mode`: always false. Expect an unreachable-exit lint on the true arm. |
| `x === literal` | `count === 7`: then `7`; else `8` | `flag === false`: then `false`; else `true` | `name === 'xyz'`: then `'xyz'`; else `'a'` | `mode === 'a'`: then `'a'`; else `'b'` |
| `x > limit` | `count > 5`: then `6`; else `5` | Not generated. The piece leaves `boolean` out. | `name > 'm'`: then `'n'`; else `'a'` | Not generated. Nobody orders the members of a union with `>`. |
| `x ?? fallback`, with `x` possibly `undefined` | `count ?? 5`: left `0`; right `undefined` | `flag ?? true`: left `false`; right `undefined` | `name ?? 'anon'`: left `''`; right `undefined` | `mode ?? 'a'`: left `'b'`; right `undefined` |
| `x.length` | Refused by TypeScript: a number has no `length`. | Refused by TypeScript: a boolean has no `length`. | `if (name.length)`: then `'a'`; else `''` | `if (mode.length)`: then `'a'`; else is unreachable: no member is empty. |
| `switch (x)` | `case 7`: case `7`; no match `8` | Not generated. A `switch` on a boolean is an `if`. | `case 'xyz'`: case `'xyz'`; no match `'a'` | `case 'a'`, `case 'b'`: one case per member, every case listed from the type. This is tier 2. |

`??` keeps `0`, `false` and `''`, but `if` treats all three as false. A specimen that mixes the two, such as `if (count ?? 5)`, has routes that depend on that difference. `T | undefined` and `T | null` are covered by the nullability axis, in the "Optional and nullable values" section below.

Literal unions, enums and discriminated unions are what unlock tier 2: Assayer lists every case from the type. The cards below show the two that the table cannot.

#### `enum › switch`

Folder: `src/type/enum`

```ts
enum Level {
  Low,
  High,
}

export const entry = (level: Level): string => {
  switch (level) {
    case Level.Low:
      return 'low';
    case Level.High:
      return 'high';
  }
};
```

- **Expected branches:** `switch` (case Low, case High)
- **Every route (2):**
  - `Level.Low`: case Low
  - `Level.High`: case High
- **Fewest runs:** 2
- **Note:** The enum lists every member, so Assayer can list every case from the type.
- **Today:** A case that compares with an enum member reads as unread-comparison, so the switch is undriven.

#### `discriminated union › switch on kind`

Folder: `src/type/discriminated-union`

```ts
type Shape = { kind: 'circle'; radius: number } | { kind: 'square'; side: number };

export const entry = (shape: Shape): number => {
  switch (shape.kind) {
    case 'circle':
      return shape.radius;
    case 'square':
      return shape.side;
  }
};
```

- **Expected branches:** `switch` (case 'circle', case 'square')
- **Every route (2):**
  - `kind 'circle'`: case 'circle'
  - `kind 'square'`: case 'square'
- **Fewest runs:** 2
- **Stub values Assayer derives:** `shape.kind`: `'circle'` for case 'circle', `'square'` for case 'square'
- **Note:** shape is an object parameter, so Assayer builds it from the stub view. Each case narrows shape to one member.

## Optional and nullable values

Optional and nullable values are their own axis. The default is a value that is never missing. `undefined` and `null` look alike, but several pieces treat them differently, so a parameter that can hold both needs a case for each.

| Shape | What a test passes | Note |
|---|---|---|
| `x?: T`, an optional parameter | left out, a value | Leaving it out and passing `undefined` are the same at run time, so Assayer tests one of them. A call that leaves it out is complete. |
| `x: T \| undefined` | `undefined`, a value | The caller must pass something. |
| `x: T \| null` | `null`, a value |  |
| `x: T \| null \| undefined` | `null`, `undefined`, a value | Each one is its own case. |
| `{ x?: T }`, an optional property | missing, present as `undefined`, a value | `'x' in obj` tells missing apart from present as `undefined`. Under `exactOptionalPropertyTypes` TypeScript refuses the middle one, so that flag is another compiler-options value. |

| Piece | With `undefined` | With `null` |
|---|---|---|
| `if (x)` | else | else |
| `x ?? d` | right | right |
| `x?.y` | absent | absent |
| `x == null` | true | true |
| `x === undefined` | true | false |
| a default, on a parameter or in destructuring | defaulted | given: `null` passes straight through |

#### `default parameter › null passes through`

Folder: `src/nullable/default-and-null`

```ts
export const entry = (label: string | null = 'none'): string => {
  if (label === null) {
    return 'null';
  }
  return label;
};
```

- **Expected branches:** `default parameter` (given, defaulted); `if` (then, else)
- **Every route (4):**
  - `label left out`: defaulted, else
  - `label null`: given, then
  - `label 'x'`: given, else
  - `label ''`: given, else
- **Fewest runs:** 2
- **Note:** Only undefined triggers a default. null is given and reaches the if. The default 'none' is never null, so defaulted then contradicts itself.

#### `=== undefined, then == null`

Folder: `src/nullable/undefined-vs-null`

```ts
export const entry = (count: number | null | undefined): string => {
  if (count === undefined) {
    return 'missing';
  }
  if (count == null) {
    return 'null';
  }
  return 'value';
};
```

- **Expected branches:** `=== undefined` (then, else); `== null` (then, else)
- **Every route (6):**
  - `count undefined`: then
  - `count null`: else, then
  - `count 3`: else, else
  - `count 0`: else, else
  - `count NaN`: else, else
  - `count -1`: else, else
- **Fewest runs:** 3
- **Note:** The type holds both null and undefined, so each gets its own case. Each route reaches its own exit.

#### `optional property › missing or present`

Folder: `src/nullable/optional-property-in`

```ts
type Options = { label?: string };

export const entry = (options: Options): string => {
  if ('label' in options) {
    return 'set';
  }
  return 'unset';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (4):**
  - `options {}`: else
  - `options { label: undefined }`: then
  - `options { label: 'x' }`: then
  - `options { label: '' }`: then
- **Fewest runs:** 2
- **Stub values Assayer derives:** `options.label`: present as `'x'` for then, missing for else
- **Note:** The stub view has to build both a missing property and a property present as undefined. Only in tells them apart. Under exactOptionalPropertyTypes the middle case is refused.

#### `optional parameter › ?? fallback in a condition`

Folder: `src/nullable/optional-param-fallback`

```ts
export const entry = (count: number, limit?: number): string => {
  if (count > (limit ?? 10)) {
    return 'over';
  }
  return 'under';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (10):**
  - `limit 2, count 3`: then
  - `limit 2, count 2`: else
  - `limit 2, count 0`: else
  - `limit 2, count NaN`: else
  - `limit 2, count -1`: else
  - `limit left out, count 11`: then
  - `limit left out, count 10`: else
  - `limit 0, count 11`: then
  - `limit NaN, count 11`: else
  - `limit -1, count 11`: then
- **Fewest runs:** 2
- **Note:** The ?? sits inside the condition, so it is a leaf of the if. Every route keeps "limit left out" and "limit given" as separate causes of each arm. The edge values of count pair with limit 2, its value for the left arm of ??, and the edge values of limit pair with count 11.

## Edge values

JavaScript treats a few values of each type specially. Assayer always includes them as cases, so a route that only an edge value takes is never left untested.

| Type | Edge values Assayer always tries |
|---|---|
| `string` | `''` |
| `number` | `0`, `NaN`, a negative number. Cards use `-1` |
| `boolean` | `false`. A boolean has only `true` and `false`, so it adds no other case |
| literal union or enum | each member |
| array | `[]`, one item and many, at every level |
| object | `{}`, where the type allows it |
| nullable | `null` and `undefined`, each where the type allows it |
| optional or defaulted parameter | left out |
| `?.` chain | each missing level |
| environment variable | unset |

Every card lists its routes the same way:

1. Each arm combination gets one ordinary value, derived from the conditions of its arms. For `count > 2`, the then arm gets `3` and the else arm gets `2`.
2. Each edge value of each leaf operand's type is one more case, on the arm it lands on. A value that an edge-value-merge rule names, such as `'0'` for loose equality, is one more case too.
3. While one input takes an edge value, each other input takes the first value the card lists for it that still lets the edge-valued input be read. For `ready && count > 2`, the count cases use `ready true`.
4. An ordinary value that is also an edge value is listed once.
5. An input whose value a comparison or a call makes irrelevant, such as both members under `typeof`, still gets one case per edge value. A parameter that nothing reads gets none, because a value nothing reads owes no test.

Fewest runs does not change: it is the smallest set of these cases that takes every reachable arm.

The "edge-value merge" lint family reports when implicit coercion puts an edge value on the same arm as a different kind of value. Each rule reads only the type graph, so it states a fact, not a guess about intent. The error names the exact value and arm, and the case on the every-route list proves it. Each rule has its own global toggle (`off`, `warn`, `error`), defaulting to `warn` until it has been measured on real repos. There is no per-site waiver: the way out is the explicit rewrite.

| Rule | Fires on | What gets merged | The explicit rewrite |
|---|---|---|---|
| truthiness | `if (x)`, `x ? a : b`, `!x`, where `x` can be both missing and a falsy value | `0`, `''` or `false` takes the same arm as missing | `x !== undefined`, or `x > 0`, or `x !== ''` |
| or-default | `x \|\| d`, where `x` can be a falsy value that is not missing | `0`, `''` or `false` is replaced by the default | `x ?? d` |
| loose equality | `a == b`, except `x == null` | `0 == ''` and `0 == '0'` are both true | `===`. `x == null` is exempt, because merging `null` and `undefined` is its purpose. |
| typeof object | `typeof x === 'object'`, where `x` can be `null` | `null` passes as an object | add `x !== null` |
| mixed plus | `a + b`, where an operand can be both a string and a number | adding becomes joining: `'1' + 2` is `'12'` | convert both sides first |
| global isNaN | `isNaN(x)`, where `x` is `any` | `isNaN('abc')` is true. TypeScript refuses a typed non-number, so this only fires through `any`. | `Number.isNaN` |
| always truthy | `if (items)` on an array or object that cannot be missing | `[]` and `{}` are truthy | `items.length > 0`. This one is already the unreachable-exit lint. |

#### `truthiness · 0 and missing share an arm`

Folder: `src/edge/truthiness`

```ts
export const entry = (count: number | undefined): string => {
  if (count) {
    return 'set';
  }
  return 'missing';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** lint, warn: edge-value merge (truthiness): count 0 takes the else arm, the same arm as count undefined
- **Every route (5):**
  - `count 3`: then
  - `count -1`: then
  - `count 0`: else
  - `count NaN`: else
  - `count undefined`: else
- **Fewest runs:** 2
- **Note:** The every-route list already holds the proof: count 0 and count undefined take the same arm. A negative count is truthy, so count -1 takes then.

#### `or-default · empty string is replaced`

Folder: `src/edge/or-default`

```ts
export const entry = (name: string): string => name || 'anon';
```

- **Expected branches:** `|| exit` (stops at left, evaluates right)
- **Other expected reports:** lint, warn: edge-value merge (or-default): name '' is replaced by 'anon'. Write ?? to keep it.
- **Every route (2):**
  - `name 'x'`: stops at left
  - `name ''`: evaluates right
- **Fewest runs:** 2
- **Note:** Compare the ?? card in "Each piece alone", where name '' stays on the left.

#### `loose equality · '' equals 0`

Folder: `src/edge/loose-equality`

```ts
export const entry = (value: number | string): boolean => value == 0;
```

- **Expected branches:** none
- **Other expected reports:** lint, warn: edge-value merge (loose equality): value '' and value '0' both equal 0
- **Every route (7):**
  - `value 0`: returns true
  - `value ''`: returns true
  - `value '0'`: returns true
  - `value 1`: returns false
  - `value NaN`: returns false
  - `value -1`: returns false
  - `value 'a'`: returns false
- **Fewest runs:** 2
- **Note:** A returned comparison has return-true and return-false arms. Three different values reach return-true. '0' is not an edge value of string. It is a case because the loose-equality rule names it.

#### `typeof object · null passes`

Folder: `src/edge/typeof-object`

```ts
export const entry = (value: { size: number } | null | string): string => {
  if (typeof value === 'object') {
    return 'object';
  }
  return 'other';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** lint, warn: edge-value merge (typeof object): value null takes the then arm, the same arm as an object
- **Every route (4):**
  - `value { size: 1 }`: then
  - `value null`: then
  - `value 'a'`: else
  - `value ''`: else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `value`: `{ size: 1 }` for then, `'a'` for else. No branch reads size, so size takes a plain number.

#### `mixed plus · adding becomes joining`

Folder: `src/edge/mixed-plus`

```ts
export const entry = (base: number | string, extra: number): number | string => base + extra;
```

- **Expected branches:** none
- **Other expected reports:** lint, warn: edge-value merge (mixed plus): base '1' with extra 2 gives '12', not 3
- **Every route (9):**
  - `base 1, extra 2`: returns 3
  - `base 0, extra 2`: returns 2
  - `base NaN, extra 2`: returns NaN
  - `base -1, extra 2`: returns 1
  - `base '1', extra 2`: returns '12'
  - `base '', extra 2`: returns '2'
  - `base 1, extra 0`: returns 1
  - `base 1, extra NaN`: returns NaN
  - `base 1, extra -1`: returns 0
- **Fewest runs:** 1
- **Note:** There is no branch here, so one run covers the code. The lint comes from the type graph alone. '1' is a case because the mixed-plus rule names it, and '' is the string edge value.

## Wrapped types and reaching in

A type has two parts: the wrapper and the value inside it. The value is one of the types above. The wrapper is plain, an array, an object, or a class instance. The default wrapper is plain.

Reaching in is not a new mechanism. Each way of pulling a value out, such as `.count`, `[0]`, `?.` or a getter, is an expression piece. Its slot takes a wrapper type and it returns the value inside. The generator already matches pieces by type, so a piece that reaches into `{ count: T }` only fills a hole whose source has that shape.

| Wrapper | Example parameter | Pieces that reach in | How a test builds the value |
|---|---|---|---|
| plain | `count: number` | none: the value is read directly | passes the value |
| array | `counts: number[]` | `[0]`, `.length`, `for…of`, `const [first] =`, `.at()`, callbacks | passes an empty array, one item, and many items |
| object | `box: { count: number }` | `.count`, `const { count } =` | the stub view in `STUBS.md` |
| object, maybe missing | `box: { count: number } \| undefined` | `?.count`. Only one level of `?.` is split today. | the stub view, or `undefined` |
| object in an object | `order: { item: { count: number } }` | `.item.count` | the stub view, two levels |
| array of objects | `items: { count: number }[]` | `for…of` then `.count` | empty, one and many arrays of stubs |
| class instance | `new Counter(count)` | a getter, a setter, a method call | calls the constructor |

#### `object › .count › if`

Folder: `src/reach/object-property`

```ts
export const entry = (box: { count: number }): string => {
  if (box.count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `{ count: 3 }`: then
  - `{ count: 2 }`: else
  - `{ count: 0 }`: else
  - `{ count: NaN }`: else
  - `{ count: -1 }`: else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `box.count`: `3` for then, `2` for else
- **Note:** Reading one file alone, Assayer cannot set one property of an object parameter. At run time it arranges box from the stub view, so both arms run.

#### `object, maybe missing › ?.count › if`

Folder: `src/reach/optional-property`

```ts
export const entry = (box: { count: number } | undefined): string => {
  if (box?.count) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** lint, warn: edge-value merge (truthiness): box.count 0 takes the else arm, the same arm as box undefined
- **Every route (5):**
  - `box undefined`: else
  - `box { count: 0 }`: else
  - `box { count: NaN }`: else
  - `box { count: 1 }`: then
  - `box { count: -1 }`: then
- **Fewest runs:** 2
- **Stub values Assayer derives:** `box.count`: `1` for then, `0` for else
- **Note:** In a condition, ?. is a non-nullish leaf of the if, not a branch of its own. Every route keeps each cause of else as its own case. Fewest runs keeps one.

#### `object in an object › .item.count › if`

Folder: `src/reach/nested-property`

```ts
export const entry = (order: { item: { count: number } }): string => {
  if (order.item.count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `order.item.count`: `3` for then, `2` for else

#### `array › [0] › if`

Folder: `src/reach/array-index`

```ts
export const entry = (counts: number[]): string => {
  if (counts[0] > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (7):**
  - `counts []`: else
  - `counts [2]`: else
  - `counts [0]`: else
  - `counts [NaN]`: else
  - `counts [-1]`: else
  - `counts [3]`: then
  - `counts [3, 2]`: then
- **Fewest runs:** 2
- **Note:** Assayer builds counts empty, with one item and with many. On an empty array counts[0] is undefined, and undefined > 2 is false. The smoke repo leaves noUncheckedIndexedAccess off, so TypeScript types counts[0] as number. The compiler-options axis writes this card again with the flag on, where it needs a guard such as counts[0] ?? 0.

#### `array of objects › for…of › .count › if`

Folder: `src/reach/array-of-objects`

```ts
export const entry = (items: { count: number }[]): number => {
  let total = 0;
  for (const item of items) {
    if (item.count > 2) {
      total += item.count;
    }
  }
  return total;
};
```

- **Expected branches:** `for…of` (skipped, runs); `if` (then, else)
- **Every route (7):**
  - `items []`: skipped
  - `items [{ count: 2 }]`: runs, else
  - `items [{ count: 0 }]`: runs, else
  - `items [{ count: NaN }]`: runs, else
  - `items [{ count: -1 }]`: runs, else
  - `items [{ count: 3 }]`: runs, then
  - `items [{ count: 2 }, { count: 3 }]`: runs, else and then
- **Fewest runs:** 2
- **Stub values Assayer derives:** `count` on each item: `3` for then, `2` for else. items itself is an array parameter, built empty, with one item and with many.
- **Today:** The loop is a dark spot.

#### `class instance › getter › if`

Folder: `src/reach/class-getter`

```ts
class Counter {
  public constructor(private readonly count: number) {}

  public get big(): boolean {
    return this.count > 2;
  }
}

export const entry = (count: number): string => {
  const counter = new Counter(count);
  if (counter.big) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The getter is both a place code goes (its body) and a way to reach in (counter.big).

#### `class instance › setter › ternary`

Folder: `src/reach/class-setter`

```ts
class Counter {
  private value = 0;

  public set count(next: number) {
    this.value = next > 2 ? next : 0;
  }

  public get count(): number {
    return this.value;
  }
}

export const entry = (count: number): number => {
  const counter = new Counter();
  counter.count = count;
  return counter.count;
};
```

- **Expected branches:** `ternary` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The assignment counter.count = count runs the setter, so the ternary in its body is driven by entry's parameter.

## Objects and arrays nested 3 levels deep

Objects and arrays get one more level than other pieces. The first cards reach into a deep parameter. The last ones build a deep literal. Assayer builds every array empty, with one item and with many, at each level. So a "many" array whose items differ can take several arms in one run.

#### `param › object › object › object › if` (level 3)

Folder: `src/deep/object-3`

```ts
type Address = { country: string };
type Customer = { address: Address };
type Order = { customer: Customer };

export const entry = (order: Order): string => {
  if (order.customer.address.country === 'NZ') {
    return 'local';
  }
  return 'abroad';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (3):**
  - `country 'NZ'`: then
  - `country 'US'`: else
  - `country ''`: else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `order.customer.address.country`: `'NZ'` for then, `'US'` for else
- **Note:** Assayer builds order from the stub view through three named types. The value demand from the branch lands on Address.country, three levels down.

#### `param › ?. › ?. › ?. › if` (level 3)

Folder: `src/deep/optional-chain-3`

```ts
type Order = { customer?: { address?: { country: string } } };

export const entry = (order: Order | undefined): string => {
  if (order?.customer?.address?.country === 'NZ') {
    return 'local';
  }
  return 'abroad';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (6):**
  - `order undefined`: else
  - `customer missing`: else
  - `address missing`: else
  - `country 'US'`: else
  - `country ''`: else
  - `country 'NZ'`: then
- **Fewest runs:** 2
- **Stub values Assayer derives:** `order.customer.address.country`: `'NZ'` for then, `'US'` for else
- **Note:** Each ?. is a non-nullish leaf of the if's condition. Every route keeps each missing level as its own cause of else. Fewest runs keeps one.

#### `param › array of objects › array › if` (level 3)

Folder: `src/deep/array-of-objects-2`

```ts
type Order = { prices: number[] };

export const entry = (orders: Order[]): number => {
  let expensive = 0;
  for (const order of orders) {
    for (const price of order.prices) {
      if (price > 100) {
        expensive += 1;
      }
    }
  }
  return expensive;
};
```

- **Expected branches:** `outer for…of` (skipped, runs); `inner for…of` (skipped, runs); `if` (then, else)
- **Every route (9):**
  - `orders []`: outer skipped
  - `orders [{ prices: [] }]`: outer runs, inner skipped
  - `orders [{ prices: [100] }]`: runs, runs, else
  - `orders [{ prices: [0] }]`: runs, runs, else
  - `orders [{ prices: [NaN] }]`: runs, runs, else
  - `orders [{ prices: [-1] }]`: runs, runs, else
  - `orders [{ prices: [101] }]`: runs, runs, then
  - `orders [{ prices: [100, 101] }]`: runs, runs with else and then
  - `orders [{ prices: [] }, { prices: [100, 101] }]`: runs; inner skipped, then runs with else and then
- **Fewest runs:** 2
- **Stub values Assayer derives:** `order.prices` on each order: `[]` for inner skipped, `[100]` for else, `[101]` for then. orders itself is an array parameter, built empty, with one item and with many.
- **Note:** Assayer builds each array empty, with one item and with many, at both levels. The last route takes every arm but outer skipped in one run, so [] plus that route cover everything. price sits inside three pieces, the prices array, the order object and the orders array, so it is level 3.
- **Today:** Both loops are dark spots.

#### `param › nested destructuring › default › if` (level 3)

Folder: `src/deep/destructure-default-3`

```ts
type Settings = { display: { theme: { mode?: string } } };

export const entry = (settings: Settings): string => {
  const {
    display: {
      theme: { mode = 'light' },
    },
  } = settings;
  if (mode === 'dark') {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `destructuring default` (present, defaulted); `if` (then, else)
- **Every route (4):**
  - `mode missing`: defaulted, else
  - `mode 'dark'`: present, then
  - `mode 'dim'`: present, else
  - `mode ''`: present, else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `settings.display.theme.mode`: missing for defaulted, `'dark'` for present and then, `'dim'` for else
- **Note:** The default is 'light', which never equals 'dark', so defaulted then contradicts itself. That leaves 3 arm combinations, not 4.
- **Today:** Assayer does not name the destructuring default as a branch.

#### `arrow › object › object › object › ternary` (level 3)

Folder: `src/deep/literal-object-3`

```ts
export const entry = (count: number) => ({
  user: {
    profile: {
      label: count > 2 ? 'big' : 'small',
    },
  },
});
```

- **Expected branches:** `ternary` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The ternary sits in a value position three objects down. Its arms meet again inside the object, and the function has one exit.

#### `arrow › array › object › arrow function › ternary` (level 3)

Folder: `src/deep/literal-array-object-method`

```ts
export const entry = (count: number) => [
  {
    name: 'first',
    check: (): string => (count > 2 ? 'big' : 'small'),
  },
];
```

- **Expected branches:** `ternary exit` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** A test calls entry, takes the first element, then calls check. The ternary is the exit of check, so it splits into one exit per arm.

## Return types and exits

The return type is the type axis at the other end of a function. Every section above returns a plain `string`. This section varies how an arm leaves: a value from a union of literals, a promise, nothing but a side effect, or a thrown error. A `yield` has its own container, the generator function.

A call is the reach-in piece for a function, the way `.count` is for an object. When a caller branches on what a call returns, the value flows from one function's exit into another function's branch.

#### `literal union return › caller branches on it`

Folder: `src/return/literal-union-consumed`

```ts
const classify = (count: number): 'big' | 'small' => (count > 2 ? 'big' : 'small');

export const entry = (count: number): string => {
  if (classify(count) === 'big') {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `ternary exit` (then, else); `if` (then, else)
- **Every route (5):**
  - `count 3`: ternary then, if then
  - `count 2`: ternary else, if else
  - `count 0`: ternary else, if else
  - `count NaN`: ternary else, if else
  - `count -1`: ternary else, if else
- **Fewest runs:** 2
- **Note:** The return type names both values, so Assayer can list them from the type alone. The if's arm follows from the ternary's arm.

#### `async › Promise return`

Folder: `src/return/promise`

```ts
export const entry = async (count: number): Promise<string> => {
  if (count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then, resolves
  - `count 2`: else, resolves
  - `count 0`: else, resolves
  - `count NaN`: else, resolves
  - `count -1`: else, resolves
- **Fewest runs:** 2
- **Note:** Each arm exits as a resolved promise. A test awaits the call.

#### `void › side effect only`

Folder: `src/return/void-side-effect`

```ts
export const entry = (count: number): void => {
  if (count > 2) {
    console.log('big');
  }
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: then, logs
  - `count 2`: else, does nothing
  - `count 0`: else, does nothing
  - `count NaN`: else, does nothing
  - `count -1`: else, does nothing
- **Fewest runs:** 2
- **Note:** Nothing is returned. The then arm shows only as a side effect, and the else arm does nothing. Both are still arms.

#### `throw as an arm`

Folder: `src/return/throw`

```ts
export const entry = (count: number): number => {
  if (count < 0) {
    throw new Error('count must be 0 or more');
  }
  return count;
};
```

- **Expected branches:** `if` (then, else)
- **Every route (3):**
  - `count -1`: then, throws
  - `count 0`: else, returns
  - `count NaN`: else, returns
- **Fewest runs:** 2
- **Note:** The then arm exits by throwing: a fourth way an arm can leave, next to return, log and yield. A test for it expects the throw. The generator kit has no throw arm yet.

## Retyping

Two different things change a type. A cast, such as `as`, `!` or `as const`, changes what the type checker believes and does nothing at run time. A type check, such as `typeof` or a guard function, runs at run time and narrows the type on each arm. Both are expression pieces. Neither branches on its own.

Casts matter because Assayer picks input values from types. A cast can make the type say something the value does not.

#### `unknown › as number › if`

Folder: `src/retype/as-from-unknown`

```ts
export const entry = (raw: unknown): string => {
  const count = raw as number;
  if (count > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** gap: entry.raw: Assayer cannot build a value of type unknown
- **Every route (0):**
  - `no case`: Assayer cannot build raw until the gap is paid
- **Fewest runs:** none until a harness supplies raw
- **Note:** The cast does not change what Assayer builds. A harness pays the gap, or the author types raw as number. The error text may suggest the second.

#### `number | undefined › ! › if`

Folder: `src/retype/non-null`

```ts
export const entry = (count: number | undefined): string => {
  if (count! > 2) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (6):**
  - `count undefined`: else
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** Assayer builds count from its declared type, number | undefined, so it tries undefined. The ! changes what the type checker believes at that line, never what Assayer builds. undefined > 2 is false.

#### `number | string › typeof › if`

Folder: `src/retype/typeof`

```ts
export const entry = (value: number | string): string => {
  if (typeof value === 'string') {
    return 'text';
  }
  return 'number';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (6):**
  - `value 'a'`: then
  - `value ''`: then
  - `value 1`: else
  - `value 0`: else
  - `value NaN`: else
  - `value -1`: else
- **Fewest runs:** 2
- **Note:** Each union member takes one arm, and each edge value of a member lands on that member's arm. Assayer reads that from the type, so this is fully declared as data.

#### `unknown › guard function › if`

Folder: `src/retype/guard`

```ts
const isCount = (value: unknown): value is number => typeof value === 'number';

export const entry = (value: unknown): string => {
  if (isCount(value)) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (8):**
  - `value 1`: then
  - `value 0`: then
  - `value NaN`: then
  - `value -1`: then
  - `value 'a'`: else
  - `value ''`: else
  - `value null`: else
  - `value undefined`: else
- **Fewest runs:** 2
- **Note:** Both arms are driven. The guard says value is a number on the then arm, so Assayer builds then from number, with its edge values. For else it builds a value the guard rejects: a string, with its edge value, plus null and undefined, which unknown allows.
- **Today:** Assayer cannot build a value of type unknown, so it reports a gap for value instead of driving the guard.

#### `as const › union › switch`

Folder: `src/retype/as-const`

```ts
const modes = ['a', 'b'] as const;

export const entry = (mode: (typeof modes)[number]): string => {
  switch (mode) {
    case 'a':
      return 'first';
    case 'b':
      return 'second';
  }
};
```

- **Expected branches:** `switch` (case 'a', case 'b')
- **Every route (2):**
  - `mode 'a'`: case 'a'
  - `mode 'b'`: case 'b'
- **Fewest runs:** 2
- **Note:** as const turns a plain list into the union a | b. That is what lets Assayer list every case from the type.

## File boundary

Every card above keeps the callee in the same file. Moving it changes what Assayer can do, and none of these cases is about where a value comes from, so this is its own axis.

| Where the callee lives | What Assayer should report |
|---|---|
| same file | The branch is driven. Assayer follows the call. |
| sibling file, imported | Undriven in the file's own analysis. Driven when the test runs, through the cross-file overlay. |
| behind a barrel file | The same, after Assayer follows the barrel to the real definition. |
| npm package | Assayer reads the callable's declared types from its `.d.ts` file. It never runs it. |
| Node builtin | The same, read through the builtin's global declaration. |
| cannot resolve | A P1 build error at the call site: `cannot-resolve-specifier`, `dynamic-or-computed-specifier` or `no-usable-types`. Never an admission. |

#### `sibling import › if`

Folder: `src/boundary/sibling`

`is-big.ts`:

```ts
export const isBig = (value: number): boolean => value > 2;
```

`entry.ts`:

```ts
import { isBig } from './is-big';

export const entry = (count: number): string => {
  if (isBig(count)) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** undriven: in entry.ts's own analysis
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** Driven when the test runs, through the cross-file overlay. The same card with a barrel file between the two, or with an import path that does not exist, makes the other rows of the table above.

## Consumption

An obligation attaches only where a value is consumed. So the same branch reports differently depending on what happens to its value afterwards: it is returned, stored then returned, passed to a call, compared, or never read.

#### `ternary stored, never read`

Folder: `src/consume/never-read`

```ts
export const entry = (count: number): string => {
  const label = count > 2 ? 'big' : 'small';
  console.log('checked');
  return 'done';
};
```

- **Expected branches:** none
- **Other expected reports:** lint, error: label is declared but never read
- **Every route (1):**
  - `any count`: returns done
- **Fewest runs:** 1
- **Note:** Nothing consumes the ternary's value, so it owes no test. The lint tells the repo to delete it or use it.
- **Today:** Assayer has no lint for an unused local.

#### `ternary passed to a call`

Folder: `src/consume/passed-to-call`

```ts
const shout = (text: string): string => text.toUpperCase();

export const entry = (count: number): string => {
  const label = count > 2 ? 'big' : 'small';
  return shout(label);
};
```

- **Expected branches:** `ternary` (then, else)
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The value is consumed by a same-file call, then returned. Compare the stored-then-returned card in the const section, where the ternary becomes the exit itself.

#### `exported, never imported`

Folder: `src/consume/dead-export`

`helpers.ts`:

```ts
export const isBig = (count: number): boolean => count > 2;

export const isHuge = (count: number): boolean => count > 10;
```

`entry.ts`:

```ts
import { isBig } from './helpers';

export const entry = (count: number): string => {
  if (isBig(count)) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** undriven: in entry.ts's own analysis; lint, error: isHuge is declared but never read
- **Every route (5):**
  - `count 3`: then
  - `count 2`: else
  - `count 0`: else
  - `count NaN`: else
  - `count -1`: else
- **Fewest runs:** 2
- **Note:** The smoke repo's package.json declares each specimen's entry file as an entry point, here entry.ts, so entry itself is never flagged. helpers.ts is not an entry point. entry.ts imports isBig, so isBig is read. Nothing imports isHuge and no entry point reaches it, so it gets the never-read lint, and its comparison owes no test. The if is driven when the test runs, through the cross-file overlay, as in the sibling-import card.
- **Today:** Assayer has no lint for an export that nothing reads.

## Shared mutable state

Some values depend on earlier calls: a module-level `let`, a `this` field, a variable a closure captures and changes. These work like loop variables. Each call is one pass, and a case can make several calls in a row to reach a later state.

#### `module let › if`

Folder: `src/state/module-let`

```ts
let calls = 0;

export const entry = (limit: number): string => {
  calls += 1;
  if (calls > limit) {
    return 'over';
  }
  return 'under';
};
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `limit 0, 1 call`: then
  - `limit NaN, 1 call`: else
  - `limit -1, 1 call`: then
  - `limit 1, 1 call`: else
  - `limit 1, 2 calls`: else, then
- **Fewest runs:** 1
- **Note:** A repeated call is one more pass of a loop. The case that makes two calls takes both arms, so it alone covers every arm. The "How a parent finds its states" section walks through this card.
- **Today:** Assayer stops following calls after the compound assignment, so the if is undriven.

#### `this field › method › if`

Folder: `src/state/this-field`

```ts
export class Counter {
  private calls = 0;

  public hit(limit: number): string {
    this.calls += 1;
    if (this.calls > limit) {
      return 'over';
    }
    return 'under';
  }
}
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `limit 0, 1 hit`: then
  - `limit NaN, 1 hit`: else
  - `limit -1, 1 hit`: then
  - `limit 1, 1 hit`: else
  - `limit 1, 2 hits`: else, then
- **Fewest runs:** 1
- **Note:** The same as the module counter, through a field. Each case constructs a fresh Counter, then calls hit once or several times in a row. The case that calls hit twice takes both arms, so it alone covers every arm.
- **Today:** Assayer stops following this.calls after the compound assignment, so the if is undriven.

## Where the value comes from

The source decides the verdict. Every section above uses a parameter. This section runs the plainest shape, `if (x > 2)`, through each source.

| Source | How the specimen gets `x` | Verdict | What Assayer should report |
|---|---|---|---|
| param | `export const entry = (x: number) => …` | driven | Both arms run. |
| literal | a call site `decide(3)` in the same file | locked | The arm 3 takes runs. The other arm is an unreachable exit, reported at the call site. |
| const | `const x = 5;` | locked | Only `then` runs. `else` is an unreachable exit, reported where `x` is read. |
| env, read at module load | `const x = Number(process.env.SIZE);` at the top level | driven | Both arms run. The test sets the variable before the module loads. |
| env, read in a function | the same read inside the entry's body | driven | Both arms run. Today Assayer does not drive this read (`ASSAYER-FINDINGS.md`). |
| argv | `const x = Number(process.argv[2]);` | half driven | The test worker has no arguments, so `process.argv[2]` is `undefined` and `NaN > 2` is false. The `else` arm is driven. The `then` arm is undriven. |
| random | `const x = Math.random() * 10;` | pinned | Not generated yet. Assayer would pin the builtin's result once per region of its range. |
| prop | `(box: { x: number }) => box.x` | driven when run | Undriven in the file's own analysis. Driven at run time from the stub view. |

## Known values from afar

A known value is a literal in code, a literal passed at a call site, or a value in a stub correction. It can sit several calls or several files away from the branch it decides. Each file records, for every arm, what must hold to enter it, and every consumer merges those records into its own.

When a known value rules an arm out, Assayer reports it at the consumption point: the place where the known value enters the chain. A literal in code or at a call site produces an unreachable-exit lint, because it is the repo's own dead code. A stub correction produces a P1 build error, because it is a person's claim about real data that contradicts the code, and someone has to settle which one is wrong. The lint carries a path trace, which lists every step from the consumption point down to the dead arm. Where no known value reaches a branch, Assayer flags nothing and assumes every arm is reachable. A test input that never reached an arm is never evidence that the arm is dead.

#### `call-site literal · two calls up`

Folder: `src/known/call-site-literal`

```ts
const label = (size: number): string => {
  if (size > 2) {
    return 'big';
  }
  return 'small';
};

const measure = (size: number): string => label(size);

export const entry = (): string => measure(5);
```

- **Expected branches:** `label if` (then, else)
- **Other expected reports:** lint: unreachable exit at `measure(5)` in entry: the else arm of label's if, which returns 'small', can never run
- **Path trace:** `entry`: `measure(5)` passes size 5 → `measure`: `label(size)` passes size 5 → `label`: `if (size > 2)` takes then for 5, so else is dead
- **Every route (1):**
  - `no input`: label then, exits big
- **Fewest runs:** 1
- **Note:** entry takes no parameter, so no test can change size. The literal 5 enters at measure(5), so the lint lands there, not on the if. The if itself has nothing wrong with it.
- **Today:** Assayer reports a dead arm on the function that holds it, not at the consumption point, and gives no path trace.

#### `env at module load · two files down`

Folder: `src/known/env-two-files`

`entry.ts`:

```ts
import { applyLimit } from './apply-limit';

const limit = process.env.STRICT ? 5 : 10;

export const result = applyLimit(limit);
```

`apply-limit.ts`:

```ts
import { checkLimit } from './check-limit';

export const applyLimit = (limit: number): string => checkLimit(limit);
```

`check-limit.ts`:

```ts
export const checkLimit = (limit: number): string => {
  if (limit > 20) {
    return 'unbounded';
  }
  return 'bounded';
};
```

- **Expected branches:** `entry.ts ternary` (then, else); `checkLimit if` (then, else)
- **Other expected reports:** lint: unreachable exit at `applyLimit(limit)` in entry.ts: the then arm of checkLimit's if, which returns 'unbounded', can never run
- **Path trace:** `entry.ts`: `applyLimit(limit)` passes limit 5 or 10 → `apply-limit.ts`: `checkLimit(limit)` passes limit 5 or 10 → `check-limit.ts`: `if (limit > 20)` takes else for both, so then is dead
- **Every route (3):**
  - `STRICT '1'`: ternary then, checkLimit else
  - `STRICT ''`: ternary else, checkLimit else
  - `STRICT unset`: ternary else, checkLimit else
- **Fewest runs:** 2
- **Stub values Assayer derives:** `STRICT`: `'1'` for then, unset for else
- **Note:** The environment variable picks which literal limit holds. Both literals are known, and neither is above 20. They enter the chain at applyLimit(limit), so the lint lands there. The smoke repo's package.json declares only entry.ts as an entry point, so applyLimit and checkLimit have no other caller. If check-limit.ts were an entry point, an outside caller could pass any number, and Assayer would flag nothing. result is exported from the entry point, so it is read.
- **Today:** Assayer follows a known value only within one file, and only when it is a single value, so it flags nothing here.

#### `stub correction · two calls down`

Folder: `src/known/stub-correction`

`entry.ts`:

```ts
type Job = { priority: number };

const rank = (job: Job): string => {
  if (job.priority > 5) {
    return 'urgent';
  }
  return 'normal';
};

const triage = (job: Job): string => rank(job);

export const entry = (job: Job): string => triage(job);
```

`assayer/stubs/objects/packages/syntax-repository/src/known/stub-correction/entry.ts/Job.json`:

```json
{
  "type": "packages/syntax-repository/src/known/stub-correction/entry.ts#Job",
  "properties": {
    "priority": { "values": [1, 2, 3] }
  }
}
```

- **Expected branches:** `rank if` (then, else)
- **Other expected reports:** P1 build error at entry's parameter job: the stub correction Job.json gives priority only 1, 2 or 3, so the then arm of rank's if, which returns 'urgent', can never run. The error names the stub file, the property and the guard, and carries the path trace.
- **Path trace:** `Job.json`: priority is 1, 2 or 3 → `entry`: `triage(job)` → `triage`: `rank(job)` → `rank`: `if (job.priority > 5)` takes else for all three, so then is dead
- **Every route (3):**
  - `{ priority: 1 }`: else
  - `{ priority: 2 }`: else
  - `{ priority: 3 }`: else
- **Fewest runs:** 1
- **Stub values Assayer derives:** `job.priority`: `6` for then, `5` for else
- **Note:** The correction is not stale, because Job still has priority. Its values are the only ones priority can take, so each is a case, and none of them is above 5. The values enter at entry's parameter job, so the error lands there, with the stub file as the first step of the trace. Assayer derives 6 for the then arm. The correction rules 6 out, which is what makes the arm dead. The routes are what the cases would be once the error is settled.
- **Today:** Assayer reports a P1 build error that names the stub file, priority and the guard in rank, and asks the reader to rectify the stub. It does not name the consumption point or give a path trace.

#### `no known value · nothing is flagged`

Folder: `src/known/no-known-value`

```ts
const label = (size: number): string => {
  if (size > 2) {
    return 'big';
  }
  return 'small';
};

const measure = (size: number): string => label(size);

export const entry = (size: number): string => measure(size);
```

- **Expected branches:** `label if` (then, else)
- **Every route (5):**
  - `size 3`: label then, exits big
  - `size 2`: label else, exits small
  - `size 0`: label else, exits small
  - `size NaN`: label else, exits small
  - `size -1`: label else, exits small
- **Fewest runs:** 2
- **Note:** The same chain as the call-site literal card, with entry's parameter in place of the literal. No known value reaches the if, so Assayer flags nothing and treats both arms as reachable.

## Every report channel

Each card predicts every channel, not just branches. Each admission is reported on its own line, and they are never merged, because each one names who owes the fix.

| Channel | Who owes the fix | A specimen that should produce it |
|---|---|---|
| driven routes | nobody | any card with a parameter source |
| unreachable-exit lint, reported at the consumption point where the known value enters, with the full path trace down to the dead arm | the repo | a const source, every card in the "Known values from afar" section but the contrast card, or `if (mode)` on a union with no falsy member |
| declared but never read (fails the build by default, through `deadSurface`) | the repo | the consumption cards, the unused-argument iterative |
| edge-value merge lint (warns by default, one global toggle per rule) | the repo | every card in the edge values section |
| undriven | Assayer | argv, a returned closure, state written by an opaque call |
| dark spot | Assayer | every loop and `try` today |
| gap | the caller | a callback parameter with no harness |
| P1 build error | the repo | an import that cannot resolve, a stale stub correction, a stub correction that kills an arm (`known/stub-correction`) |

The companion-files axis takes a specimen with a gap, or with an object parameter, and adds a harness file or a stub correction beside it. The pair below is the same source file with and without its harness.

#### `callback parameter, no harness`

Folder: `src/companion/callback/no-harness`

```ts
export const entry = (count: number, check: (value: number) => boolean): string => {
  if (check(count)) {
    return 'then';
  }
  return 'else';
};
```

- **Expected branches:** `if` (then, else)
- **Other expected reports:** gap: entry.check: Assayer cannot build a function
- **Every route (0):**
  - `no case`: Assayer cannot build check until the gap is paid
- **Fewest runs:** none until a harness supplies check
- **Note:** The caller owes this. A harness file pays it.

#### `the same file, with a harness`

Folder: `src/companion/callback/with-harness`

`entry.ts`:

```ts
export const entry = (count: number, check: (value: number) => boolean): string => {
  if (check(count)) {
    return 'then';
  }
  return 'else';
};
```

`entry.harness.ts`:

```ts
import { assayerHarness } from '@assayer/core';

assayerHarness({ inputs: { entry: { check: (value: number): boolean => value > 2 } } });
```

- **Expected branches:** `if` (then, else)
- **Every route (5):**
  - `count 3`: check true, then
  - `count 2`: check false, else
  - `count 0`: check false, else
  - `count NaN`: check false, else
  - `count -1`: check false, else
- **Fewest runs:** 2
- **Note:** The gap closes. The harness supplies check, and count drives the if through it.
