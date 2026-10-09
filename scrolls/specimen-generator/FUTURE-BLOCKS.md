# Specimen generator: future building blocks

This is a list of building blocks we might add later. Each one tests whether the config can absorb a
new block with one small change, or whether the config's shape has to change. `SAMPLE-CONFIG.md` shows
the config as it is now. `PLAN.md` says which file each kind of block is added in.

A sub-agent stress-testing the config takes some of these blocks and writes out the config change each
one needs. A block that needs changes in more than one place, or a new kind of prop, is a finding.

## Containers

1. Class method, both instance and static
2. Arrow function assigned to an exported const
3. Immediately invoked function (IIFE)
4. Object method, such as `{ run() { ... } }`
5. Default export
6. TSX component body
7. Async function, where the syntax sits after an `await`
8. Generator function
9. A callback passed to `.map`, `.filter` or `.forEach`
10. Nested function: the syntax sits two functions deep
11. Constructor body

## Values for primitive types

1. `NaN`, `Infinity` and `-Infinity` for numbers
2. `-0` for numbers
3. Decimals, such as `0.5`, for an index
4. Very large numbers past the safe integer limit
5. The empty string, and strings with non-ASCII characters
6. `null` and `undefined` where the type allows them
7. `bigint`

## Types

1. `readonly T[]` and tuples, such as `[number, string]`
2. `Set<T>` and `Map<K, V>`
3. Object types with optional properties
4. Enums, both numeric and string
5. Branded types
6. A type imported from a sibling file
7. A generic function's own type parameter, such as `function f<T>(xs: T[])`

## Chains feeding a hole

1. `{chain}.slice(1)` and `{chain}.filter(...)` feeding an array hole
2. `{chain}.map(...)` feeding an array hole
3. Spread, such as `[...a, ...b]`
4. Optional chain, such as `{chain}?.at(0)`
5. Destructuring, such as `const [first] = {chain}`
6. A sibling file's exported const feeding any hole
7. The return value of another function in the same file
8. An object property read, such as `config.items.at(0)`
9. A ternary whose result is assigned to a variable, then used in a hole. Assayer should record the
   assignment as an inline exit, so it can follow the value back up the chain

## Syntax

1. `includes`, `indexOf`, `findLast` and `at` on strings
2. `Object.keys(...)` and `Object.entries(...)`
3. Template literals
4. `typeof x === 'string'` narrowing
5. `instanceof`
6. `try` / `catch` / `finally`
7. Loops: `for`, `for...of`, `while`
8. `??` and `||` defaults
9. Destructuring with default values
10. `switch` with one `case` per member of a literal union. The template needs a way to repeat one arm per
    member.
11. Library calls in their own group, such as `react/create-element`

## Sources

1. A default parameter value, such as `function f(i = 2)`
2. A rest parameter
3. A destructured parameter
4. `process.env.X`
5. An enum member
6. A value re-exported through a barrel file
7. A class field

## Outcomes the rules may need

1. A P1 build error, such as a refusal to accept two copies of one union
2. A dark spot that later becomes supported, which moves the specimen's verdict from unclean to clean
3. A gap that a harness pays off: the same specimen generated with and without a harness file
4. Two syntaxes nested, such as an `if` inside a `switch` arm
5. A specimen that should fail at run time, such as a case that throws
