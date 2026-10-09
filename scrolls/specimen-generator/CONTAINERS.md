# Specimen generator: containers as typed slots

This file defines containers generically. A container is a template with typed slots. A slot accepts any
piece of code whose kind and type fit it, and nothing else. A syntax is the same thing: a template whose
holes are typed slots. So one set of rules decides what may go where, for containers and syntaxes alike.

`PLAN.md` explains the generator itself. `PROTOTYPE-2.md` shows the config files as the prototype writes
them.

## Notation

In this file, a slot is written in double braces: `{{kind: type}}`. The notation is for reasoning about
slots. A config file writes slots as markers in real TypeScript instead: `$stmts('slot')`,
`$expr('slot')`, `$params`, `$R` and `$Entry`. `PROTOTYPE-2.md` explains the markers.

| Slot | What it accepts | Example fill |
|---|---|---|
| `{{name}}` | An identifier. The generator picks it. Nothing else may fill it | `classify`, `items` |
| `{{bind: T}}` | Something that declares names holding a `T`: an identifier, or a destructuring pattern | `n`, `{ size }`, `[first]` |
| `{{expr: T}}` | Any expression whose type is assignable to `T` | for `number`: `2`, `n`, `s.length`, `n % 3`, `n ?? 0` |
| `{{stmts: R}}` | A list of statements. Every way out of the list returns an `R`. `R` is `void` when nothing is returned | see "What a statement slot accepts" |
| `{{params}}` | Zero or more parameters, separated by commas | `n: number, items: string[]` |
| `{{members}}` | Zero or more class or object members | see "Members" |
| `{{type}}` | A type. The generator picks it from the type list | `number`, `string[]` |

Three rules follow from this notation:

1. **A name slot is never filled by a value.** `function {{name}}(...)` takes `classify`. It never takes
   `'a'`, `2`, or a syntax.
2. **An expression slot is filled by type, not by a fixed list.** `.at({{expr: number}})` accepts every
   expression that produces a `number`: `at(2)`, `at(n)`, `at(2 % 3)`, `at(n ?? 0)`, `at(s.length)`,
   `at(flag ? 1 : 2)`. A new syntax that produces a `number` fills every `number` slot without any edit to
   the syntaxes that have those slots.
3. **A statement slot never takes a bare value.** `'a';` and `n;` are legal TypeScript but not good code.
   They do nothing. A statement slot takes only the statements listed below.

## The generic containers

### Callables

Every function-like container is one generic shape with a different header:

```
{{header}}({{params}}): R {
  {{stmts: R}}
}
```

| Callable | Header and body | `R` inside the body | How a test reaches it |
|---|---|---|---|
| Function declaration | `function {{name}}({{params}}): R { {{stmts: R}} }` | `R` | call it |
| Arrow, block body | `const {{name}} = ({{params}}): R => { {{stmts: R}} }` | `R` | call it |
| Arrow, expression body | `const {{name}} = ({{params}}): R => {{expr: R}}` | none: the body is an expression slot | call it |
| Function expression | `const {{name}} = function ({{params}}): R { {{stmts: R}} }` | `R` | call it |
| Async function | `async function {{name}}({{params}}): Promise<R> { {{stmts: R}} }` | `R` | call it and await it |
| Generator function | `function* {{name}}({{params}}): Generator<R> { {{stmts: void}} }` | `void`. Values leave through `yield {{expr: R}};` | call it and read what it yields |
| Method | `{{name}}({{params}}): R { {{stmts: R}} }`, inside `{{members}}` | `R` | call it on an instance or object |
| Getter | `get {{name}}(): R { {{stmts: R}} }`, inside `{{members}}` | `R`. No parameters | read the property |
| Setter | `set {{name}}({{param: T}}) { {{stmts: void}} }`, inside `{{members}}` | `void`. Exactly one parameter | assign the property |
| Constructor | `constructor({{params}}) { {{stmts: void}} }`, inside class `{{members}}` | `void` | construct the class |
| IIFE (immediately invoked function) | `(({{params}}): R => { {{stmts: R}} })({{args}})` | `R` | load the module |

A callable's header decides three things: how a test reaches it, which statement ends its body, and
whether it takes parameters. Nothing else about a callable differs. A new callable is one new row.

### Parameters

```
{{params}} = {{param}}, {{param}}, ...

{{param}} = {{bind: T}}: T
          | {{bind: T}}: T = {{expr: T}}
          | ...{{bind: T[]}}: T[]
          | {{bind: T}}?: T
```

So a parameter list has its own slots. A default value is an expression slot typed by the parameter's
type. A binding can be a plain name or a destructuring pattern.

| Parameter form | Example |
|---|---|
| Plain | `n: number` |
| Default value | `n: number = 2 % 3` |
| Rest | `...items: number[]` |
| Optional | `n?: number` |
| Destructured | `{ size }: { size: number }` |
| Destructured with a default | `{ size = 0 }: { size?: number }` |

### Members

```
class {{name}} {
  {{members}}
}

{
  {{members}}
}
```

| Member | Class | Object literal | Slots it holds |
|---|---|---|---|
| Field | `{{name}}: T = {{expr: T}};` | `{{name}}: {{expr: T}}` | one expression slot |
| Static field | `static {{name}}: T = {{expr: T}};` | none | one expression slot |
| Method | a method callable | a method callable | parameters and a statement slot |
| Getter, setter | the callables above | the callables above | a statement slot |
| Constructor | the constructor callable | none | parameters and a statement slot |

### Module level

A file is itself a statement slot, with a few extra statements allowed only at the top:

```
{{module}} = {{top}}
             {{top}}
             ...

{{top}} = export const {{bind: T}} = {{expr: T}};
        | export {{callable}}
        | export class {{name}} { {{members}} }
        | export default {{expr: T}};
        | {{stmt}}                       a plain statement, from the list below
```

A plain statement at the top level runs when the module loads. A test can only give it a value through
`process.env`, or by pinning a builtin such as `Math.random()`.

## What a statement slot accepts

`{{stmts: R}}` is a list of these statements. It must end in a way out that matches `R`.

| Statement | Shape | Slots it holds |
|---|---|---|
| Const | `const {{bind: T}} = {{expr: T}};` | a binding, an expression |
| Let and assign | `let {{name}}: T = {{expr: T}};` then `{{name}} = {{expr: T}};` | expressions |
| If | `if ({{expr: boolean}}) { {{stmts: R}} } else { {{stmts: R}} }` | a condition, two statement lists |
| Switch | `switch ({{expr: T}}) { case {{expr: T}}: {{stmts: R}} ... default: {{stmts: R}} }` | a subject, one case value and list per arm |
| For of | `for (const {{bind: T}} of {{expr: T[]}}) { {{stmts: R}} }` | a binding, an iterable, a body |
| While | `while ({{expr: boolean}}) { {{stmts: R}} }` | a condition, a body |
| Try | `try { {{stmts: R}} } catch { {{stmts: R}} } finally { {{stmts: void}} }` | three statement lists |
| Return | `return {{expr: R}};` | one expression, typed by the enclosing callable |
| Yield | `yield {{expr: R}};` | one expression. Only inside a generator |
| Throw | `throw {{expr: Error}};` | one expression |
| Effect | a call, an assignment, `await {{expr}}`, `++`, `--`, as a statement | the call's or assignment's own slots |

An expression may stand alone as a statement only when it has an effect: a call, an assignment, an
`await`, an increment. `'a';`, `n;` and `s.length;` do nothing and are never generated.

Every name a statement declares must be read later in the same scope. A name nobody reads is dead surface.
Assayer reports dead surface as a lint, so an unread name is generated only by a specimen that tests that
lint.

## What an expression slot accepts

`{{expr: T}}` is filled by any expression whose type fits `T`. Each expression syntax declares the type it
produces and the typed slots it holds. Here are the `number` producers as an example:

| Produces `number` | Shape | Slots it holds |
|---|---|---|
| Literal | `2`, `-1`, `0.5` | none |
| A name in scope | `n` | none. It reads a parameter, const or binding |
| String length | `{{expr: string}}.length` | a string |
| Array length | `{{expr: T[]}}.length` | an array |
| Arithmetic | `{{expr: number}} % {{expr: number}}`, and the other operators | two numbers |
| Nullish default | `{{expr: number \| undefined}} ?? {{expr: number}}` | a maybe-number, a number |
| Ternary | `{{expr: boolean}} ? {{expr: number}} : {{expr: number}}` | a condition, two numbers |
| Call | `{{name}}({{args}})`, where the callee returns `number` | its arguments |
| Index read | `{{expr: number[]}}[{{expr: number}}]` | an array, an index |

So `chain.at({{expr: number}})` can become `chain.at(2 % 3)`, `chain.at(n ?? 0)` or
`chain.at(text.length)`. `chain.at('a')` is never generated, because `'a'` is a `string`. The same check
rules out `2 % 's'`, because `%` takes two numbers.

Only the slot's type matters. The syntax that holds the slot does not list which syntaxes may fill it.
`string-length` produces a `number`, so it fills every `number` slot.

## A container with more than one slot

Every generic shape above has several slots. A function declaration has a name, parameters, maybe default
values, a return type and a body. A class has many members, each with its own slots. A specimen still has
to test one thing at a time.

### Rule 1. One slot is in focus

Each specimen puts the syntax under test in exactly one slot. That slot is the focus. A specimen with two
syntaxes under test cannot say which one broke.

### Rule 2. Every other slot gets its plainest legal fill

Each slot kind and type has one plainest fill, declared once:

| Slot | Plainest fill |
|---|---|
| `{{name}}` | a name derived from the specimen's folder |
| `{{bind: T}}` | a plain identifier |
| `{{expr: T}}` | the hole's anchor, if its syntax declares one. Otherwise the first of `matrix.plainest` the slot offers: a parameter, then `env`, then a `const` |
| `{{stmts: R}}` | `return {{expr: R}};`, or nothing when `R` is `void` |
| `{{params}}` | the parameters other fills asked for, and no others |
| `{{members}}` | only the member that holds the focus |
| an optional slot, such as a default value | left out |

A plainest fill has no branch, so it adds no case, lint or admission of its own. The prediction for the
specimen then comes only from the syntax in focus.

### Rule 3. The focus moves through every slot that fits

For one syntax and one container, the generator writes one specimen per slot in that container whose kind
and type fit the syntax. An `if` fits every `{{stmts}}` slot. A ternary producing a `string` fits every
`{{expr: string}}` slot, and every `{{stmts}}` slot once wrapped in `return`.

### Rule 4. Nesting goes one level at a time

A syntax in focus has its own holes. Each hole is a typed slot, so any expression of the right type could
fill it, and that expression has holes too. Crossing every fill at every level never ends.

So nesting has a depth limit, `matrix.depth`. And exactly one leaf in the whole tree varies. That leaf
takes each provenance its slot offers: a parameter, `env`, a literal, a `const`, `Math.random()` or an
outside input. Every other leaf takes its anchor or its plainest fill. A deeper fill, such as `.length`
inside `.at`, is a specimen of its own.

## How a concrete container falls out of the generic ones

The concrete containers are the generic shapes with the focus placed in one slot:

| Concrete container | Generic shape | Slot in focus |
|---|---|---|
| Exported function, syntax in the body | function declaration | `{{stmts: R}}` |
| Default parameter value | function declaration | the default value's `{{expr: T}}` |
| Arrow with an expression body | arrow, expression body | `{{expr: R}}` |
| Class method | class, method member | the method's `{{stmts: R}}` |
| Constructor | class, constructor member | `{{stmts: void}}` |
| Field initializer | class, field member | the field's `{{expr: T}}` |
| Object property | object literal, field member | the property's `{{expr: T}}` |
| Module statement | module | a `{{top}}` plain statement |
| Exported const | module | the const's `{{expr: T}}` |
| IIFE | IIFE callable | its `{{stmts: R}}`, or one of its `{{args}}` |

Routes, such as a private helper between the entry and the syntax, are the same idea one level up. A
private helper is a second callable. The entry's body is `return {{name}}({{expr: T}});`, which calls the
helper, and the focus sits in the helper's body. `CALLABLES.md` covers calls: the callable's shape, where
each argument comes from, and what the caller does with the result.
