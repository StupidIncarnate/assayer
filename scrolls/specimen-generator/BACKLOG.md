# Specimen generator: building blocks still to declare

Each row is something to declare as a config file, or a setting to add. `PROTOTYPE-2.md` lists what is
declared already.

## Containers and slots

| Candidate | Notes |
|---|---|
| Setter body | `set value(v) { ... }`. Its arm cannot return a value |
| Constructor parameter properties | `constructor(private readonly n: number)`, read later through `this` |
| TSX component body, JSX child, JSX attribute | Needs a `.tsx` container. `react` would be the first group outside base JS |
| A function nested inside another | A call, so it belongs to the call layer in `CALLABLES.md` |
| A callback passed to `.map`, `.filter` or `.forEach` | A call to a shim that takes a callback. Waits for callback driving in Assayer |

## Syntax

| Candidate | Notes |
|---|---|
| `%`, `+`, `-`, `*` | Number expressions. Each fills every `number` hole |
| `&&`, `\|\|` | Boolean expressions, and short-circuit branches in their own right |
| `switch` | Needs one arm per member of a literal union, which the arm markers cannot express yet |
| `for`, `for...of`, `while` | Statements. `for...of` takes an `Iterable<T>` hole |
| `try` / `catch` / `finally` | Statements with three statement slots |
| `typeof x === 'string'`, `instanceof` | Narrowing checks |
| Template literals | String expressions |
| `?.` | Optional chaining |
| Destructuring with defaults, spread | Expressions with their own holes |

## Shims

Every builtin in the base library, from the inventory in `SHIMS.md`. The order:

1. Builtins that read their inputs and return a value: `.slice`, `.includes` on strings, `.indexOf`,
   `.startsWith`, `Number.isNaN`. `array-at` needs `Number.isNaN` to meet the lint rules, as `LINT.md`
   says.
2. Builtins no input decides, with a range or a pin function: `Date.now`, `crypto.randomUUID`.
3. Builtins that take a callback, once Assayer drives a callback passed to a callee.
4. Builtins that change their receiver, once the call layer covers a callee that changes its argument.

## Provenances

| Candidate | Notes |
|---|---|
| `prop`: a property of an object parameter | `STUBS.md` |
| The result of a call | `CALLABLES.md` |
| A name the callee captures from the caller's scope | `CALLABLES.md` |
| A default parameter value, a rest parameter, a destructured parameter | Parameter forms |
| An enum member | Known, from a declaration |
| A value re-exported through a barrel file | Crosses files |
| A class field | Read through `this` |

## Types

| Candidate | Notes |
|---|---|
| Union type arguments, such as `number \| undefined` | Needed for `if (maybeCount)`, likely the most common `if` in real code. Substituting a union into `readonly T[]` needs parentheses |
| Object shapes | `STUBS.md` |
| Tuples, `Set<T>`, `Map<K, V>` | |
| Enums, numeric and string | |
| Branded types | |
| A type imported from a sibling file | Crosses files |
| `bigint` | `gt`'s constraint would include it |

## Values

These change the values inside cases, not the number of specimens:

- `NaN`, `Infinity`, `-Infinity` and `-0` for numbers
- decimals, such as `0.5`, for an index
- numbers past the safe-integer limit
- the empty string, and strings with non-ASCII characters
- `null`, where a type allows it

## Outcomes the prediction rules do not cover yet

| Outcome | Where it comes from |
|---|---|
| A P1 build error | A stale or contradicting stub correction, in `STUBS.md` |
| A gap a harness pays | The same specimen generated with and without a harness file |
| A dark spot that later becomes supported | Moves a specimen's verdict from unclean to clean |
| A case that throws at run time | |
| Two syntax nodes nested in statement slots, such as an `if` inside a `switch` arm | Needs a statement slot inside a syntax, not just inside a container |
