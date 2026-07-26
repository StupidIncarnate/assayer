# Assayer — Followups

Work to do later. Three kinds of thing live in this file.

**Things Assayer cannot do yet.** It hits an input it cannot build, stops, and tells you
clearly what it could not build and why. Nobody is misled. Fixing one means teaching Assayer
to build that thing. Never fix one by softening the message.

**Code that is correct but keeps causing bugs.** It works today. It is here because the way
it is arranged makes the next change to it likely to be wrong. Fixing one means removing the
opportunity, not patching an instance.

**Known problems that are real but not urgent.** Filed here rather than in
`plan/open-defects.md` because they are scheduled work, not something to drop everything for.

If something here starts giving wrong answers that mislead a user, move it to
`plan/open-defects.md`.

Before writing down what the code does, run it. Use `npx tsx` with absolute import paths for
a single function, or the built CLI at `packages/cli/dist/bin/assayer.js` for anything end to
end.

Four commands check a change. They cover different things and none of them contains the
others, so run all four:

- `npm run ward`
- `npm run test:syntax`
- `npm run typecheck:syntax`
- `npm run test:eslint-rules`

---

## Three input types Assayer cannot build a value for

Each of these makes Assayer stop, produce no test cases, and exit 1 with a message naming the
type:

- `when: Date`
- `task: Promise<string>`
- `payload: Map<string, number>`

**Two different rules refuse them, for two different reasons.** Do not assume one fix closes
all three:

- `Date` and `Promise` are refused by the object rule in `is-type-fillable`. An object is
  fillable only when every one of its properties is fillable. Both types carry a long list of
  METHODS, a method is a callable, and a callable is never fillable. So one method refuses the
  whole type.
- `Map` never reaches that rule. The analyzer parses with `target: ES3`, whose library files
  declare `Date` and `Promise` but not `Map` or `Set`. Those live in a library file the walk
  never loads. So `Map<string, number>` is already opaque by the time it arrives, and it is
  refused by the `unknown` rule instead.

**Do not close these by making the guard say yes.** The value would still have to be built,
and there is nothing to build it with. `RepresentativeValue` holds only a string, a number, a
boolean, or null, and the part of Assayer that runs a case applies that value to the function
with no conversion at all. A `Map` parameter filled with a plain object is worse than a
refusal: reading `payload.size` gives `undefined`, both branches run without throwing, and
both cases report as passing against a value nobody supplied.

What closing them actually requires:

- the vocabulary that describes an arranged value has to gain a way to say "construct one of
  these", holding a type and a fixed set of arguments
- the part of Assayer that runs a case has to build the real instance from that description
- the instant, the resolved value, and the entry order all have to be fixed and derived, never
  taken from a clock or a random source, because determinism is what the content-hash cache,
  the ref-to-ref diffs, and CI cold start all rest on

That is a change to the run-time contract, not to type reading. Sizing it is the first task.

---

## `null` has no type kind of its own

`null` reads as `{ kind: 'unknown', text: 'null' }`. It is a union member like any other, but
nothing downstream can tell it apart from a genuinely opaque type, because the only thing
distinguishing it is the `text` field. Reading `text` to make a decision is banned:
`packages/core/CLAUDE.md` section 5.1 says text is for display and must never enter analysis.

Two things are blocked on this:

**`typeof x === 'object'` cannot narrow to `null`.** In JavaScript `typeof null` is `'object'`,
which is a real wart, not a curiosity. Assayer reads `typeof` comparisons and partitions a
union by which members carry the compared-against tag. A `null` member carries no tag it can
read, so it contributes to neither arm. The narrowing is correct as far as it goes and simply
stops short.

**`is-type-fillable` has to reason about `null` indirectly.** It allows `null` for every scalar
kind. It has to, because a `null` member of a union is inert on its own, so the only thing that
lets a legitimate `null` through is the sibling scalar member's own allowance. The rule works.
It is just not saying what it means, and the comment explaining that is doing work the type
should do.

Fixing it means giving `null` its own kind and letting both readers ask a structural question
instead of an indirect one.

**One trap the fix has to answer.** The transformer that picks a representative value for a
union takes the FIRST fillable member, and the checker orders `null` before `string` in
`string | null`. So a new kind that simply reads as fillable makes every plain nullable
parameter fill as `null` everywhere. Whatever shape the kind takes has to handle that before
it lands.

There is a second reason to want this, in `plan/open-defects.md`: `null` being an ordinary
JavaScript value is what lets `??`, `!x` and `== null` silently discard it.

---

## Three files read a type, and nothing keeps them in step

This one is the "works today, but the next change to it is likely to be wrong" kind.

Assayer reads a TypeScript type into a serializable fact in three places, because it reads
types in three different situations:

- `read-type-fact` — types written in the user's own files, parsed with no `node_modules`
- `read-signature-type` — types from npm packages and node builtins, parsed with
  `node_modules` and `@types` resolving
- `read-global-type` — ambient globals, which resolve only in the checker and never at a file
  path

**Two of the three should be one adapter, and that is the fix.** `read-external-signature` and
`read-global-signature` construct an identical ts-morph project:

```ts
new Project({ tsConfigFilePath: String(tsConfigFilePath), skipAddingFilesFromTsConfig: true })
```

Same configuration, same package, same boundary. They are one operation living in two folders,
which is the only reason their two readers cannot share code. Merge the folders and the shared
reader becomes an ordinary layer file that both parents call by relative path. That is allowed:
a layer belongs to its own folder and is not "another adapter". Three hand-matched readers
become two.

**The third cannot join them, and the reason is load-bearing.** `walk-file` parses with
`useInMemoryFileSystem: true` and no `node_modules`. Merging it in would put a project that
resolves `node_modules` in the same folder, behind the same proxy, as the parse that must never
see one. Section 5.10 of `packages/core/CLAUDE.md` explains what rests on that: the hermetic
parse is what lets `read-env-operand` PROVE an identifier is the real `process.env` instead of
pattern-matching the name, so a file declaring its own `const process = { env: … }` is correctly
refused. Right now the walk cannot see `node_modules` because there is nothing there to see.
Merging turns that guarantee into a convention somebody has to remember.

**Two routes that look like the fix are closed.** Check before proposing either again:

- A shared layer the three parents all import. The architecture says a layer is internal to its
  folder and must never be imported from another one, and that an adapter cannot import another
  adapter.
- A shared transformer. Transformers may import only `contracts/`, `statics/`, `errors/`,
  `guards/` and other transformers. The shared logic has to accept a ts-morph `Type`, which is
  an npm package type, so it cannot live there.

**After the merge, one pair still has to be kept matching by hand, and nothing enforces it.**
Add a type shape to one and not the other, and no test fails. Each file still reads fine on its
own, because each is internally consistent. What a user sees is the same type behaving
differently depending on where it was declared: a shape written in their own file gets a value
built for it, while the same shape in a package's declared signature is refused and dumps the
whole expanded type into the error message.

For that remaining pair the fix is not more sharing. It is a test that feeds both readers the
same list of type shapes and asserts they answer alike, so a shape added to one and missed by
the other FAILS instead of going quiet.

**Some differences between them are deliberate and must survive any fix.** Erasing these would
be worse than the duplication, and the merge above is exactly when that is most likely to
happen: the first difference below is between the two readers that end up sharing a folder, so
it will look like the duplication you just came to remove.

- `read-global-type` never enumerates the properties of an object or an intersection. An
  ambient global's members are reachable only by probing each one with its own expression.
  Array and tuple positions need no probe, which is why those two are handled and objects are
  not.
- Neither of the two external readers collapses a literal to its base type. There is no `const`
  binding to collapse from.
- Only `read-type-fact` records the type-reference name and its arguments. That name is a key a
  later step uses to resolve a sibling file's declaration. The other two already read the real
  declaration, so there is nothing left for them to resolve.
- Only the first two guard against a type that contains itself. The global reader never
  recurses into named members, so it has no cycle to guard against.

The fix is something that makes a missing shape FAIL, not something that makes the three files
one file.
