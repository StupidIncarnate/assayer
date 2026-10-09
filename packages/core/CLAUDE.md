# @assayer/core: the analyzer

Read this file before touching anything under `transformers/walk-file/**`,
`transformers/*projection*`, `transformers/*coverage-id*`, or
`brokers/analyze/**`. The root `CLAUDE.md` states the project's principles.
This file states how the parser actually works, and what you are not
allowed to do to it.

Every rule below exists because the thing it forbids already broke
something real in this codebase. These are not style preferences.

---

## 1. The one idea

There is exactly one walk over a file's syntax tree, and it carries context
DOWN as it descends: from a parent node to its children, never the other
way around. "The walk" means this single traversal. A "handler" is the
function that reads one kind of node during the walk (an `if`, a `switch`,
a function, and so on) and tells the walk which child nodes to descend into
next, through a return value called its "descents."

Context must flow down for these reasons:

- Constructs need to compose. A `switch` nested inside an `if` needs to
  know it is inside that `if`, so its cases can carry the outer `if`'s
  guard along with them. A handler that instead tried to reconstruct its
  surroundings by climbing back up the tree from where it sits would have
  no way to know what encloses it.
- Every scope that can host code (a module, a function, a class body) needs
  to share one derivation. If each one instead re-derived its own context
  by climbing upward, each would need its own near-copy of that logic, and
  any scope kind nobody got around to copying it for becomes a permanent
  gap.
- Nesting needs to just work. A function defined inside another function
  is still visited, and its own logic still belongs to it, because the
  walk reaches it by descending, in order, from its true parent. Climbing
  ancestors instead risks losing a nested function's logic entirely, with
  no error to say so.
- Syntax the walk does not recognize must not vanish. The walk still
  descends into a node it does not have a handler for, so whatever is
  nested inside an unhandled construct is still found.

If you find yourself reconstructing context by climbing back up the tree
instead of receiving it from the walk, stop. That is the exact shape of
the bug this design avoids.

---

## 2. The model

The type `contracts/walk-context` defines the context the walk carries down
through three fields. How each one behaves when the walk crosses a
function boundary (moving from an outer function into a nested one) is the
whole design:

- `scopePath` is a list of names identifying which scope you're in: the
  module root, then each function or class you're nested inside, in
  order. Handlers for the module root, a function, and a class each push
  their own name onto it. Crossing INTO a nested function EXTENDS this
  list. For example, a `classify` function nested inside a `Classifier`
  class at the module's top level has the scope path
  `['*module*', 'Classifier', 'classify']`.
- `guardPath` is a list recording which conditions (`if`, `switch`, and
  every other branching construct) enclose the current position, so a
  branch can be traced back to what guards it. Handlers for `if` and
  `switch` push onto it. Crossing INTO a nested function RESETS this list
  to empty: a function merely DEFINED inside a branch arm is not itself
  guarded by that arm. Only code that actually RUNS inside the arm is
  guarded by it.
- `tail` records whether the current statement is in the last position of
  its enclosing scope: is there nothing after it?

`tail` is why a bare top-level `if` and an `if` inside a function are
handled by the exact same code. When an `if` sits in tail position, each of
its arms completing is itself an exit worth its own test case, because
nothing runs afterward to converge them back together. When code follows
the `if`, its arms just converge back into that following code, and
completing one arm is not a separate exit. Without `tail`, "each arm gets
its own exit" would have to become a rule that behaves differently
depending on which kind of scope (a "rung": module, function, class,
nested function, or callback) the `if` happens to sit in, which is exactly
the kind of per-scope duplication this design avoids.

`transformers/walk-context` is the ONLY place these three rules live. Do
not re-implement any of them inside a handler.

---

## 3. The pipeline: one parse, pure projections

The walk runs through four layers, in order:

1. `walk-file-transformer` is the only place that touches ts-morph
   (the library that parses TypeScript into an AST), and it parses the
   file exactly once.
2. `walk-node-layer-transformer` is the recursion. It calls itself once per
   descent a handler asks for, through `settle-handler-layer-transformer`,
   which turns one handler's answer into walk facts and completes the scope
   the handler opened.
3. `dispatch-node-layer-transformer` is the only place that decides which
   handler owns a given node kind.
4. A `handle-<x>-layer-transformer` file is one handler. It returns
   `{ facts, descents }` and never recurses itself. The `descents` it
   returns are what drives `walk-node-layer-transformer`'s next call.

The output of that recursion is a `WalkFileResult`: a normalized,
serializable model of the file that no longer touches ts-morph at all. Two
pure transformers then project that one model into two different outputs:
`analysis-projection` (plus `dark-spot-projection`) produces the analysis
Assayer's rules read, and `map-projection` produces the nodes the desktop
app's explorer UI displays.

Scopes complete on the way back UP the recursion, not on the way down.
Branches and exits travel as loose facts that belong to whichever scope
encloses them most closely, and the node that opened that scope is the one
that claims them, once the recursion returns to it. Every scope claims
exactly its own facts this way, so no node ever has to ask "which function
am I in?"

A scope can run code without having a node of its own. A class with no
written constructor still runs its instance field initializers in the
constructor the language supplies. `handle-class` hands that constructor
back as an IMPLICIT scope: a full handler answer of its own, with the
initializers as its descents. `settle-handler` completes it exactly as it
completes a scope a node opened, so it claims its own facts the same way.

A handler only describes what to descend into. The core (the shared walk
machinery: `walk-node-layer-transformer` and `dispatch-node-layer-transformer`) is
what actually performs every descent. Core owns all traversal, and a
plugin never parses anything itself. The full requirement is R15 in
`plan/requirements.md`. Because of that split, a `switch` handler needs
zero knowledge of how `if` works, or that `if` exists at all.

Types are read structurally too, the same way syntax is. `read-type-fact`
reads a TypeScript type into a serializable fact: is it a primitive, a
union, an array (and if so, of what element type), or a local object type
(and if so, its sorted list of property names)? `type-descriptor` then
turns that fact into the shape the rest of the analysis uses. An object
type's name comes from its own symbol, or from its ALIAS symbol when the
object's own symbol is the anonymous `__type` that a `type X = { ... }`
declaration produces. That is why an `interface` and a `type` alias
spelling the same shape are indistinguishable to everything downstream of
this point. Only a type DECLARED in the same file gets its properties
enumerated this way. An object type imported from another file reads as
`any` during this walk (section 5.10 explains why), and gets its real
shape later, during the stitch (section 9).

`FileAnalysis.declaredTypes` is the file's named local object shapes, each
with its full property list. Later phases splice per-property value
demands onto that list. `declared-types-projection` builds it by combining
facts from two different channels of the walk, and it needs both:
`handle-type-declaration` records every `interface` or `type` DECLARATION
directly, and separately, every scope's parameters and return type also
carry their own object descriptors. A module that only declares types and
uses none of them in a function signature would have an empty declared
surface if only the signature channel fed this projection, and every
reader of that type would be wrongly asked to supply a shape Assayer can
already build itself. Conversely, a shape spelled inline in a signature,
with no matching named declaration, would be invisible without the
signature channel.

Resolving a reference across files happens as a separate pass after every
file's own walk finishes. The walk itself never opens a second file. When
code calls an imported name, the walk records a raw `import` reference:
the literal VALUE of the module specifier, plus the imported name, nothing
more. It does not follow that reference during the walk, so an import
cycle between two files is a non-event at walk time; there is nothing
recursive happening yet. A second pass runs afterward, over each file's
already-finished blob, and turns these raw references into resolved edges
purely by looking them up, never by re-parsing anything. Section 9 covers
this pass, called "the stitch," in full. One parse per file still holds,
even with cross-file resolution in the picture.

---

## 4. Where to make a change

Each entry below names one thing you might want to change, and exactly
which file or files own that change.

**Add support for a new syntax family.** Add one new
`handle-<x>-layer-transformer` file, plus exactly one new route for it inside
`dispatch-node`.

**Add support for a new kind of callable.** Touch
`handle-function-layer-transformer`, which owns every `FunctionLikeNode` (any
function-shaped node: a function declaration, an arrow function, a method,
and so on), plus its route in `dispatch-node`.

**Handle a new shape of type.** Touch `transformers/type-descriptor`.
`read-type-fact` only packs the checker's raw facts about a type: is it a
primitive, a union, an array (and its element type), or a local object
type (and its enumerated properties)? An object type imported from
another file reads as `any` during the main walk, and is resolved later,
either during the stitch or by the consume-time `param-type-resolve`
overlay (section 5.10 explains why). A union keeps every member that is
representable (that Assayer can build a value for), and only degrades to
`unknown` when NONE of its members are representable. A value of any one
member of a union IS a valid value of the whole union, which is the rule
`is-type-fillable` states directly.

**Handle a new kind of comparison.** Touch `transformers/predicate`.
`read-condition` only extracts the readout (what the comparison checks,
and against what) from a condition; it does not decide what counts as a
valid comparison. A bare `xs.length` used as a condition is read past the
access, and `predicate` classifies a length with no operator as
`length-neq` carrying 0.

**Read a new connective in a condition.** Touch `read-condition-tree`.
It spells every connective with `and`, `or` and `not` over leaves. `a ?? b`
used as a condition is `a` truthy, or `a` nullish and `b` truthy, with a
`non-nullish` leaf on `a` that carries no probe, because `a`'s span
already carries its truthiness probe. A literal `b` is evaluated by its
value instead of read as a leaf, because no case can set a literal.

**Read a ternary in a value position.** Touch `handle-ternary`, which
`dispatch-node` routes every ternary the walk reaches to. A ternary in a
call argument, a field or variable initializer, an object property, a
`yield`, a parameter default or a condition is a branch of the scope it
runs in. It has no exit, because its value flows on into the expression
around it, so each arm is recorded as a fall-through arm and both arms
meet again at the enclosing statement. A ternary that IS an exit never
reaches it: `read-conditional-exit` consumes that one first (section 8).

**Run a class's instance field initializers.** Touch
`read-instance-initializers`, the one list of initializers construction
runs, plus `handle-class` and `handle-function`, its two readers. A
written constructor walks them before its own body. A class with no
constructor gets an implicit one from `implicit-constructor`, a scope named
`constructor`, reached through `new` on the class, taking no parameters.
Its exit's probe wraps the last initializer, because initializers run in
source order. A static field's initializer runs when the class is defined,
so the class walks it under the scope the class sits in.

**Read a parameter's default value.** Touch `handle-function`, which
descends each default under the function's own context, so a ternary
there reaches `handle-ternary` as a branch of the function. A parameter
whose default is a ternary is marked `branchingDefault`, and
`applied-params` leaves it out of every case, so the default runs.

**Change how coverage IDs are computed.** Touch `transformers/coverage-id`
and `transformers/exit-coverage-id`.

**Change what counts as identity for a node.** Touch
`project-node-layer-transformer`.

**Change how an operand's type is determined.** Touch
`read-operand-type-layer-transformer`, but read section 5.9 first.

**Capture an object-member operand, such as `config.mode`.** Touch
`read-condition`, plus `read-property-path` for reading the `.member`
chain itself. Together they record three facts for the stub stitch
(section 9): `operandParamName` (the root parameter, `config`),
`operandPropertyPath` (the property chain, `mode`), and `operandTypeRef`
(the NAME of the root parameter's declared type). In the per-file analysis
alone, a branch like this is undriven (section 5.12 explains why, and
where that is decided). At the moment Assayer runs the test, `stub-realize`
(section 9) drives it.

**Drive an object-member branch using the stub view.** Touch
`brokers/stub/realize`, the consume-time overlay, plus
`transformers/object-arrange`, which arranges one object parameter's
properties from the merged stub view (the derived value demands, combined
with any human correction). A property with a human correction is
authoritative: only its corrected values are used, with no fallback to the
literal the branch itself compares against. Never touch `derive-cases` for
this. It stays scalar-only, meaning it only ever arranges plain values, not
object properties.

**Give a parameter declared with an IMPORTED type its declaration's real
shape.** Touch `brokers/param-type/resolve`, the consume-time overlay that
runs FIRST, before every other overlay, plus its
`resolve-type-ref-layer-broker`. That broker resolves one type reference to
one declaration. It follows named imports, re-export barrels, and
namespace imports (`import * as T` where a later use of `T.Leaf` forwards
to `Leaf`). It keeps a seen-set (a record of every file it has already
visited) to stop if that chain cycles back on itself. And it instantiates
a generic declaration using the type arguments supplied at the reference
site, substituting the declaration's own type parameters by position. It
also touches `transformers/collect-type-refs`, `substitute-type-refs`, and
`substitute-condition-types`, the pure read and write halves of this
resolution, keyed by `transformers/type-ref-key`. That key is the
reference's declared rendering: `Box<string>` and `Box<number>` share one
NAME (`Box`) but are two different demands, so a map keyed on the name
alone can answer one with the other's shape by mistake if you are not
careful, which is exactly why the key includes the rendering. The walk
itself only records the reference's NAME and its type arguments, on an
otherwise opaque descriptor (`typeRef` and `typeArgs`, read off
`param.getTypeNode()`, never off `.getText()`; section 5.1 sanctions this
specific use). The overlay resolves that reference and re-projects the
whole file through `analyze-file-broker`, so there is exactly ONE
derivation path for the file's analysis, and nothing to reconcile between
two paths. This overlay does NOT change the file's own `declaredTypes`: a
sibling file's shape is not a shape this file declares, and letting it in
would incorrectly key that shape's stub on the file that merely reads it,
instead of on the file that defines it.

**Give a parameter a value when no case steers one, or refuse to.** Touch
`transformers/fill-param`. It is the ONE authority for filling a value,
and every site that fills a value routes through it: `cause-arrange`,
`stub-realize`, the funnel builders, and the `through-*` builders (defined
below, and in section 9). `guards/is-type-fillable` states the rule for
what can be filled: a scalar or literal value can; a union can, using some
member; an array can, using its element type; an object can, using every
one of its properties (so an object with no properties fills as `{}`); a
callable or an unknown type cannot. `transformers/fill-value` is the
recursive builder that does the filling. There is no placeholder value: a
parameter this rule refuses gets no test case built for it at all. Assayer
never hands a placeholder string like `'abc123'` to something that will
call it, dereference it, or measure its length.

**Decide which parameters a call site actually supplies.** Touch
`transformers/applied-params`, which is asked once per call site by
`derive-cases` (which also uses its answer to decide whether a parameter
is steerable at all), and again by `stub-realize`, the funnel builders,
and the `through-*` builders. A parameter the caller owes nothing for,
because it is `optional` or a `rest` parameter on its descriptor, is not
counted as owed even when the fill rule above refuses it. Both flags are
read off the ts-morph parameter itself, inside `handle-function`, never
off the parameter's type. Optionality is a fact about the declaration's
`?` token, and a rest parameter is a fact about its `...` token. Neither
one is recoverable from the type alone, so reading the token is the only
way to get the answer right. Calling `maybe(11)` is a real,
complete call. Reporting a missing input for its unsupplied optional
parameter would report a debt nobody actually has. This logic truncates
the parameter list rather than filtering it, because the part of Assayer
that applies an arranged value does so positionally: removing one
parameter from the middle of the list, instead of truncating from the end,
would shift every later argument one slot to the left. A refusal for a
REQUIRED parameter still stays, and is still reported.

**Word the report for a refused parameter.** Touch
`transformers/input-gap`, the one place the P1 error text for this comes
from. (Section 1's constraints in the root `CLAUDE.md` define "P1": a
build-blocking failure, exit code 1.) It names the type as the SOURCE
spells it (`param.declaredText`, read off the type node), never as the
internal descriptor would render it. For example, a `readonly [string,
number]` tuple type internally enumerates as an anonymous shape carrying
every member of `ReadonlyArray`, so rendering it that way would bury the
one fact the reader actually needs under a multi-thousand-character dump,
both in the error message and in the harness code snippet meant to be
pasted into a fix. `derive-cases` reports these refusals as `unfillable`,
deduplicated, and so does every other route that drives a branch:
`through-caller-cases`, `through-callback-cases`, `funnel-cases`,
`funnel-named-cases`, and `compose-cross-file-map`. Every one of them
routes through `fill-param`, and a refusal any of them dropped on the
floor would be a scope that silently derives no test cases at all. A
route's refusal carries an `owner`, naming which scope DECLARES the
parameter, whenever the gap needs to be reported against a different
entry than the one that refused it: a private function folded into its
caller, or a callback, is not an entry of its own, so its refusal is
reported against the entry a reader can actually drive, reading "on
`<name>`". `analyze-file-broker` merges this source of refusals with the
ones computed from access patterns onto `FileAnalysis.gaps`.
`case-set-projection` concatenates both sources together, since they share
one shape. `stub-realize` clears a gap for any entry it manages to drive
using the merged stub view. Whether a gap blocks the build or only warns
is controlled by the global `inputGaps` config toggle, which controls the
exit code alone: `off` and `warn` print the identical report text either
way. There is no way to waive one site.

**Decide which admission an entry prints, when it qualifies for two.**
Touch `analyze-file-broker`. When an entry carries an input gap, its
undriven admissions are dropped from the report. The two channels keep
their own separate meaning; this is about which one gets printed, not
about merging them. The reasoning: an entry Assayer cannot construct an
input for cannot be called at all, so it has nothing meaningful to say yet
about which branch it would take. Printing both "make this value a
parameter" and "supply this input" at once would be two contradictory
next steps for the same problem. Once the gap's own closing line says the
refusal is resolved, anything still blocking the entry (an access gap, an
undriven branch) states itself on its own line at that point.

**Render a type the checker collapses**, for example `Db | string`
resolving to plain `any`. Touch `read-declared-type-text-layer-transformer`,
threaded through `read-type-fact` as `typeNode` (supplied from
`handle-function`, and carried down into array elements and object
properties too). It walks the type NODE itself, by kind, and asks the
checker to render each part separately, so a member the checker would
otherwise collapse still reads under its own declared name. This only
affects display text. The underlying classification (fillable or refused)
is untouched, so whatever was refused stays refused.

**Fan an array parameter out over cardinality** (build one test case each
for an empty array, a one-element array, and a many-element array). Touch
`transformers/array-arrange`, which builds a real array of each size,
recursing for a nested shape like `number[][]` (so `[[7]]` is a valid
many-element, one-inner-element case), plus the array-cardinality cartesian
product folded into `transformers/cause-arrange`. `statics/array-cardinality`
fixes the order these are generated in (empty first, since it's the most
salient) and how many size classes there are. Every array parameter gets
this fan-out. A `.length` guard on an array does record a length
predicate. Where a `.length` guard constrains an object PROPERTY that is
itself an array, that property is refused rather than filled, because
Assayer does not yet build an array of a specific demanded length.

**Flag a committed correction that contradicts a guard, before running
anything.** Touch `transformers/gather-property-guards` (the per-guard
counterpart to `gather-type-reads`, section 9) and
`transformers/stub-contradictions`, which intersects a correction's values
with the guard's satisfying values, using `is-domain-empty` (a "domain" is
the set of values that would satisfy a comparison; this function proves
when that set is empty). This check is folded into `compile-run-broker`'s
error list, alongside the stale-overlay check from section 9.

**Change reachability.** Touch either `read-terminal` or `read-accounted`.
They answer two genuinely different questions. Read section 5.8 first.

**Decide whether a branch is drivable (steerable, meaning Assayer can pick
an input that makes it take a specific arm).** Touch
`transformers/derive-cases`. It is the ONE gate for this, for every kind
of branch alike (section 5.12 explains why). It asks two questions of
every leaf condition: is the operand arrangeable at all, and does the
predicate actually constrain the outcome (`guards/is-predicate-constraining`)?
It reports which one failed as the `undriven-cause`, because the two have
different fixes.

**Evaluate a branch welded to a literal constant.** Capture the value at
the exact point where it becomes welded: `read-const-operand-layer-transformer`
for a same-file `const` (it stamps `operandConstValue` or
`operandConstLength` onto the leaf, during the walk itself), or
`transformers/stamp-const-leaves` for a literal argument at a call site or
an immediately-invoked function (an IIFE: a function defined and called in
the same expression). From there it flows through the existing math:
`derive-cases` treats it as arrangeable, `cause-arrange` seeds a domain
(the set of possible values) containing exactly that one value, and the
arm the value cannot satisfy falls out of `is-domain-empty` as an
`unreachableExits` entry, a lint, never a second, bogus test case. The
lint's text comes from `transformers/unreachable-lint`. A dead arm that
does not exit, because its statements fall through to the code after the
`if`, has no exit to report. `handle-if` records each arm like that on the
scope's `fallthroughArms` channel, with its guard path and its statement
span. `derive-cases` runs the same emptiness check over the buckets that
enter the arm, and reports a dead one on the same `unreachable-exit` rule,
from the arm's first statement line to its last. A dead arm covers every
exit and nested arm inside it, so Assayer reports that region once.

**Drive an inline function that nothing calls by name.** Touch
`transformers/follow-calls`, which routes each shape to its own handler:
an IIFE goes to `transformers/through-invocation-cases` because it runs at
module load time, so both the surrounding environment and any welded
literal in its own invocation can drive it, and its entry is recorded as
access `module`. An array-iteration callback (like the function passed to
`.map()`) goes to `through-callback-cases`. A named function called
elsewhere in the file goes to `through-caller-cases`. A closure that gets
returned from a function stays undriven: some caller outside this file
applies it, and Assayer cannot see that call.

**Change what counts as a dark spot.** Touch
`statics/significant-syntax-kinds`.

**Change what becomes an entry** (a function or component Assayer treats
as a top-level, testable unit). Touch `transformers/analysis-projection`.
This policy decision lives there, not in the walk itself.

**Change what a call targets** (a local function, an import, or something
Assayer cannot resolve). Touch `read-callee-layer-transformer`. A callee in
the same file is a `local` link whether it is a `FunctionDeclaration` or a
`const`/`let` bound to a function-like value, read off the declaration's
own kind, and keyed on the line where the walk opened that scope.

**Record an import or re-export edge.** Touch `handle-import-layer-transformer`
and `handle-export-layer-transformer`, plus their routes in `dispatch-node`.
`transformers/module-graph-projection` projects the result.

**Record a type declaration** (`interface Config`, `type Config = { ... }`,
`enum Level`). Touch `handle-type-declaration-layer-transformer`, plus its
route in `dispatch-node`. It reads the declaration through the same
`read-type-fact` to `type-descriptor` pipeline every function signature
goes through, and it emits the declared NAME (plus `typeParams`, for a
generic declaration) alongside the descriptor, on a flat `declaredShapes`
channel. The name matters here specifically because it is the one fact the
descriptor itself has no slot for: `type Id = string` describes a
descriptor with no name field at all, so without recording the name
separately, nothing keyed by name could ever find this declaration. An
ALIAS also hands its right-hand type NODE to the reader; a declaration
like `type BeeT = AyT` records no further reference, so a chain of alias
declarations stops resolving one file short of the shape it ultimately
names. A CLASS declares its instance shape on this exact same channel,
from `handle-class`: a file that imports a `Point` needs the same answer
whether `Point` is declared as an interface or as a class.
`transformers/declared-types-projection` projects this alongside the
signature-derived descriptors (see section 3).

**Record a use of an ambient global**, such as `console` or `process`.
Touch `handle-member-access-layer-transformer` for member-access forms and
`handle-call` for a bare-identifier global call, plus
`read-ambient-root-layer-transformer`. `transformers/module-graph-projection`
projects the result as `globalUses`.

**Record a `process.env.<X>` read.** Touch
`handle-member-access-layer-transformer`, which reads the outer
`process.env.<X>` access: the property name, plus any literal it is
directly compared against. `transformers/module-graph-projection` projects
it as `envReads`, and the stub stitch (section 9) aggregates these into
per-property environment stubs.

**Drive a branch whose operand is read from the environment.** Touch
`read-env-operand` and `read-env-chain`. They follow a branch operand's
identifier through same-file `const` bindings down to one
`process.env.<X>` read, and record each step on the way that Assayer can
run backwards, in the order the code applies it: a `?? '<literal>'`
fallback, `Number(x)`, a comparison with a literal, `x.split('<literal>')`,
and `xs.map(f)`. The leaf carries the variable as `operandEnvVarName` and
the steps as `operandEnvSteps` (`env-step-contract`). The steps also give
the operand its type (`env-steps-type`), because the checker types every
step built on `process.env` as `any` (section 5.10). `cause-arrange` starts
the operand's domain from what the steps can produce at all
(`env-steps-domain`: a split list is never empty), and writes the variable
with `env-encode`, which runs the steps backwards from the operand's
narrowed domain. A step with no inverse, such as `parseInt(x, 10)` or a
template string, ends the chain, and the branch stays undriven. A
condition that reads `process.env.X` in place, with no binding in between,
is not followed either, so it stays undriven too.

**Change import resolution (the stitch).** Touch
`brokers/compile/resolve-graph`, plus `brokers/tsconfig/owner`
(finds the tsconfig that owns a file, the way tsserver does, and returns its
compiler options) and `brokers/import-specifier/resolve`.

**Change the stub index** (the per-property value demands computed over
declared types). Touch `brokers/compile/stub-graph`, the twin stitch pass
that also returns the per-guard `guards` list used by the contradiction
check above, plus `transformers/gather-type-reads` (the reader-and-type
seam) and `transformers/collect-property-demands` (the value math).
`brokers/stub-index/write` writes the result.

**Read an external signature**, meaning the declared shape of something
from an npm package or a Node built-in. Touch
`brokers/external-signature/read`, plus
`brokers/external-signature/read-declaration`, the second, `node_modules`-
aware parse project (section 5.10 explains why a second project exists at
all).

**Read an ambient global's or a called built-in's signature.** Touch
`brokers/external-signature/read-global`, plus
`brokers/external-signature/read-global-declaration`, which probes that same second
project's global scope. A built-in resolves only through the checker
itself, never through a `.d.ts` file path.

**Decide whether a `*.harness.ts` file is actually an Assayer harness.**
Touch `guards/is-assayer-harness`, the symbol gate that checks
whether the module imports `assayerHarness` from `@assayer/core` and
calls it, plus `brokers/harness/classify`, the one place a planned file is
split into either an analyzed target or a harness. Both plan brokers (the
ones that plan a fresh working-tree compile and the ones that plan a
compile against a committed ref) call this same classifier, so the two can
never disagree about which files are harnesses. Never use a blanket rule
based only on the file name: that would wrongly drop a consumer's real
source file that happens to be named `*.harness.ts` for an unrelated
reason.

**Change what a harness can declare.** Touch
`contracts/harness-declaration` (the published type; it uses two open
catchall shapes rather than `z.record`, because a branded-key record
infers as `Record<SymbolName, ...>`, and an author's literal object like
`{ audit: { report } }` cannot satisfy it: the plain key `audit` is not a
`SymbolName`), plus
`transformers/assayer-harness`, the registration function itself,
published as `assayerHarness` from the package's main barrel
(`packages/core/index.ts`). That is the exact specifier the input-gap
error message tells a reader to import.

**Change how a harness is read.** Touch `brokers/harness/load`.
It runs `transpileModule` (with no require hook, and nothing added to the
module cache), then runs the result inside a bare sandbox holding a
CommonJS shell and exactly one reachable import: `@assayer/core`, bound to
that call's own collector. A thrown error inside the sandbox is read using
`util.types.isNativeError`, never `instanceof Error`, because an error
raised inside the sandbox belongs to that sandbox's own separate
constructor, and `instanceof` would not recognize it.

**Change the harness index (the key inventory).** Touch
`brokers/compile/harness-graph` (the third stitch pass, see section 9),
plus `transformers/harness-target` (which source file a harness applies
to) and `transformers/harness-keys` (the sorted, deduplicated list of
(entry, parameter) pairs it supplies). `brokers/harness-index/write`
writes the result.

**Word a P1 error about a wrong harness key.** Touch
`transformers/harness-validate`, the harness equivalent of the
stub-overlay reconcile check in section 9. It checks a declared key
against the target's actual analysis, catching: an entry the file does not
offer, a parameter the entry does not take (both paired with
`transformers/did-you-mean` and the full list of valid candidates), a
parameter `is-type-fillable` says Assayer already builds on its own, and a
file that declares nothing at all. A key naming a same-file private
function that got folded into its host through a named-call funnel (see
the entry above on driving an inline function) validates too: the normal
`entries` list alone would wrongly reject the exact key the private's own
refusal message prints, since a folded private carries no `EntrySignature`
of its own. The candidate list here is `entries` UNIONED with
`FileAnalysis.declaringScopes` (see the next entry below), the one source
both the refusal message's `owner` field and this validator read. A folded
CALLBACK is never a valid candidate here: its refused element lives inside
the ARRAY its host receives, and Assayer's `ArrangeValue` type has no way
to represent a harness-bound value living inside a composite value, so
allowing this key to validate would let it pass with no way for
`harness-realize` to ever actually bind it. See `funnel-cases`.

**Name a same-file scope that a driving route folded into a host, instead
of projecting it as its own entry.** Touch `FileAnalysis.declaringScopes`,
populated by `transformers/follow-calls` from
`funnelNamedCasesTransformer`'s `consumed` list: every same-file PRIVATE
function a named-call funnel folded in, transitively, each carrying its
own full parameter list and the name of its `hostEntry`. This is the ONE
source both `harness-validate` and `harness-realize` consult for a scope
an input-gap message names (for example, "on `build`") but that the plain
`functions` list carries no signature for, so the two can never disagree
about what got folded in. This deliberately excludes a folded CALLBACK;
see the row above for why.

**Pay off an input gap using the harness that answers it.** Touch
`brokers/harness/realize`, the consume-time overlay covered in section 9.
It re-derives each entry named in a gap through the SAME `derive-cases`
used everywhere else, handing it `harness: { entry, params }`, so
`cause-arrange` emits a `harness` binding exactly where the fill rule
would otherwise have refused. This is wired in at the same three seams the
other overlays use, and it runs LAST, because every overlay ahead of it
can still turn a refusal into something Assayer builds on its own. This is
never a second derivation path: a supplied entry's cases differ from a
derived entry's cases in exactly the one binding a harness supplied.

**Resolve a harness-supplied value at run time.** Touch the generated test
file (`transformers/assemble-shim`), which loads the harness file
through ts-jest, and note that Jest maps `@assayer/core` to the root
`harness-registrar.js` (`brokers/run/execute-cases`) so the harness's
registration lands where the generated test file can read it. This
mapping matters because resolving the `@assayer/core` package separately
from the harness and from the generated test file can otherwise land on
two different installs of the package inside one workspace, and two
separate module instances mean a harness registration that nothing ever
collects. `brokers/case/interpret` then walks the key path
(`transformers/harness-value`); a key the harness declaration does not
carry produces an `errored` case naming it, never a silent `undefined`
argument.

**Name a harness value by its (entry, parameter) pair.** Touch
`transformers/harness-key-path`, which writes the key
`inputs.<entry>.<param>`, and `transformers/harness-value`, which splits
that key back apart. Both read `statics/harness-module`. Keeping the
format in two independently-written places is exactly how a case could
end up naming a key that resolves to nothing, so both must stay in sync
with that one static value. `transformers/harness-path` is the reverse
direction: from a source file to the harness that covers it
(`harness-target` computes the inverse).

Beyond the entries above: `dispatch-node` is the only place that ROUTES,
meaning the only place that decides which handler owns a node. That is the
whole invariant. It does not mean no other file may ever check a node's
kind. Plenty of files legitimately inspect a node's kind for their own
reading job: `read-condition` narrows a binary expression, `read-terminal`
and `read-accounted` recurse through statement forms, `desugar-switch`
reads case clauses, and `project-node` distinguishes identifiers from
literals. None of those are deciding ownership, and none of them are
answering a question the walk already answered.

The test to apply: are you reading this node, or are you deciding who
handles it? The second belongs in `dispatch-node`, and nowhere else.

---

## 5. Non-negotiable rules

### 5.1 Never pull source text into analysis

Derive every fact from node KINDS, resolved SYMBOLS, and literal VALUES
(read through `getLiteralValue()`, never a literal's quoted spelling). If
the AST cannot yet be decomposed for some syntax, build a normalized
STRUCTURAL projection of it instead, the way `project-node-layer-transformer`
already does for any node kind. Do not add a `getText()` fallback. A
formatting-only edit that moves a coverage ID is a bug.

`getText()` appears in the analyzer in exactly two sanctioned places. Do
not treat either as precedent for a third:

- Calling `.getText()` on an Identifier, or on a type-reference NAME, in
  `project-node`, `read-condition`, `read-type-fact`, and
  `desugar-switch`. An identifier's text IS its name. There is no
  formatting freedom in a name the way there is in a condition's spacing
  or quote style. This covers `read-condition` reading an object-member
  operand's ROOT identifier (`config` in `config.mode`), the
  type-reference name a root parameter declares (`Config`, read off
  `param.getTypeNode()`), `read-type-fact` reading that same reference
  name onto an opaque type's `typeRef`, and `handle-type-declaration`
  reading a declaration's own name. All of these are spelling-invariant
  names used as foreign KEYS a later phase resolves by, never as display
  text. One open question here is not yet settled: this reads the
  identifier's own spelling, not its resolved symbol, so renaming a local
  variable currently moves its coverage ID. This is item 5 of the churn
  matrix in `plan/requirements.md`, which records it as an open decision.
  If you resolve it, resolve it there, and in `project-node`, in exactly
  one place.
- Calling `.getText()` on a Type, in `read-type-fact`. That text is the
  CHECKER's own canonical rendering of the type, not a copy of the user's
  source. It lands only in the display-only `TypeText` field, and it never
  reaches an ID.

Anything else calling `getText()`, a condition's text, a node's span text,
a "just for the fallback" call, is a bug, full stop.

### 5.2 Never scan

Do not use `getDescendantsOfKind`, `forEachDescendant`, or any "find every
X, then work out who owns each one" approach. The walk reaches every node
exactly once, and already knows who owns it by the time it gets there. A
scan cannot tell a `return` inside a function apart from a `return` inside
a callback nested inside that function; conflating those two is a real bug
this design avoids.

### 5.3 Never climb ancestors for context

Do not use `getFirstAncestor`, or any other way of asking "which function
am I in?" The answer already lives in the `context` object the walk hands
down (section 2). This is the same rule as 5.2, stated from the other
direction. This codebase has no `is-function-like-kind` guard anywhere:
nothing needs to ask that question, because the context object already
carries the answer.

These two rules are checkable directly: in `packages/core/src`,
`getDescendantsOfKind`, `getFirstAncestor`, and `forEachDescendant` occur
at zero call sites. Grep for them before you add the first one back. Test
files are the one exception: a test may call
`getFirstDescendantByKindOrThrow` to fetch a node to feed to the code
under test. That is a test fixture, not analyzer logic, and is fine.

### 5.4 Never write logic specific to one scope kind

Do not write `if (isModuleScope)` or `if (insideClass)`. A module, a
function, a method, a nested function, and a callback are all handled by
the exact same code, at whatever depth they sit. If a construct needs to
behave differently depending on whether it sits at the top level of its
scope, that difference belongs in `context.tail` (section 2), never in a
check for which kind of scope it is.

### 5.5 Never invent a guard path locally

Always append to `context.guardPath` using the path the walk already
carries down, never a guard path invented fresh inside one handler. A
handler that builds its own single-step guard path, instead of extending
the one it was handed, silently drops every guard already enclosing it.
Your handler does not know what encloses it. It must not try to guess.

### 5.6 Never drop a node silently

Unrecognized does not mean invisible. `dispatch-node`'s default branch
still descends into a node kind it does not recognize, so a `return`
inside an unhandled `for` loop is still found. And if that unrecognized
kind is load-bearing (listed in `statics/significant-syntax-kinds`), the
default branch records it, which is what becomes a `darkSpot` in the
cache. Handling a new kind means adding a handler for it. It never means
removing that kind from `significant-syntax-kinds` instead.
`FileAnalysis.darkSpots` is a required field, never optional: an analysis
that is allowed to omit its own blind spots reads as complete, gets
trusted as complete, and that is worse than an analysis that admits it is
incomplete. Assayer's own code calls this constraint "D22"; you will see
that name in comments near this check. The full requirement is D22 in
`plan/requirements.md`.

One consequence of this rule: a handler must descend into a returned
expression, not to analyze the value itself (the "never derive an
expected value from the code" rule forbids that), but because an
expression like `xs.map((n) => ...)` can contain a whole nested scope.
`handle-exit` does exactly this. A conditional return, `return a ? b : c`,
is split per arm by `read-conditional-exit` before that descent happens;
any other kind of returned expression is descended into whole. Skipping
that descent would drop whatever scopes and calls are hiding inside the
returned expression.

### 5.7 Never parse twice

`walk-file` runs exactly once per file. The analysis and the map are both
pure projections of that one walk result. Parsing twice is how the map
and the analysis could end up disagreeing about the same file.

### 5.8 Keep the two reachability questions separate

`read-terminal` answers "does this always exit?", which decides whether
the code AFTER this point is guarded by one of this construct's arms.
`read-accounted` answers "are this scope's ways out already emitted?",
which decides whether the scope still owes a completion exit of its own.

These two questions genuinely differ for an `if` with an `else` where both
arms fall through: each arm is accounted for (each one gets its own
completion exit), but the `if` does NOT always exit, because code
following it still runs on both arms. Treating these as one question is a
real soundness bug: it would guard a trailing `return` by an arm it does
not actually depend on, and key that `return` under the wrong ID. The test
`manual-smoke-repo/.../happy-path/composition/fallthrough-in-if` checks this
distinction holds. If you are tempted to merge these two functions, that
test is what would catch the mistake.

### 5.9 Do not simplify operand typing

`read-operand-type` deliberately keeps two separate rules: a parameter
reads its own declared type descriptor, while any other kind of binding
gets a widened type-graph read. Widening every operand the same way would
collapse a literal union like `'get' | 'post' | 'delete'` down to plain
`string`, destroying the exhaustive per-member fan-out that makes
analyzing a `switch` over that union worth anything at all.

### 5.10 The analyzer's own parse has no ambient Node types, and the environment-variable feature depends on that

`walk-file-transformer` parses using `useInMemoryFileSystem: true`
and a single source string. Call this the hermetic walk: it resolves
TypeScript's standard library, but nothing from `node_modules`.

The walk parses through `transformers/hermetic-source-file`, and so does
the harness type reader (`transformers/harness-value-types`). That
transformer keeps one in-memory ts-morph project per compiler-options set
for the life of the process. Each call adds its one file, reads it, and
removes it again in a `finally`. So a walk's program holds only its own
file plus TypeScript's lib files, and nothing an earlier walk declared is
visible to it. The lib files are parsed once per process and reused by
every walk. The checker is new for every walk. A walk must copy out
everything it needs as plain data before it returns, because its file's
nodes and types stop being valid once the file is removed.

**Each file is walked under the compiler options of the tsconfig that owns
it.** `brokers/tsconfig/owner` finds that tsconfig the way tsserver does,
and TypeScript's own parser answers every question in the search:

- It starts at the nearest `tsconfig.json` at or above the file's folder.
- That config owns the file when its parsed `fileNames` hold the file's
  absolute path. TypeScript has already applied `include`, `files`,
  `exclude` and the whole `extends` chain to that list. So Assayer's only
  test is an equality check on TypeScript's list. It adds no glob and no
  path rule of its own.
- When that config does not own the file, Assayer asks each of its
  project references in turn. A solution config (`files: []` plus
  `references`) owns nothing itself, so it hands the question to its
  projects. A reference may name a folder or a file such as
  `tsconfig.scripts.json`.
- When nothing there owns the file, the search starts again from the
  folder above that config. A file that no config owns gets TypeScript's
  defaults.

A config that sits above a file does not always own it. A test file that
its package config excludes is the common case. Reading the nearest
config's options for that file would be the wrong answer, so every
per-file question asks for the owner instead.

`transformers/analysis-options` cuts the owner's options down to the
`analysis` list in `statics/analysis-options`: the options that change a
type the checker reports for one file read on its own, such as `target`,
`lib` and the strict flags. Path options (`outDir`, `paths`, `types`,
`typeRoots`) never reach the walk. In memory they resolve nothing, and an
absolute path inside a cache key would make the key differ from one
machine to the next. Each distinct option set gets its own in-memory
project, so a repo whose packages differ in `lib` or a strict flag parses
each library set once per process.

`strictNullChecks` is always on, set on top of the owner's options. With
it off, the checker drops `undefined` and `null` from every type the walk
reads. The code still receives those values at run time, so the cases
that cover them would vanish from the analysis.

`walkFileTransformer` never reads the disk. It takes the options as a
parameter, and with none it uses TypeScript's defaults. A caller that has
the file on disk walks through `brokers/file/walk`, which looks the owner
up first. The specimen catalogue passes each specimen's absolute path, so
a specimen is walked under the same options the compile and the run use.
The stable namespace, which analyses a git ref, reads the working tree's
tsconfigs, because TypeScript exposes no public way to apply `include` and
`exclude` to files read out of git. A file that exists at the ref but not
in the working tree is in no config's `fileNames`, so it gets TypeScript's
defaults.

The options key is part of every key that depends on the analysis. A
file's blob is stored under `analysisHash`, a hash over the options key
and the file's bytes. `contentHash` stays the hash of the bytes alone. The
run id and the harness index's `harnessHash` both include the options key.
So a tsconfig edit that changes how a file is analysed gives that file a
new blob and a new run id, and leaves every other file's blob alone.

A symbol-keyed member, such as `Map`'s iterator, is named with the
checker's own rendering, `[Symbol.iterator]`. TypeScript's internal name
for that member ends in a symbol id from a counter the whole process
shares, so it would differ depending on what the process walked first.

Two consequences of the hermetic walk follow, and both are load-bearing:

- This is what lets `read-env-access` prove that an access is really
  `process.env`, rather than merely pattern-matching the text
  `process.env`. An identifier the file itself declares is NOT the global,
  and the checker answers that correctly: a file with its own `const
  process = { env: ... }` is refused, because the checker resolves
  `process` to that local declaration instead of to nothing. The rule this
  relies on is "no declaration for this name in THIS source file," not "no
  symbol at all," because `Number` resolves to the standard library while
  `process` resolves to nothing in the hermetic walk, and only the
  file-scoped version of the question gets both of those right.
- The checker types `process.env.X`, and every step built on it, as
  `any`, because no `@types/node` is loaded. So an environment operand's
  TYPE comes from its recorded steps instead (`env-steps-type`): the raw
  read is a `string`, `Number(x)` a `number`, a comparison a `boolean`,
  and a `split` an array. That is the type Node itself declares, minus
  `undefined`, which no case can write. Driving reaches exactly the steps
  `env-encode` can run backwards (section 4 lists them), so a case can put
  the operand where a predicate wants it: `String` inverts `Number`, the
  literal itself makes `=== '<literal>'` true, and n items joined by the
  separator give a `split` list of length n. Any other step ends the
  chain and the branch stays honestly undriven, because guessing an
  inverse would put a failing case against correct code. Loading
  `@types/node` into this project would type more of the chain, and doing
  that is a real decision with real costs (parse cost on every file, a
  core dependency on types meant for consumers, and a changed analysis for
  every specimen in the catalogue), not a small tweak.

Reading an external type does not weaken any of this. When a resolved
import needs its declared input or output types, a SEPARATE,
`node_modules`-aware parse project reads them out of band:
`brokers/external-signature/read-declaration` opens its own `new Project`,
without `useInMemoryFileSystem`, rooted at the consumer repo so
`node_modules` and `@types` resolve normally, and it reads only DECLARED
types, never executes anything (which keeps it consistent with the "never
derive an expected value from the code" rule). This second project is the
one sanctioned way to read an external type. The hermetic walk is never
given access to `node_modules`, and that is exactly what keeps the
`process.env` proof above intact. The two parse projects stay strictly
separate.

### 5.11 An exit's probe site is minted where its ID is minted

Every handler that emits an exit also emits that exit's probe site (the
place a runtime observation attaches) in the same expression:
`handle-if` does it per arm completion, `handle-function` per function
body, `handle-source-file` per file end. Deriving a probe site in a
separate, later pass risks a runtime observation keying under an ID the
analyzer never actually produced.

There are two shapes of probe site, because two different things are
observed. An EXPRESSION exit is wrapped in place: the value still passes
through it, and short-circuit behavior is preserved. An IMPLICIT exit
(falling off the end of an arm, a function body, or the whole file) has no
expression to wrap, so its probe site is the surrounding statement
container, and the probe is appended after it, marked `kind: 'complete'`.
An implicit exit with no probe site would be unobservable, and a test case
that predicts reaching it would report "reached no exit" against code that
actually reached it correctly.

### 5.12 Decide drivability exactly once per syntax, never per position

The same syntax form is read the same way no matter what encloses it.
Where that form sits in the code may pick which LENS reads it, but it must
never create a second variant of how one lens reads it.

There are three lenses. The exit lens has a single reader,
`read-conditional-exit`, used for a conditional expression (a ternary, a
`&&`/`||`/`??` chain, or a `?.` access) that IS an exit, in every exit
position alike: a `return`, a `throw`, a concise-arrow function body, and
a value assigned to a `const` that then flows straight into a `return`.
Every one of those is split into per-arm exits by exactly the same code.
The value lens has a single reader too, `handle-ternary`, used for a
ternary in every other value position alike: a call argument, a field or
variable initializer, an object property, a `yield`, a parameter default,
an operand inside a condition. Its value flows on, so it is a branch whose
arms fall through to the enclosing statement, never an exit. The third
lens reads an expression used AS a condition: `if`, a ternary's own
condition, or a `??`/`?.` non-nullishness check. `read-condition`,
`read-condition-tree`, and `read-nullish-leaf` read this lens. `a && b`
is genuinely one predicate when it appears as `if (a && b)`, and genuinely
two separate value paths when it appears as `return a && b`. Those are
different lenses looking at the same operators, not two different readers
for the same lens. Both ternary lenses read the ternary's own condition
through the condition lens and key the branch the same way, so a ternary
keeps its ID whichever lens reads it.

Whether a branch can be steered is likewise decided in exactly ONE place:
the steerability gate inside `derive-cases`, used identically for `if`,
`switch`, a ternary, a `&&`/`||`/`??` chain, and `?.`. It asks two
questions of every leaf condition. First: is there an input a test case
could set? This means a plain scalar parameter, an environment-variable
operand, or a welded literal constant (section 4's entry on evaluating
welded branches, and section 5.13, cover this term). Second: does the
predicate actually name a value to compare it to
(`is-predicate-constraining`, which uses the same `type-to-range` engine
the value-arranging step itself runs)? Either question failing means the
branch is admitted as undriven, and the admission states WHICH question
failed, because the two point the reader toward different fixes:
`unarrangeable-operand` means make the deciding value a parameter,
`unread-comparison` means compare it against a literal value. Telling a
reader to make `m` a parameter, when `m` is already a parameter, would be
advice they cannot act on. That is exactly the failure the second
question exists to prevent: a comparison like `m === TARGET`, or `case
Sev.Low` against an enum, or any other comparison against an imported
constant Assayer cannot read a literal value from, reads as an
`unrecognized` predicate that constrains neither arm. Without this
question, both arms would be arranged with the same value, and whichever
arm the case predicted would fail the build against code that was
actually correct.

A welded leaf (its value captured as `operandConstValue` or
`operandConstLength`, stamped either by `read-const-operand` for a
same-file `const`, or by `stamp-const-leaves` for a literal argument at a
call site or an invocation) is not steered. It is evaluated:
`cause-arrange` seeds it as a domain (the set of possible values)
containing exactly that one value, so the arm it satisfies becomes a real
test case, and the arm it violates falls out of that same emptiness check
as an `unreachableExits` entry, never a second, bogus test case. Being
welded only answers the FIRST question above, whether there is an input to
set: with an unreadable comparison, the single welded value still reaches
both arms, so the branch stays undriven regardless.

An object-member read, such as `config.mode`, names its root parameter,
but is not itself scalar-arrangeable (this section covers why). So, in the
per-file analysis alone, a leaf carrying `operandPropertyPath` stays
un-steerable, and its branch is admitted as undriven, with the property
fact captured for the stub stitch (section 9). That admission closes at
the moment Assayer runs the test: `stub-realize` (section 9), the object
counterpart to the cross-file compose overlay, arranges the object
parameter from the merged stub view (the derived per-property demands,
combined with any committed correction under `assayer/stubs/`), and
drives the branch. An object-member branch is undriven in the file's own
analysis, and driven when the test actually runs, exactly the way an
opaque cross-file call guard is.

A branchless predicate's return comparison (comparing which of two values
a function returns, with no `if` involved) rides this same gate, but its
failure mode differs: when it cannot be steered, it is simply OMITTED. The
entry stays callable; it just cannot tell its own two return values apart
from a test case. It is never admitted as undriven the way a real branch
is.

All of this exists because reading the same syntax in two different places
is a genuine soundness risk: nothing then guarantees the two readings
agree with each other. A `?.` receiver's drivability is checked in exactly
one place, inside `derive-cases`, and nowhere else, for exactly this
reason. If a second, independent check existed too, for example one
inside `read-conditional-exit` gated on `context.params`, and a separate
one inside `read-value-flow-exit` with its own drivability logic, one
`cond ? a : b` expression could come out three different ways: split into
per-arm exits, treated as a single exit, or reported as a dark spot,
depending on nothing but whether it happened to sit inside a `return`,
behind a `const`, or after a `?.`. Asking "is this drivable?" anywhere but
`derive-cases`, or reading one lens two different ways depending on where
it sits, reopens exactly this risk.

Note that a non-drivable CONDITION is not the same thing as a dark spot:
the branch itself is still emitted, and the steerability gate in
`derive-cases` admits it as undriven. Only a genuinely unrecognized SYNTAX
shape becomes a dark spot, never merely a condition Assayer cannot steer.

### 5.13 The full case set is the whole testable breadth; `salient` marks the subset worth running

`derive-cases` produces one test case for every input COMBINATION the
code's logic actually distinguishes: the cartesian product of every
branch's arms (keeping each arm's own short-circuit causes distinct), a
branchless predicate's true and false return values, and every array
parameter's cardinality classes (empty, one element, many elements, built
by `array-arrange` and crossed together by `cause-arrange`). This holds
even when several different combinations end up reaching the exact same
exit.

Every case carries a `salient` flag. The salient subset is one
representative case per distinct predicted output, the minimal set worth
actually RUNNING. The full set, salient and non-salient together, is the
file's whole testable breadth. So a file's total case count measures its
breadth, and `salient` is what a reviewer should read as "must run."

"Predicted output" here means `reachesPath`, the exit path a case reaches,
because two different buckets reaching the same exit path return the same
literal value. There is exactly one exception: a branchless predicate's
two possible return values leave through the same exit path, so a
separate field, `predWant`, tells those two apart, and each one still
earns its own salient case. Everything else that shares an exit path
collapses together in the salient subset: the first case found is salient,
and the rest exist in the full set as non-salient, "grayed" twins. A
branch that converges back with another is therefore not dropped from the
full set: even a bucket whose own flow never actually reaches a given
branch (because an earlier branch already decided the path) still
constrains that branch soundly, and stays in the full set as one of these
grayed twins. Because Assayer does not model side effects, two buckets
that differ only by a side effect over-collapse in the salient subset,
though the full set still carries both of them separately. The
cross-system stub repository (the demanded values for objects, arrays, and
environment variables) is a SEPARATE artifact from this case set. The full
requirements are D22 and D23 in `plan/requirements.md`.

---

## 6. Adding a construct: the recipe

Follow these steps in order. Skipping step 1 is how you end up asserting
what the code currently does, instead of what it should do.

### Step 1: add a specimen first

Add a new example file at
`manual-smoke-repo/packages/syntax-repository/src/<bucket>/<category>/<rung>/<rung>.ts`
(or `.tsx`; the walker treats the two extensions the same way), plus a
colocated `<rung>.test.ts` (or `.test.tsx`, matching the root file's own
extension) that asserts only what is BESPOKE to that one file: its exact
coverage IDs, and the shape of its analysis.

The catalogue is organized into two top-level buckets, by RUN VERDICT, not
by source shape:

- `happy-path/` holds a file where running it comes out clean: no
  admission at all, and either at least one test case, all of which
  passed, OR zero test cases (a declaration-only file that derives no
  entry has nothing to fail, so `runUnitBroker` never invokes Jest for it,
  and the honest result is `cases: []` with every admission channel also
  empty).
- `sad-path/` holds a file meant to come out unclean: a failing case, or a
  dark spot, a gap, an undriven admission, or a lint.

Category folders group related examples. Every example is its own folder,
named the same as its root file (`<rung>/<rung>.ts`), so a multi-file
example keeps its helper files colocated beside its root.

A ratchet is an example that currently reports a dark spot, but is
expected to stop doing so once its handler lands. The day that handler
lands, the example MOVES from `sad-path/` to `happy-path/`. Until then, if
it is currently a dark spot, assert that fact first, then flip the
assertion once the handler exists.

The bucket a specimen sits in judges its RUN, never its source shape. That
is why one exact source file can legitimately exist in both buckets at
once: `sad-path/input-gap/callback-param` and
`happy-path/harness/callback-param` can be byte-identical files whose
verdicts differ only by one committed `<basename>.harness.ts` file sitting
beside one of them. A specimen moves from one bucket to the other when its
OWN verdict changes, never merely because some feature that COULD change
its verdict has landed elsewhere.

The surface end-to-end test derives its expected surface directly off
disk, so it needs no edit for a new specimen file. Section 8 covers this.

### Step 1b: declare the specimen

Add one line to `packages/core/test/harnesses/specimen-registry.ts`,
naming what the file IS (for example `['access:named', 'branch:if']`),
never what it should be tested for. The test suite walks the catalogue
directly off disk, so an undeclared specimen fails the catalogue check
outright, rather than being silently skipped. The traits you declare are
what decide which checks the specimen owes; everything universal (valid
TypeScript, deterministic output, producing a run artifact, living at
`<bucket>/.../<name>/<name>.ts`, and running to the verdict its bucket
declares) applies automatically, with nothing written for it.

Author this declaration by READING the file yourself. Never generate it
from the analyzer's own output: a check that asks the analyzer what is in
a file, using the analyzer's own answer as the expectation, could never
notice the analyzer being wrong about that file. It would simply agree
with itself, run fewer real checks, and report success. That is exactly
the "never derive an expected value from the code under test" rule, one
level up. The full requirement is P4 in `plan/requirements.md`. The
separate cross-check test,
`analyze-file-broker.integration.test.ts`, is only worth its runtime
because the registry and the analyzer are authored independently of each
other. A trait the analyzer cannot see, or a fact the analyzer sees that
nobody declared, fails there, which is exactly what a forgotten trait
looks like.

That cross-check test is NOT part of `test:syntax`. It is a core
integration test, so it runs under `npm run ward`, while `test:syntax`
runs only the colocated specimen tests themselves. A declaration missing a
trait the file plainly has will pass `test:syntax` and every scoped unit
run, and will fail only inside ward's integration graph. After adding or
editing a specimen, run BOTH `npm run test:syntax` and `npm run ward`.

### Step 2: write the handler

Write `handle-<x>-layer-transformer.ts`. It emits the construct's branch or
branches, and its exit or exits, and returns descents built with
`walkContextTransformer({ context, guardSteps: [...] })` for each arm. It
must not recurse itself, must not look at its own parents, and must not
know that any other construct even exists.

### Step 3: add one route

Add exactly one route for the new handler inside
`dispatch-node-layer-transformer`.

### Step 4: add the handler's proxy and test

Add a proxy and a test for the handler. Both are enforced by lint rules.
Beyond the handler itself, the derivation semantics also need to work: a
branch is useless until `transformers/type-to-range` and
`transformers/derive-cases` can turn its predicate into concrete values.

### Step 5: verify

Run the verification loop in section 7.

You should not need to touch any EXISTING handler while doing any of this.
If you find yourself doing so, ask why. That is the exact smell this whole
architecture exists to prevent.

---

## 7. Verification loop

Probe before you assert. Discover the real values by running the real
code. Never guess an expected string and write it into a test. From the
repo root:

```bash
npx tsx /tmp/.../probe.ts
# Import by ABSOLUTE path:
# import { walkFileTransformer } from '/abs/.../transformers/walk-file/walk-file-transformer';
# Import ts-morph the same way too, from '/abs/.../node_modules/ts-morph'.
```

Then run BOTH of these commands. `test:syntax` is NOT part of ward's Jest
graph, so running ward alone does not cover it:

```bash
npm run test:syntax        # the specimen catalogue
npm run ward                # lint, typecheck, unit, integration, and e2e, across all 5 packages
```

Two properties must hold, and a probe script is a cheap way to check both:

- Determinism: the same source produces byte-identical analysis across
  repeated runs. There is no leakage from `Map` or `Set` iteration order.
- Formatting immunity: a minified version, a reformatted version, and a
  version using different quote characters, of the exact same logic, all
  produce IDENTICAL coverage IDs.

---

## 8. Traps that will cost you an hour

**A layer file's proxy stays empty.** Every `*-layer-transformer.ts` file
in `transformers/walk-file/` is a pure transformer. Tests run it for real
and never mock it. So its `.proxy.ts` returns an empty object, and no
proxy creates a child proxy for a transformer it imports. The lint rule
`enforce-proxy-child-creation` reports such a creation as a "phantom"
proxy. This is also why the walk's mutual recursion needs no proxy wiring
at all.

**A type that several layer files share lives in `contracts/`.** The
walk's vocabulary (`HandlerResult`, `Descent`, `WalkNode`, `ScopeRecord`,
and the readout shapes) is declared there, one contract per shape. A layer
file imports it with `import type` from `contracts/`, never from a sibling
layer file.

**No handler imports `walk-node-layer-transformer`.** A handler returns
descents instead of recursing, so the import graph runs one way:
`walk-node` imports `dispatch-node`, and `dispatch-node` imports the
handlers. `handler-result-layer-transformer`, the constructor every
handler builds its answer with, imports nothing else from the walk.

**An expression-level branch is exit ownership, not a handler.** Section
6's recipe does not reach this case, because `guardPath` assumes a guard
is a STATEMENT enclosing other STATEMENTS, while a ternary's arms guard an
expression SUBTREE instead. `handle-exit` emits its own exit BEFORE
descending into its expression, and exits merge back UPWARD through
`walk-node-layer-transformer`, so a branch that sits inside a `return`
expression cannot reach back out and retract that `return`'s own unguarded
exit. Instead, the exit's OWNER splits it. An exit-position ternary
(`return cond ? a : b`, `throw cond ? a : b`, or a concise-arrow function
body that IS a ternary) is handed to `read-conditional-exit-layer-transformer`,
which reads the condition as a `ternary` branch and emits one guarded exit
per arm, recursing for a nested ternary. `handle-exit` delegates to it for
a block-bodied `return` or `throw`; `handle-function` delegates to it
directly for a concise-arrow body, which never reaches `handle-exit` at
all. A non-ternary expression instead returns a `{ conditional: false }`
sentinel value, leaving the single-exit path unchanged.

Value-position value-flow (the pattern `const x = <conditional>; return
x`) rides this same split, at the block level instead of the expression
level: `read-value-flow-exit` matches this adjacent shape (a single
`const` binding, an exit expression that is EXACTLY that identifier by
SYMBOL, and a condition `derive-cases` can steer), and hands
`handle-block` the same per-arm split, this time as `return cond ? y : z`,
with the intermediate `x` never appearing. `handle-block` drops the two
statements it just consumed from its own descent and folds their facts in
directly; `handle-function` then MERGES that block's branches, exits,
probe sites, and nodes (not merely its descents), and the function's own
scope claims them through `opensScope`.

Every other ternary reaches the walk as a node, and `dispatch-node` routes
it to `handle-ternary`: a non-adjacent or transformed use (`return x + 1`,
`f(x)`), a `let` binding that gets reassigned, a ternary in argument
position or inside JSX. Its value flows on into the expression around it,
so it is a `ternary` branch with no exit of its own. Each arm is a
fall-through arm, and both meet again at the enclosing statement, the
same way two `if` arms meet again at the statement after the `if`. So a
ternary is never a dark spot. A non-drivable CONDITION is a different
thing again: the branch is still emitted, and the steerability gate in
`derive-cases` (section 5.12) admits it as undriven, never as a spurious
test case.

**A `*/` inside a doc comment terminates the comment early.** Writing a
scope path like `*module*/classify` inside a `/** ... */` block produces
confusing TS1109 or TS1005 parse errors, because the `*/` inside it closes
the comment early. Do not put scope paths inside comments.

**Tests may not contain conditionals**, including a form like
`result.success === true && result.x`. Assert the WHOLE discriminated-union
result using `toStrictEqual` instead. Test files also may not define
helper functions (enforced by `forbid-non-exported-functions`); a
top-level `const` holding plain DATA is fine.

**Adding any non-test `.ts` file to the syntax-repository package makes it
part of the analyzed surface.** A test-only shim placed at the package
root would silently inflate the e2e suite's `ts N` file count. Map jest
aliases directly at core instead of adding shim files to work around this.

**Adding a specimen needs no edit to the surface e2e test.**
`packages/app/src/flows/app/surface-tree.e2e.ts` derives the compiled
surface itself, meaning the header's `ts N` count, the sorted list of
files, and the sorted list of directories, directly off disk, through
`syntaxSurfaceHarness` (the same rule the compiler itself uses: every
`.ts` file except `.test.ts` files). So it keeps itself up to date
automatically. The one edit a new specimen still requires is its line in
`specimen-registry.ts`; without that line, the catalogue check fails.

**Moving a specimen is the opposite: it breaks literal paths elsewhere,
and only at run time.** The registry keys specimens on their path, and so
do several other places that name a specimen to prove a specific run
behavior: `run-unit-broker.integration.test.ts` (its `MODULE_SPECIMEN`
constant and its siblings), and the app's e2e tests, which select
specimens by `data-relpath` (`detail-admissions.e2e.ts`,
`detail-tests-tab.e2e.ts`). Miss one of these after a move, and the
integration test fails with a file-not-found error, or the e2e test clicks
on nothing. The `discover` tool is the way to sweep for these references
before and after a move, since plain grep is blocked in this environment.
A move that changes a specimen's VERDICT (for example, a construct
flipping from an admission to a fully driven case) also moves its bucket,
and that is exactly what those other files assert on.

**The runner's Jest config must be IDENTICAL for every file of one module
format.** ts-jest keeps one TypeScript compiler alive per distinct config,
and never releases it. Anything that varies the config per file strands a
whole extra compiler in memory, roughly 370MB each, which shows up as
`assayer unit` running out of memory partway through a real repo, not merely
running slowly. Which run to execute travels through the test-path pattern
instead, never through `roots` or `testMatch`. The `__assayerCoreRuntime`
global and the source-tree export condition are fixed for the life of one
process, so they keep the config identical. There are two configs, one per
module format (CommonJS and ESM), because Jest's `extensionsToTreatAsEsm` is
one list per config: a config loads every `.ts` file as ESM or none of them.
So a batch costs at most two compilers. There are two ways to break this
rule, and the second looks harmless:

- naming the run's own directory directly inside the config, and
- minting a fresh temporary directory per test run. A new path is a new
  config just as surely as a naming change is, which is why
  `run-unit.harness.ts` wipes and reuses one stable path, rather than
  generating a new one per run.

The test `run-execute-cases-broker.test.ts` checks this rule directly, with
the assertion "{two different %s runs} => the config is IDENTICAL, so
ts-jest reuses one compiler", once per format. If you are about to make the
config depend on which file is running, that test is exactly why not to.

**A run executes in the module format the consumer's own code runs in.**
`moduleFormatReadBroker` decides it per target file. It asks TypeScript's
`getImpliedNodeFormatForFile`, through the typescript gateway, with the
options of the tsconfig that owns the file (section 5.10), never the
nearest tsconfig's. The two differ for a file its package config excludes,
such as a test file. When no tsconfig owns that file, TypeScript makes no
claim for it, and Node's rule decides, which is how Node itself runs it.
TypeScript answers only for a node module kind (`node16`, `node18`,
`nodenext`). For any other module kind it makes no claim, and the broker
applies Node's own rule instead: the file extension, else the nearest
`package.json` `type`. The format picks the generated test
file's extension (`assayer.test.cjs` or `assayer.test.mjs`, so Jest never
reads the format off a consumer's `package.json`), the ts-jest `module`
override (`commonjs` or `esnext`), and for ESM, `useESM` plus
`extensionsToTreatAsEsm`. Neither override is a node module kind, because a
node kind with `isolatedModules` sends ts-jest to a transpile path that
compiles with the installed `typescript` package instead of ts-morph's copy.

**ts-jest compiles each file of a run on its own, never through a
type-checked program.** Both overrides in
`coreRuntimeStatics.tsJestCompilerOptions` set `isolatedModules`, so ts-jest
calls `transpileModule` on ts-morph's TypeScript for one file at a time.
Without it, ts-jest builds a language-service program over every file the
consumer's root tsconfig includes before it compiles the first file, and
builds a fresh type checker for each file that program has not seen. In
PE-12 that program took 14 to 21 s of a worker's first run, and about 1 s of
every later run. A real consumer pays it in proportion to the size of their
repo. A run needs nothing from types: `diagnostics` is off, and the probe
transformer reads only the syntax tree. The specimen run artifacts are byte
for byte the same either way. The price is code that compiles correctly only
as a whole program. Two cases fail at run time: an ES module that re-exports
a type without the `type` keyword (`export { Shape } from './shape'`), which
Node rejects when it links the module, and a `const enum` declared only in a
`.d.ts` file, which has no value at run time. TypeScript's own
`isolatedModules` check reports both in the consumer's code.

**The nested Jest runs in a worker process, never in the caller's own.**
Jest runs an ES module only through `vm.SourceTextModule`, which Node puts
behind `--experimental-vm-modules`, and only a process's own command line can
turn that flag on. The flag also slows every run, CommonJS runs included, by
about 100 ms (measured in PE-3 and PE-8). So `runExecuteCasesBroker` keeps one
worker per module format: the ESM worker starts with the flag, and the
CommonJS worker starts without it. The node gateway's `forkWorker` keeps each
one alive for the life of the calling process, so Jest, ts-jest and each
format's compiler start once per batch. Both workers run the root
`run-jest.js` through the same code path; only their Node flags differ,
from `coreRuntimeStatics.workerExecArgv`. A worker forks with
`process.execPath`, so under Electron with `ELECTRON_RUN_AS_NODE` it is
Electron's Node, and the flag works there too. A worker never keeps the
caller alive while it is idle, and it exits when the caller's process ends.

**An ESM run has no setup file.** A Jest setup file is CommonJS, and in an
ESM run of core's TypeScript source, core's `.ts` modules load as ES modules,
which a `require` cannot load. So the ESM test file installs `__P` itself
before it imports the subject. A CommonJS run keeps `probe-runtime.js` as its
setup file. The same reason makes `harness-registrar.js` load nothing on its
own: the generated test file hands it core's main module, through
`bindValidator`, before it loads a harness.

**A relative import resolves the way TypeScript resolves it.** The root
`ts-resolver.js` is the nested Jest's `resolver`. It asks ts-morph's
`resolveModuleName`, with the options of the tsconfig that owns the importing
file (section 5.10), and takes the answer when it is TypeScript source outside
`node_modules`. That is what lets `import { band } from './band.js'` find
`band.ts` on `node16` and `nodenext`, and what lets a `paths` alias resolve,
in both formats. Anything else resolves through Jest's own resolver. The
resolver is plain JS in a Jest worker, so it cannot call `brokers/tsconfig/owner`.
It repeats that search over the same TypeScript calls. Jest gives a resolver
only the importing file's folder, so it asks whether a config's parsed file
list holds a file in that folder, where the broker asks about the file itself.
A folder no config owns gets TypeScript's defaults.

**One nested Jest run proves nothing about fifteen at once.**
The worker runs every file of a batch, so memory stays flat only while the
rule above holds. The memory cost is per CONFIG, not per run, and it does
not show up until something drives the whole specimen catalogue through
this path at once.

**The wrapped runner loads core's run-time modules from the same tree
`runUnitBroker` was loaded from.** The run-time modules are the typed code
the nested Jest calls: the case interpreter, the entry resolver, the probe
runtime, the probe injector, and `assayerHarness`.
`coreRuntimeTransformer` picks the tree from the broker's own `__dirname`.
When the broker runs from `src`, under ts-jest or `tsx`, the nested
ts-jest compiles core's TypeScript source. That run also sets the `source`
export condition, so a workspace package core imports resolves to its
source too, and the worker registers tsx, because ts-jest loads the probe
injector with Node's own `require`. When the broker runs from `dist`, as in
the built CLI or a published install, the nested Jest loads `dist`. One run
therefore reads one tree, so `src` and `dist` cannot disagree inside it.

No Jest run builds anything. Core's unit and integration tests read
source. The CLI integration tests are the exception: they spawn the built
CLI binary, so they need a current build.

The ceremony files are the plain-JS files at core's package root that Node
or Jest loads by path. They are plain JS because the nested Jest config is
JSON, so it can only name a file, and Node or Jest loads that file before
any TypeScript support exists. Each one has a single job:

- `probe-runtime.js` is the CommonJS run's Jest setup file. It installs the
  probe runtime that records which exit a case reached.
- `probe-transformer.js` is ts-jest's AST transformer. It injects the
  probes into the code under test as ts-jest compiles it.
- `harness-registrar.js` is what `@assayer/core` maps to inside a run, so a
  harness's registration lands where the generated test file reads it.
- `bundled-typescript.js` is ts-jest's `compiler`: the TypeScript that
  ts-morph bundles, loaded from the ts-morph install the npm gateway uses,
  so it is the same object `#gateway/npm/typescript` exports. The analyzer
  hash reads ts-morph's version from that same install.
- `ts-resolver.js` is the nested Jest's resolver (see the entry above on
  relative imports).
- `run-jest.js` is the worker process's entry. It runs Jest for each
  request the worker receives.

The file names of the run-time modules and the ceremony files live in
`statics/core-runtime`. Adding, moving or renaming one means editing that
file.

**Coverage IDs are cache-internal by design.** Changing how they are
computed only costs a fixture rewrite, never a migration for anyone
downstream. Do not contort the design just to preserve one particular ID
string.

---

## 9. Cross-file and external resolution (the stitch)

The walk parses one file, and records what leaves that file as raw
references only: an `import` callee arm on a call site, and flat
`moduleEdge` records for each import or re-export statement. A separate
pass, run after every file has already been walked, turns those raw
references into resolved edges. Call this separate pass "the stitch." It
never re-parses source. It reads already-finished per-file blobs back from
`blobsDir` (so a file already analyzed earlier in the same run is read
back, not re-walked), and it reconciles references purely by lookup.

**Reconcile on the definition site, never on the specifier string.**
Different ways of spelling the same import (`../b/foo` vs `../../b/foo`),
and aliased paths (`@app/foo`), all resolve to one canonical
repo-relative `(file, symbol)` pair, through TypeScript's own
`ts.resolveModuleName` (`brokers/import-specifier/resolve`).

**Resolve each import under the options of the importing file's owner.**
Each file can belong to a different tsconfig, with its own `paths`,
`baseUrl` or `moduleResolution`. So the stitch looks up the tsconfig that
owns each file (section 5.10) and resolves that file's imports under that
owner's options. A hop through a barrel file uses the barrel's own owner.
The other brokers that resolve a specifier follow the same rule:
`compose` (cross-file map and predicates), `param-type-resolve`,
`run-cross-file-probes` and `stub-realize` each resolve under the owner of
the file whose import they follow. A re-export barrel file (a file
whose whole job is re-exporting things from elsewhere) is followed through
to the real definition, using a seen-set (a record of files already
visited) to stop if it cycles, implemented as recursion rather than a
`while (true)` loop. The seen-set alone is enough to guard against a
cycle here, because the walk itself never recursed across a file boundary
in the first place.

**Classify each resolved edge as `local`, `package`, `builtin`, or
`unresolved`.** `brokers/compile/resolve-graph` emits both the resolved
edges and any resolution errors. A `local` target is keyed by its in-repo
definition path. A `package` or `builtin` target is keyed by its package
name.

**Read external signatures through the second, `node_modules`-aware
project (section 5.10).** A resolved edge for a CALLED package or builtin
carries the declared `{ params, returnType }` of that callable, read
through `brokers/external-signature/read-declaration` and fed through the
SAME `read-type-fact` to `type-descriptor` pipeline every other type goes
through, so this introduces no new type language. The result is cached by
the `.d.ts` file's own byte hash, at
`.assayer/cache/external-signatures/<declHash>.json`, and reused by every
file that imports it. The second project is rooted at the importing
file's owner config, so that owner's `types` and `typeRoots` apply. One
external callable is read once, under the owner of its first importer in
path order, so the read never depends on which import finished first. An
importing file that no tsconfig owns gets no external read. A dependency
shipping no usable type information raises `no-usable-types`.

**Read ambient globals and typed built-ins through the second project's
GLOBAL scope.** A free identifier the hermetic walk cannot type
(`console`, `process`, `Buffer`, which resolve to a host library or to
nothing at all, but never to the plain ES standard library) is recorded,
without being resolved, as a `globalUse`. A CALLED node built-in (`import
{ join } from 'node:path'; join(a, b)`) is read the same way. The stitch
resolves each of these by probing the second project directly: a called
reference yields a `{ params, returnType }` signature, and a member
access such as `process.env` yields its member's type. These are cached
at `.assayer/cache/global-signatures/<hash>.json`. Each resolves into a `{
kind: 'global', name, member?, signature?, type? }` resolved-edge value,
except that a called builtin instead has its signature added onto its
existing `builtin` edge. A resolved edge is emitted for every use, so
nothing here is ever silently invisible. A CALLED use that `@types/node`
cannot type is additionally a `no-usable-types` build error at the call
site; a member access that cannot be typed is merely recorded, with no
error. This is the sanctioned way anything Node-related earns a cache
entry. The hermetic walk itself stays typeless (section 5.10 is untouched
by any of this), and `read-env-access` still proves `process.env`
entirely on its own, without help from this second project.

**The cache split keeps this honest.** Per-file blobs stay pure: raw
references and module edges only, nothing resolved. Each blob is stored
under its `analysisHash`, the hash of the file's analysis options key plus
its bytes (section 5.10). The resolved index is a DERIVED artifact, keyed
on `layoutHash` plus `tsconfigHash`. `tsconfigHash` covers, for each
analysed file, its owner config's path relative to the root and the owner
options that decide where an import lands (the `resolution` list in
`statics/analysis-options`). Paths are written relative to the root, so
the key is the same on every machine. The index is rebuilt whenever the
file set changes, or any owner's resolution options change. It is written
to `.assayer/cache/resolved/<namespace>.json`. Moving a file with no other
edit, under the same owner options, re-parses nothing (the blob key holds
only the options and the bytes, and neither changed), and simply
re-resolves edges against the new layout, so an import nobody updated
after the move surfaces honestly as a broken link, never as a stale
pointer nobody notices.

**The stub index is a second, twin stitch, over the same blobs.**
`compile-stub-graph-broker` reads the already-finished blobs back by
lookup, the same way the resolved index does. It never re-parses, and
never re-resolves; the blobs stay pure. For every object type a blob
declares, it splices a per-property value demand onto that type's FULL
declared property list: a property some branch actually reads (like
`config.mode`) carries the values that branch distinguishes between,
computed by the same `type-to-range` to `domain-values` math the case
engine itself runs (this object-member branch is admitted as undriven in
the per-file analysis, but its branched VALUES are still real demands on
that property). A property no reader ever touches carries an honest
`unknown` demand instead. This index keys on the SAME layout-plus-tsconfig
hash the resolved index already carries, and it is written atomically to
`.assayer/cache/stubs/<namespace>.json`, keyed by
`<definitionRelPath>#<TypeName>`, through `stub-index-write-broker`.

Deciding which blobs' read facts feed into one type, and which files read
that type, happens in exactly ONE seam: `gather-type-reads-transformer`.
It inverts the resolved index: a type declared in one file and branched on
across several others is keyed on its DEFINITION site, and every reader's
own per-property demand is unioned onto that one entry, with `readers[]`
listing exactly the files that read it. A reader reaches the type's
definition by reconciling the branch leaf's own `operandTypeRef`: a
same-file type resolves to the reader itself, while a cross-file type
resolves through the reader's `local` import edge (a type-only import like
`import { Config } from './types'` is recorded as a module edge exactly
like any other import, so the resolved index already carries it, with no
special case needed). The per-property value math itself,
`collect-property-demands-transformer`, stays on the far side of this
seam, unaffected by any of this bookkeeping.

**Environment-variable reads are the object twin of the above, because
`process.env` IS an object.** `gather-env-reads-transformer` folds every
file's `process.env.<X>` reads into one environment stub per property,
keyed as `process.env#<PROP>` on the property name alone (never on a
type, since `process.env` has no declared shape inside the hermetic
walk). Two facts already on the blob feed this: the module graph's
`envReads` (bare `process.env.<X>` reads the walk captured, each carrying
its property name and any literal it was directly compared against), and
the env-read branch leaves (`operandEnvVarName` names the property). A
leaf whose steps keep the variable's value, up to `Number`, contributes
its predicate's literal, the switch or if-comparison value. A leaf whose
steps compare the variable (`process.env.FLAG === 'on'`) contributes that
comparison's literal instead, and a length predicate contributes none,
because a boolean or a length is not a value of the variable. The
resulting `values` are every distinct branch literal GUESSED, plus one
representative value for anything else, marked `guessed: true` (meaning
this is a best-effort guess a human can later correct, never treated as
authoritative on its own). `readers[]` lists every file that reads that
property. This runs regardless of whether the read is drivable: a
`process.env.MODE === 'x'` comparison written in place in a condition is
admitted as undriven (section 4: only a bound operand is followed), yet
its literal is still recorded as a real stub demand. The `process.env` proof itself stays entirely checker-based;
nothing here adds `node_modules` access to the main walk.

**`param-type-resolve` gives an IMPORTED parameter type its declared
shape, and every other consume-time overlay runs behind it.** The
hermetic walk types an imported type as `any` (section 5.10), and records
only the reference the function's own signature spelled, so `fill-param`
refuses that parameter, and the entry gets reported as needing an input
that the very next file over constructs without any trouble.
`param-type-resolve-broker` reads that declaration off the sibling file on
disk, the same per-run sibling read `compose` and `stub-realize` both
already do, and it turns on the DECLARATION alone, never on how the entry
happens to branch: a reader that only uses the value gets the exact same
shape as a reader that branches on one of its members. What comes back is
whatever the declaration actually denotes (a scalar alias, a literal
union, an array, an object), so the rest of the existing derivation
handles it with nothing extra added. Two input facts move together here:
the parameter's own declared type, and each branch leaf's OPERAND type,
because an opaque operand only knows the one point to AVOID, so `level ===
'low'` would otherwise fill both arms with `'low'` and predict one exit
while the code actually reaches the other. The walk's own parameters get
rewritten, and `analyze-file-broker` re-projects the whole file from that
rewritten input, which is why there is exactly one derivation path here
and nothing left to reconcile between two paths. A file's own
`declaredTypes` are carried through untouched by this overlay: a sibling's
shape is not a shape this file itself declares, and letting one in here
would incorrectly key that shape's stub on the reader instead of on the
file that defines it. This overlay is wired into the same three seams as
the overlays described below, ahead of all of them, and passes a file
straight through unchanged when none of its parameters name a resolvable
reference.

**`stub-realize` drives object-member branches at the moment Assayer runs
the test, the object counterpart to the cross-file compose overlay.** A
branch on `config.mode` is admitted as undriven in the per-file analysis,
because an object parameter's individual property is not
scalar-arrangeable (section 5.12). `stub-realize-broker` closes that gap
at run or serve time, exactly where `compose` closes an opaque cross-file
call guard: for an entry whose branches all read object members of a type
with a stub, it builds that type's merged stub view (the derived
per-property demands from `collect-property-demands`, combined with the
committed overlay from `stub-view`), enumerates the same input buckets
`derive-cases` already enumerates, and hands each object parameter to
`object-arrange-transformer`, which fills every property with a stub
value that SATISFIES that bucket's own requirement. This produces an
`object-arrange` discriminant shaped like `{ kind: 'object', param,
value: { prop: val, ... } }`. A property WITH a committed correction is
AUTHORITATIVE: `object-arrange` seeds its domain from ONLY the corrected
values, and never falls back to the branch's own literal. When no
corrected value can satisfy a given bucket's guard, that bucket is
unreachable and gets dropped rather than producing a bogus test case, and
the contradiction itself is raised as a P1 error by `stub-contradictions`
before anything even runs. A property WITHOUT a correction keeps the
derived demand instead, which always contains the branch's own literals,
so its guard is always satisfiable. A same-file type reads directly off
`declaredTypes`. A cross-file type resolves through the import the entry
declares, and its definition is re-walked on disk, the same per-run
sibling read `compose` performs. The values used here are always INPUTS (a
human correction wins over the derived demand), never outputs, staying
consistent with "never derive an expected value from the code": the
resulting test case asserts that execution reaches an exit structurally,
not that a particular value comes back. This overlay is per-run only,
never persisted into a blob or into the cache, and it is wired into the
same three seams `compose` uses: `run-unit-broker`, the `syntax-traits`
harness, and `compiled-file-resolve-broker`. A human correction thus
becomes a real test case that runs and can genuinely fail, which is the
entire payoff the stub repository exists to provide.

**The committed overlay combines with the derived stub index only when
read, never inside a hash.** The DERIVED stub index described above is
cache-internal. A human corrects a value inside the COMMITTED
`assayer/stubs/` folder instead (`objects/<definitionRelPath>/<TypeName>.json`,
`env/<PROPERTY>.json`), OUTSIDE the cache, with the file's own PATH
carrying the stub's stable key. `stub-overlay-load-broker` reads that
file. `stub-view-transformer` combines the derived index with the
overlay: a correction REPLACES the demanded values of each property it
names (or an environment stub's values), while any property the
correction doesn't mention keeps its derived demand. This combination is
computed fresh every time something reads it, and it is NEVER persisted
in already-merged form. The overlay is in NO hash, so editing it never
invalidates the derived index, and the cache stays fully disposable and
rebuildable at any time.

A correction can be wrong in exactly two ways, and both are P1 build
errors, folded into `compile-run-broker`'s error list (exit code 1, the
same class as a broken import), each one naming the overlay file, the
identity involved, and the fix:

- A STALE correction: its type key is absent from the index, a property it
  names is absent from that type's full property list, or an environment
  key it names is absent from the environment stubs.
  `stub-overlay-reconcile-broker` raises this.
- A CONTRADICTING correction: its authoritative values cannot possibly
  satisfy a branch guard that reads the property (for example, `mode ===
  'a'` where the correction's values for `mode` omit `'a'` entirely). This
  is dead code under the human's own stated truth, and
  `stub-contradictions-transformer` catches it BEFORE anything runs. Over
  the per-guard `guards` list the stub stitch gathered
  (`gather-property-guards`, the guard counterpart to `gather-type-reads`),
  it intersects the corrected values (a domain with a fixed set of
  members) with the guard's own satisfying domain (`type-to-range`
  combined with `intersect-domains`), and reports whichever ones
  `is-domain-empty` proves are now unreachable, naming the reader file and
  line. This is the exact same emptiness check the unreachable-exit lint
  uses elsewhere. Only a guard comparing against a literal is judged this
  way; a truthy or falsy check's satisfying domain is a sample, not a real
  constraint, so it is skipped.

This is the first concrete case of a general pattern: a committed
override, reconciled against a derived index. The same pattern applies to
named states too, which do not exist as a built feature yet.

**The harness index is a third stitch, over the files classified OUT of
the analyzed surface.** `compile-harness-graph-broker` runs alongside the
stub stitch, on the same collision rule, and reads the same
already-finished blobs by lookup. What it stitches together is the
committed `<basename>.harness.ts` files the plan brokers already split off
from the analyzed surface. Loading a harness IS the read: since a harness
declares callbacks, there is no way to know what it declares except by
running it, transpiled and evaluated inside a sandbox whose only reachable
import is the published `assayerHarness` function, bound to that call's
own collector. This is exactly why the compile-time key inventory and the
run-time values are both validated by the same one function. Only KEYS are
written to `.assayer/cache/harness/<namespace>.json`, because a callback
cannot be serialized, and its absence from the cache is what keeps the
index itself deterministic. This index carries a THIRD hash the other two
indexes do not need: `layoutHash` and `tsconfigHash` both come from the
resolved index, but a harness is classified out of the analyzed surface
entirely, so neither of those two hashes changes when a harness file is
edited. `harnessHash`, computed over the harness files' own paths and
bytes, is what makes editing only a harness rebuild this index. It also
covers the analysis options of each harness's own owner, because the
harness value types are read under those options. A harness
whose target is not part of the analyzed surface, or whose module body
throws when loaded, is a P1 error and is left OUT of the index entirely. A
harness that loaded successfully is recorded even when its keys turn out
to be wrong, because this index's job is recording what was declared, and
the validation errors are what say the declaration itself is wrong.

**`harness-realize` pays an input gap at the moment Assayer runs the test,
the caller-debt counterpart to `stub-realize`.** A parameter the fill rule
refuses is reported as a GAP in the per-file analysis, because section
5.12's fill authority has no vocabulary for filling in a callback.
`harness-realize-broker` closes this at run or serve time: it finds the
colocated `<basename>.harness.ts` file using the same conjunction the
stitch uses (matching basename, plus the symbol gate), loads it through
the same `brokers/harness/load`, and re-derives each entry named in a
gap through the SAME `derive-cases`, with `harness: { entry, params }`
supplied. `cause-arrange` then emits a `{ kind: 'harness', param, key }`
binding exactly where it would otherwise have refused. A supplied entry's
resulting cases differ from a derived entry's cases in exactly that one
binding. A key naming a parameter the entry does not actually declare
reaches no derivation at all (the stitch already reports that as a P1 on
its own). A harness whose body throws when loaded leaves the analysis
untouched, since reporting that failure a second time here would just
repeat the stitch's own P1. A PARTIAL harness, one that supplies only some
of what is needed, keeps the gap open, re-reported using only the refusals
that REMAIN; reprinting the original full report would bill the reader
for input they just supplied. Paying off a gap this way REVIVES the
undriven admissions it had been suppressing (the precedence rule described
in section 4's entry on printing an admission), which is exactly what the
original report's closing line promised would happen. This overlay is
per-run only, never persisted, wired into the same three seams the other
overlays use (`run-unit-broker`, the `syntax-traits` harness,
`compiled-file-resolve-broker`), and it runs LAST, because every overlay
ahead of it can still turn a refusal into something Assayer builds on its
own.

**A refusal owned by a folded-in private function is not payable by the
flat re-derivation above, on its own.** A "folded private" is a same-file
private function that a named-call funnel or a through-caller route
absorbed into its caller (section 4 covers driving an inline function).
Its refusal is reported against the HOST entry (reading "on `build`", for
example; `FileAnalysis.declaringScopes` names it), and the flat
`deriveCasesTransformer` call over the reporting entry's own parameters
only proves that PRIVATE function's own axis. It never proves the
CALLER-side rebinding that `funnel-named-cases` or `through-caller-cases`
perform, which lands the private's binding onto the caller's own argument
slot. `harness-realize-broker` accepts an OPTIONAL `walked` argument, the
raw parse result its own callers may already be holding. When it is
supplied, `harness-realize-broker` re-runs `follow-calls-transformer`
itself, with the harness spec threaded per declaring-scope name. This is
never a second derivation path: it is the exact same transformer the
original compile walk used. The private function's binding then rides the
SAME generic rebase those transformers already perform on every steered
value (`{ ...binding, param: param.name }`), landing on the caller's own
argument slot with its key path UNCHANGED, never spliced onto the host's
own argument list at a positional slot the signature has no room for.
Without `walked` supplied, the entry is left untouched, exactly as before:
a folded-private or through-caller refusal stays open and gets
re-reported honestly, rather than risk producing the WRONG binding shape
that a flat re-derivation over the private's own parameters alone would
produce. `run-unit-broker` and `compiled-file-resolve-broker` do not
thread `walked` through yet, so this fix applies fully only where a caller
does supply it; `syntax-traits` is the one that does.

**The VALUES resolve at run time, from the same file and the same
registrar.** Because only KEYS are cached, the generated test file loads
the harness file itself: `case-set-projection` carries `harnessPath` (an
absolute path, exactly like `modulePath`) whenever some case names a
harness binding. The generated file LOADS that path through the same
ts-jest transform the subject under test goes through, and
`run-execute-cases-broker` maps `@assayer/core` to the root
`harness-registrar.js`, so the harness's registration lands where the
generated file can read it. This mapping is what makes the read
deterministic: resolving the `@assayer/core` package separately from the
harness file and from the generated file can otherwise land on two
different installs inside one workspace, and two separate module instances
mean a registration nobody actually collects, and every key reported as
missing even though it was supplied. `case-interpret-broker` then
walks the key path (`transformers/harness-value`) and applies the value
positionally. A key the declaration does not carry produces an `errored`
case NAMING that key, never a thrown exception, and never a silent
`undefined` passed as the argument instead, which would let the entry run
on a value nobody actually supplied and report whatever it happened to do
as a real verdict. The harness file itself is NOT instrumented: no probe
plan is written for it, so the probe transformer's content-hash lookup
misses on it and it passes straight through, which is already the correct
behavior for something that is not part of the analyzed surface.

**Resolution failure is a build error, not a dark spot, because the two
differ in WHO OWES the fix.** A dark spot is Assayer admitting it never
understood some piece of syntax: Assayer's own debt, and not something the
reader can act on. An import that cannot be resolved is understood
perfectly. It is simply broken or opaque, which makes it the REPO's debt
to fix. It surfaces at the exact call site (`relPath:line:column message`,
a P1 error) through `compile-run-broker`'s existing error list, exit code
1, the same class as a parse failure, with a reason of
`cannot-resolve-specifier`, `dynamic-or-computed-specifier`, or
`no-usable-types`. Never route one of these through the dark-spot channel.
Telling the reader to fix their own for-loop is a dark spot's problem to
have. Telling them to fix a broken import is something they can actually
act on, and it belongs here instead.
