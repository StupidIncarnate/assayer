# Specimen generator: where the repo's lint and typecheck rules conflict with the config files

The generator's config files have to meet the repo's standards. This file measures how far the
prototype's config files are from that, and what each conflict means for the config format.

The generated specimens are not part of this question. They live under `smoke-repo/`, which the root
`eslint.config.js` ignores, because the smoke repo is consumer code Assayer analyzes, not code written to
the dungeonmaster standards. TypeScript alone judges the specimens, and the generator already refuses any
specimen TypeScript rejects.

## How it was measured

On 2026-10-08, the prototype's 25 declaration files were copied into `packages/core/test/specimen-probe/`:

| Kind | Files |
|---|---|
| Containers | 10 |
| Syntax | 6 |
| Shims | 5 |
| Settings: `types.ts`, `provenances.ts`, `matrix.ts` | 3 |
| The marker kit, `kit.ts` | 1 |

`packages/core/test/` is where the specimen registry and catalogue already live, so it is the likeliest
home. Then `npm run ward -- --only lint -- <those files>` ran on the copies, and the copies were deleted.

Ward typechecks before it lints. The first run stopped at the typecheck. For a second run, each container
copy was marked `// @ts-nocheck` so lint could run. That marker caused 10 lint violations of its own, which
the counts below leave out.

The generator and its config files will live outside `packages/`. That placement was not measured. The root
`eslint.config.js` matches every `.ts` file it does not ignore, so a folder outside `packages/` still gets
these rules. Whether ward checks that folder at all, and which other rules apply there, still needs
checking.

## Typecheck: 25 errors, all in containers

| Error | Where | Why |
|---|---|---|
| A name is declared but never read (TS6133, TS6196) | every container | `$Entry` and `$params` are markers. The container never reads them, because the generator replaces them |
| Unreachable code (TS7027) | `module.container.ts` | The statement slot is typed `never`, so the line after it cannot be reached |

## Lint: 71 violations

| Kind | Violations | Rules |
|---|---|---|
| Containers | 40 | `no-unused-vars` 23, `no-unsafe-assignment` 6, `func-style` 4, `member-ordering` 3, `class-methods-use-this` 2, `func-names` 1, `require-yield` 1 |
| Kit | 20 | `no-explicit-any` 4, `enforce-object-destructuring-params` 4, missing return types 9 across three rules, `no-unnecessary-type-parameters` 1, `parameter-properties` 1, `only-throw-error` 1 |
| Settings | 5 | `no-magic-numbers` 5, all in `types.ts` |
| Syntax | 3 | `no-unnecessary-type-parameters` 3: `if`, `ternary`, `not` |
| Shims | 3 | `no-unnecessary-type-parameters` 1 (`array-length`), `no-negated-condition` 1 and `no-self-compare` 1 (both from `array-at`'s `index !== index`) |

Lint did not flag, in this placement:

- the positional parameters of a syntax or shim's `code` arrow
- missing `PURPOSE` headers
- the file names
- the `$`-prefixed marker names
- `declare const` in the kit

## What each conflict means

### 1. Container code is consumer code with holes, so the rules forbid what it exists to show

A container shows the shapes real repos write: a function declaration, a class whose methods ignore
`this`, a generator, an unnamed function expression. The repo's rules forbid exactly those shapes. That
accounts for every typecheck error and 40 of the 71 lint violations. Rewriting the containers cannot fix it
without removing the thing each container exists to show.

| Option | Cost |
|---|---|
| Keep containers where consumer code lives, under `smoke-repo/`, which lint ignores | None of these conflicts remain. The smoke repo's `tsconfig.json` sets `strict` but not `noUnusedLocals`, `noUnusedParameters` or `allowUnreachableCode: false`. Those three come from the root `tsconfig.base.json`, and they are what reject the markers. One catch: a non-test `.ts` file in the syntax-repository package joins the surface Assayer analyzes, per `packages/core/CLAUDE.md` section 8. So containers need a folder under `smoke-repo/` that Assayer does not analyze. Which folders qualify is not checked yet |
| Write each container's code as a string the generator parses | No editor help while writing a container. The generator still parses the string into a syntax tree and swaps nodes, so it still never edits text |
| An `eslint-disable` comment in each container | Ruled out. It is a per-site waiver, which the root `CLAUDE.md` forbids |

### 2. A type parameter used once is flagged

`no-unnecessary-type-parameters` flags a generic whose type parameter appears once in the signature:
`if`'s `<T>(cond: T)`, `ternary`, `not` and `array-length`. That is exactly the shape that says "any type
fits this hole". The rule's suggested fix is `unknown`, which would leave the generator nothing to make one
instance per type from.

| Option | Effect |
|---|---|
| A kit marker type, `$T`, written where the type parameter would go: `(cond: $T)` | The generator treats `$T` as the type parameter and still makes one instance per type. A constraint needs its own marker or prop |
| A `typeArguments` prop beside `code`, with `unknown` in the signature | The generator substitutes from the prop. One fact moves out of the code |

### 3. The kit breaks rules that its real version would simply follow

The kit is generator code, so a real version is written to the standards like any other code:

- The config shapes become contracts.
- Every exported function gets a return type.
- `ArmReached` extends `Error`, which also satisfies `only-throw-error`.
- `any` goes.

One change reaches every config file. The rule that a function takes one destructured object applies to
the markers, so `$arm('then')` becomes `$arm({ arm: 'then' })`, and `$stmts('body')` becomes
`$stmts({ slot: 'body' })`.

### 4. `types.ts` holds numbers as data

The samples `[10, 20, 30]` and the known value `3` are data. The repo keeps data numbers in `statics/`
files, where `no-magic-numbers` allows them. So the type list belongs in a statics file.

### 5. One shim line trips two rules

`index !== index` is the `NaN` check in `array-at`. The lint fix is `Number.isNaN(index)`, which is a
builtin. That fits the shim rules: every base builtin gets a shim, and a shim may call other shims. So
`Number.isNaN` gets a shim, and `array-at` calls it.

### 6. Positional `code` parameters pass for now

The syntax and shim `code` arrows take positional parameters, and lint did not flag them in this placement.
If a placement or a rule change ever flags them, each hole can be one property of a single destructured
object, `({ value, limit }: { value: T; limit: T })`. The generator can read hole names from that pattern
as easily as from a parameter list.

## Decisions the format needs before the real generator is built

1. Where containers live. A folder under `smoke-repo/` that Assayer does not analyze removes every
   container conflict.
2. How a type parameter that appears once is declared.
3. Whether markers take one object, as the lint rule requires.
4. Which folder outside `packages/` the generator and its config files sit in, and how ward runs their
   lint, typecheck and tests there.
