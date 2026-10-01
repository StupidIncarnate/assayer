# PE-9: analyse each file with the compiler options of the tsconfig that owns it

## What this item does

Assayer analyses every file under TypeScript's default options today. The walk passes
`{ strictNullChecks: true }` and the harness type reader passes `{}`. Neither passes `lib` or `target`. So every file
gets TypeScript's default library set, `lib.d.ts`, which is ES5 plus DOM, whatever the consumer's tsconfig says.

After this item, each file is analysed with the options of the tsconfig that owns it. Assayer finds that tsconfig the
way tsserver does, and it asks TypeScript's own parser every question. A file that no tsconfig owns keeps
TypeScript's defaults, as it does now.

## Verdict: not brittle

The ownership walk is a lookup in TypeScript's own answer. Assayer writes no glob matching and no path rule of its
own. Measured below on five layouts, it picks the right owner every time.

- TypeScript's `getParsedCommandLineOfConfigFile` returns `fileNames` with `include`, `files` and `exclude` already
  applied, and with the `extends` chain already merged. It also returns `projectReferences`.
- `ts.resolveProjectReferencePath` turns one reference into its config file path. A reference may name a folder or a
  file such as `tsconfig.scripts.json`.
- `ts.findConfigFile` finds the nearest `tsconfig.json` at or above a folder.
- The only test Assayer adds is "is this absolute path in `fileNames`". That is an equality check on TypeScript's own
  list.

The walk itself is about 35 lines, in one broker, written as two small recursions with early returns. The
prototype is `tmp/pe9/measure.cjs`, functions `ownerInProject` and `owner`. A reader can follow it in one sitting.

The work around the walk is wider than the walk. Every caller of the walk must pass the options, and every test proxy
on those paths must stage the tsconfig lookup. The size estimate is in "Expected code size" below.

Phase 1 also found two problems that block a clean Phase 2. Neither one makes the walk brittle.

1. **Symbol-keyed property names are not deterministic. This must be fixed in this item.** Under any ES2015 or later
   library, an object type such as `Map` has members keyed by a well-known symbol. ts-morph's `symbol.getName()` returns
   TypeScript's internal name for such a member, for example `__@iterator@70`. The number at the end is a symbol id
   from a counter shared by the whole process. So the same source, walked twice in one process, gives two different
   names. Measured in `tmp/pe9/symbol-name.cjs`: the first walk reads `__@iterator@8`, and the same source walked a
   second time reads `__@iterator@39`. The walk copies that name into a `TypeFact`, so blob bytes would depend on what
   else the process walked first. That breaks the rule "Determinism holds everywhere". Today's ES5 library has no
   `Symbol`, so the hermetic walk never meets such a member. Once a file's own `lib` applies, almost every file does.
   The checker's own rendering, `checker.symbolToString(symbol)`, returns `[Symbol.iterator]` every time. That is the
   fix for the two hermetic readers.
2. **One external-signature reader already has the same problem today.** `read-signature-type-layer-broker.ts:218`
   reads object property names with `symbol.getName()`. It runs in the `node_modules`-aware project, which loads the
   consumer's real libraries. So an external signature that returns a `Map` caches a `__@iterator@<n>` name now. The
   operator put this fix in PE-9.

   A correction to the Phase 1 report: `external-signature-read-global-declaration-broker.ts:110` and
   `external-signature-read-declaration-broker.ts:85` also call `symbol.getName()`, but on a signature's PARAMETER
   symbols. A parameter's name is a plain identifier, or the positional `__0` for a destructured one. It never
   carries a symbol id. `read-global-type-layer-broker.ts` does not enumerate properties at all. So line 110 does not
   have the bug. Phase 2 still gives the global broker a test that reads the same declaration twice in one process
   and gets identical output, so the claim is checked rather than argued.

## What TypeScript's parser returns (measured)

Every layout is under `tmp/pe9/`. Run `node tmp/pe9/measure.cjs` to reproduce. TypeScript is ts-morph's bundled copy,
version 5.8.3.

### The layouts

- `mono/tsconfig.json` is a solution config: `files: []`, with references to `packages/app`, `packages/lib` and
  `packages/tools`.
- `mono/tsconfig.base.json` sets `strict`, `target: ES2020`, `types: ["node"]` and `baseUrl`.
- `packages/app/tsconfig.json` extends the base. It sets `lib: [ES2022, DOM]`, `jsx` and `outDir`, includes `src`,
  and excludes `src/**/*.test.ts`.
- `packages/app/src/legacy/tsconfig.json` is a nested config. Its `files` list names `old.ts` only, so it does not
  own its sibling `new.ts`.
- `packages/lib/tsconfig.json` is an extends chain: it extends `tsconfig.mid.json`, which extends the base. It sets
  `lib: [ES2020]` (no DOM), `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- `packages/tools/tsconfig.json` is a second solution config. Its one reference is `./tsconfig.scripts.json`, a file
  that is not named `tsconfig.json`. That file sets `target: ES2022`, `module: nodenext` and `strict: false`.
- `orphan/loose.ts` has no tsconfig in its own folder. The walk climbs to assayer's own root `tsconfig.json`, which
  does not include `tmp/`, and then above the repo, where it finds none.

### What each config parses to

| Config | `fileNames` | `projectReferences` | Options, as parsed |
|---|---|---|---|
| `mono/tsconfig.json` | none | app, lib, tools | none |
| `packages/app/tsconfig.json` | `main.ts`, `legacy/new.ts`, `legacy/old.ts`. `main.test.ts` is excluded. | none | `strict`, `target: 7` (ES2020), `types`, `baseUrl` (from the base), `lib: [lib.es2022.d.ts, lib.dom.d.ts]`, `jsx: 4`, `outDir` |
| `packages/app/src/legacy/tsconfig.json` | `old.ts` | none | `target: 1` (ES5) |
| `packages/lib/tsconfig.json` | `util.ts` | none | the base's options, plus `lib: [lib.es2020.d.ts]`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. The chain merges through both levels. |
| `packages/tools/tsconfig.json` | none | `tsconfig.scripts.json` | none |
| `packages/tools/tsconfig.scripts.json` | `scripts/gen.ts` | none | `target: 9` (ES2022), `module: 199` (nodenext), `strict: false` |

No config reported a parse error. TypeScript does not raise "no inputs found" for a solution config with `files: []`.

### Who owns each file

| File | Owner | Why | Cold lookup |
|---|---|---|---|
| `app/src/main.ts` | `packages/app/tsconfig.json` | nearest config, and its list holds the file | 6.8 ms |
| `app/src/main.test.ts` | none, so TypeScript's defaults | app's `exclude` drops it. The walk climbs to the solution config, whose references do not hold it either, then to assayer's root config, which does not include `tmp/`. | 112.5 ms |
| `app/src/legacy/old.ts` | `packages/app/src/legacy/tsconfig.json` | the nested config's `files` names it | 3.7 ms |
| `app/src/legacy/new.ts` | `packages/app/tsconfig.json` | the nested config does not list it, so the walk keeps climbing to app's config | 1.8 ms |
| `lib/src/util.ts` | `packages/lib/tsconfig.json` | owned, with the options of a two-level `extends` chain | 4.6 ms |
| `tools/scripts/gen.ts` | `packages/tools/tsconfig.scripts.json` | the nearest config is a solution config, so the walk follows its reference | 1.1 ms |
| `orphan/loose.ts` | none, so TypeScript's defaults | no config above the file includes it | 68.9 ms |

The two slow rows are files nobody owns. Their walk climbs into assayer's own root config, which lists hundreds of
files.

### The specimens

All 117 specimens in `tmp/p0-5b-hash/specimens.txt` are owned by `smoke-repo/packages/syntax-repository/tsconfig.json`.
Its list holds 237 files. Its analysis options are `target: 9` (ES2022, which brings `lib.es2022.full.d.ts`, DOM
included) and `strict: true`.

### What it costs

| Measure | Result |
|---|---|
| One specimen lookup, fresh each time | 6.6 ms on average, 777 ms for all 117 |
| All 117 specimens, sharing parsed configs in one run | 42 ms in total |
| One lookup in `packages/core`, whose config lists 784 files | 14.5 ms fresh, 40.7 ms cold |
| One walk, after the first | 13.2 ms on average over the 117 specimens |
| First walk in a process: parse plus check, today's options (ES5 + DOM) | about 830 ms |
| First walk, the specimens' owner options (ES2022 + DOM) | about 940 ms |
| First walk, ES2022 without DOM | about 405 ms |

A fresh lookup adds about half of one walk's cost, so Phase 2 starts with no cache across calls. The section "How
the options reach the walk" explains why.

### What the owner options change in the walk

Measured in the hermetic in-memory project:

| Source | Today | With the owner's options |
|---|---|---|
| `(xs: number[]) => xs.at(-1)` | `any`, because ES5 has no `at` | `number \| undefined` (app owner, ES2022) |
| `(xs: string[]) => xs[0]` | `string` | `string \| undefined` (lib owner, `noUncheckedIndexedAccess`) |
| `() => document.title` | `string`, because the default library has DOM | `any` (lib owner, ES2020 without DOM) |
| `() => process.env.MODE` with `types: ["node"]` passed straight through | `any` | `any`, with no global diagnostic. The in-memory file system has no `node_modules`, so `types` resolves nothing. The `process.env` proof in section 5.10 still holds. |

### Which specimen walks move

`tmp/pe9/walk-diff.ts` walks every specimen twice in one process: once as today, and once with the owner's analysis
options. Only the compiler options differ. One walk of the 117 moves:

- `sad-path/input-gap/map-param/map-param.ts`. Its parameter `counts: Map<string, number>` reads as `unknown` today,
  because `Map` is an ES2015 type and ES5 does not declare it. Under ES2022, `Map` reads as an object type with its
  members. Those members include the two symbol-keyed names from finding 1. So this specimen also shows the
  determinism bug. Its registry entry calls it an input gap. Phase 2 must check whether the fill seam still refuses
  a `Map`, by reading its members. If it no longer refuses one, the specimen's declaration is a question for the
  operator, never something to fit to the analyzer's output.

The `assayer unit` hashes may move for more specimens than the walk does, because run ids and case files carry more
than the walk. Phase 2 explains each one.

## The design

### Where the lookup lives

1. **Gateway: `#gateway/npm/typescript`.** Add one wrapper, `readTsconfig({ configFilePath })`. It calls
   `getParsedCommandLineOfConfigFile` over `ts.sys` and returns
   `{ configFilePath, fileNames, references, options }`, or `undefined` when the file cannot be read. `references`
   is each `projectReferences` entry passed through `resolveProjectReferencePath`. The wrapper reads the disk
   through `ts.sys`, so its proxy stages `getParsedCommandLineOfConfigFile` by exact config path, the same way
   `readNearestTsconfigProxy` stages `readJsonConfigFile`. `bundled-typescript.ts` lifts `resolveProjectReferencePath`
   too. The climb also needs "the nearest `tsconfig.json` above this folder". The existing `readNearestTsconfig`
   answers that already, and its proxy already stages `findConfigFile` by search path. So the broker uses it for each
   climb step and reads only its `configFilePath`.
2. **Core broker: `brokers/tsconfig/owner/tsconfig-owner-broker.ts`.** It takes `{ absPath }` and returns
   `{ configFilePath?: string; options: CompilerOptions }`. This broker holds the walk:
   - It climbs from the file's folder with `readNearestTsconfig`.
   - It asks whether that config owns the file: is `absPath` in its `fileNames`? If not, it follows each of its
     `references`, with a visited set so a reference cycle ends.
   - If nothing in that subtree owns the file, it climbs from the folder above that config.
   - If no config owns the file, it returns `{ options: {} }`.
3. **Core transformer: `transformers/analysis-options/analysis-options-transformer.ts`.** It takes the owner's full
   options and returns `{ compilerOptions, key }`.
   - `compilerOptions` keeps only the options that change a type the checker reports for a file on its own. The list
     lives in a new static, `statics/analysis-options/analysis-options-statics.ts`: `target`, `lib`, `strict`,
     `strictNullChecks`, `noImplicitAny`, `noImplicitThis`, `strictFunctionTypes`, `strictBindCallApply`,
     `strictBuiltinIteratorReturn`, `useUnknownInCatchVariables`, `exactOptionalPropertyTypes` and
     `noUncheckedIndexedAccess`.
   - `noImplicitAny` is on the list because it turns on control-flow typing for `let x;`.
   - Options that name a path (`baseUrl`, `outDir`, `paths`, `types`, `typeRoots`) are left out. In memory they
     resolve nothing. They would also put an absolute path into the cache key, which would make a key differ from
     machine to machine.
   - `key` is the sorted JSON of `compilerOptions`. The hermetic transformer already keys its projects that way, so
     both call sites share one transformer. The values are TypeScript's parsed forms, such as `lib.es2022.d.ts` and
     enum numbers. Those are fixed by ts-morph's TypeScript version, which the analyzer hash already covers.

### How the options reach the walk

- `walkFileTransformer` takes an optional `compilerOptions`, already passed through the analysis-options
  transformer. With none, it uses TypeScript's defaults. Operator answer 5 below covers the specimen catalogue,
  which calls `walkFileTransformer({ source, relPath })`.
- `harnessValueTypesTransformer` takes the same optional parameter, with its owner found from the harness file's own
  path.
- Each broker that walks a file from disk asks the owner broker first, then passes the options. The production walk
  callers are:
  - `compile-process-file-broker`. It needs the source root, so `compile-run-broker` threads `root` through
    `process-targets-layer-broker` and `stable-namespace-layer-broker`.
  - `run-unit-broker`.
  - `resolve-sibling-callee-broker`, for the sibling's own path.
  - `compile-harness-graph-broker`, for the harness reader.
  - desktop's `compiled-file-resolve-broker`.
  - `analyze-extract-broker` and the specimen catalogue: see operator answer 5 below.
- No cache across calls in Phase 2. A process-wide cache of parsed configs goes stale in a long-lived process. Desktop
  is one: a config edited, or a file added, after the cache filled would give a serve-time walk different options
  from the compile that wrote the blob. Their coverage IDs would then disagree. A fresh lookup costs about 7 to 15 ms
  per walk. If that cost matters, a cache scoped to one compile run, created inside `compileRunBroker` and passed down
  to `compileProcessFileBroker`, cuts it to under 1 ms per file. That is about 10 lines plus one parameter.

### The hermetic transformer

Its code does not change. It already keeps one project per sorted-JSON option set, and the option values TypeScript
returns serialize the same way every time. It takes its key from the new transformer instead of building the key
inline. Each distinct option set parses its own library files once per process, about 400 to 900 ms. A monorepo whose
packages differ in `lib`, `target` or a strict flag pays that once per distinct set.

### The per-file cache key

The blob cache is keyed by `contentHash`, a SHA-256 of the file's bytes, in `compile-process-file-broker.ts:43`. The
blob path is `blobs/<contentHash>.json`. That key is separate from the analyzer hash in the manifest. PE-1 made that
analyzer hash, and it moves only when Assayer's own code changes. So today a tsconfig edit that changes a file's
analysis would reuse the old blob.

`compile-process-file-broker` keeps `contentHash` exactly as it is: the SHA-256 of the file's bytes, which answers
"did the bytes change". It also computes a second hash, `analysisHash`, over the analysis options key and the bytes
together: `contentHashTransformer({ content: `${key}\n${content}` })`. The blob is stored at
`blobs/<analysisHash>.json`, so a tsconfig edit that changes a file's analysis options gives that file a new blob,
and no other file's blob moves. Each manifest file entry becomes `{ relPath, contentHash, analysisHash }`. Every
reader that opens a blob reads it by `analysisHash`: the resolve, stub and harness stitches, and desktop's blob
loader. The probe plan stays keyed on the bytes alone, because ts-jest hashes the same bytes.

Two other keys need the same ingredient:

- `compile-harness-graph-broker` builds `harnessHash` over each harness's path and bytes. It adds the harness's
  analysis key, because the harness types now depend on the harness owner's options.
- `run-id-broker` keys a run on `relPath`, the source and the harness bytes. A tsconfig edit changes the cases a run
  holds, so a saved run would otherwise keep answering for analysis that has moved. It adds the analysis key, under
  the same rule its harness ingredient follows: a file with no owner adds nothing, so its run id stays as today.

### `moduleFormatReadBroker`

It calls `tsconfigReadBroker({ searchPath: dirname(absPath) })` today, which reads the nearest config whether or not
that config owns the file. It switches to `tsconfigOwnerBroker({ absPath })` and keeps everything else. A test file
that its package config excludes then gets no tsconfig options. TypeScript makes no claim for it, and Node's
`package.json` rule decides its format. Node runs the file by that same rule, so this is the correct answer.

### Shared rules

- Ownership is equality against TypeScript's absolute, forward-slash `fileNames`. The path Assayer asks about is
  `${root}/${relPath}`, built from the same root the climb starts under, so both sides share one prefix. On a
  case-insensitive file system, a path spelled with a different case from the disk would find no owner. Every path
  Assayer asks about comes from a directory listing or from git, so its case matches the disk.
- A config with parse errors still owns what its `fileNames` lists. TypeScript reports the errors and Assayer does not
  read them. Reporting them is a separate question.

## Operator answers

The operator accepted the verdict, "not brittle", and answered the seven Phase 1 questions:

1. **`strictNullChecks` stays forced on**, on top of the owner's options. Core `CLAUDE.md` section 5.10 records why. A
   non-strict config would make the checker drop `undefined` and `null` from every type the walk reads, but the code
   still receives them at run time.
2. **The stable namespace reads the working tree's configs**, by path. The operator records this as a concession in
   `EPIC.md`. Reading a ref's own configs needs a parse host backed by git. That host's `readDirectory` must apply
   `include` and `exclude` itself, and TypeScript exposes its matcher, `matchFiles`, only as an internal. A file that
   exists at the ref but not in the working tree is in no `fileNames`, so it gets TypeScript's defaults. The blob
   key carries the options, so no blob is reused under the wrong ones.
3. **A new manifest field, `analysisHash`**, holds the hash of the analysis options key plus the bytes, and names the
   blob. `contentHash` keeps meaning "the file's bytes". The section "The per-file cache key" above describes this.
4. **The run id takes the analysis options key.** Hashes are compared by `relPath`.
5. **The catalogue must use the owning-config rule too**, unless that is truly impossible. See "Answer 5: what
   blocks it" below. Phase 2 does not build around it until the operator decides.
6. **The 408 layer-test `new Project` sites are rewritten by script**, as their own step, checked on their own.
7. **Module resolution moves to the importing file's owner**, in the seven brokers that read the root's nearest
   tsconfig today. See "Answer 7: module resolution per file" below.

The operator also put the symbol-name fix in `read-signature-type-layer-broker.ts:218` in scope, with a test that
reads the same source twice in one process and gets identical output. Finding 2 above corrects the line 110 claim.

## Answer 5: what blocks it

It is impossible without either a path rule of our own or an edit to the specimen test calls.

To find a file's owner, Assayer needs the file's absolute path. The catalogue never passes one:

- Each specimen test calls `walkFileTransformer({ source, relPath })` or `analyzeExtractBroker({ source, relPath })`.
  The source comes from `readFileSync(join(__dirname, '<rung>.ts'))`, and only the test knows `__dirname`.
- `relPath` uses two different bases across the 117 test files. Most spell it relative to the package
  (`'src/happy-path/array/at/at.ts'`). The cross-file specimens spell it relative to `smoke-repo`
  (`'packages/syntax-repository/src/happy-path/array/cross-file-map/band-reading.ts'`). Resolving `relPath` to a real
  file therefore means guessing which base applies. That is a path rule of our own.
- `walkFileTransformer` is a pure transformer. It may not read the disk, and that rule cannot be bent for it.
- The only absolute path available at run time is Jest's `expect.getState().testPath`. It names the TEST file, not
  the file being walked. To get from the test file to the walked file, Assayer would have to match `relPath` as a
  suffix of a path in the owner's `fileNames`. That is exactly the path matching the user ruled out. Using the test
  file's own owner instead rests on an assumption no code can check: that every walked file has the same owner as
  the test that walks it. It would also put a read of Jest's global state into an analyzer entry point.
- Rule 10 and concession 15 allow edits to the `paths` entries in the specimen tsconfig and to the walker's IMPORT
  NAME in the test files. Neither one adds an absolute path to a call.

Two ways forward, for the operator to choose:

- **(a), recommended.** Extend concession 15: a script changes each specimen test's walk or extract call to also pass
  the specimen's absolute path, `absPath: join(__dirname, '<rung>.ts')`, or the matching sibling path for the
  cross-file specimens. The catalogue then calls a core entry that takes `absPath`, looks up the owner, and walks. The
  coverage IDs still come from `relPath`, so the edit changes no expected value. It is mechanical, about 120 call
  sites in 117 files, and the script reports any call it cannot rewrite.
- **(b)** Map `@assayer/core/walk-file` and `@assayer/core/extract-analysis` through the specimen tsconfig `paths`
  to a core test-harness entry that takes the owner of `expect.getState().testPath`. This needs no test-file edit,
  but it rests on the unchecked assumption above. I advise against it.

Either way, core's own specimen harnesses already know each specimen's absolute path, so they take the owner rule
directly. Phase 2 checks each one, and changes only those that walk a specimen: `syntax-traits.ts`,
`bucket-verdict.ts`, `example-resolution.harness.ts` and `stub-graph.harness.ts`, all in `packages/core/test/harnesses/`.

## Answer 7: module resolution per file

Seven brokers read the nearest tsconfig at the ROOT for module resolution, or at the file's folder in
`moduleFormatReadBroker`. All seven switch to the owner of the file that imports:

| Broker | What changes |
|---|---|
| `compile/resolve-graph/compile-resolve-graph-broker.ts` and its `resolve-specifier-layer-broker.ts` | Each resolution unit uses the options of its importing blob's owner. Each barrel hop uses the options of the barrel file's own owner. That broker call keeps a `Map` from file path to owner, built once per call, and nothing else. The external `node_modules`-aware project is rooted at the importing file's owner config, so a package's own `types` and `typeRoots` apply. |
| `compose/cross-file-map/compose-cross-file-map-broker.ts` | the caller file's owner |
| `compose/cross-file-predicates/compose-cross-file-predicates-broker.ts` | the caller file's owner |
| `param-type/resolve/param-type-resolve-broker.ts` and `resolve-type-ref-layer-broker.ts` | the owner of each file the chain visits |
| `run/cross-file-probes/run-cross-file-probes-broker.ts` | the caller file's owner |
| `stub/realize/stub-realize-broker.ts` | the caller file's owner |
| `module-format/read/module-format-read-broker.ts` | the target file's owner, as designed above |

The resolved, stub and harness indexes are keyed on `layoutHash` plus `tsconfigHash`. `tsconfigHash` is the byte hash
of the ROOT config's text, which no longer describes what resolution read. It becomes a hash over the sorted list of
`(relPath, owner config path relative to the root, the owner's resolution options key)`, one entry per analysed file.
A path stored in that key is made relative to the root, so the key is the same on every machine. The resolution
options are the ones that change where a specifier lands: `module`, `moduleResolution`, `baseUrl`, `paths`, `rootDirs`,
`customConditions`, `moduleSuffixes`, `allowImportingTsExtensions`, `resolvePackageJsonExports`,
`resolvePackageJsonImports`, `typeRoots`, `types` and `allowJs`. The list lives in the analysis-options static.

An eighth site reads the nearest tsconfig for resolution: `packages/core/ts-resolver.js`, the nested Jest's resolver.
It runs in a plain-JS ceremony file, beside the files PE-8 is editing. I leave it unchanged and report it, unless the
operator adds it.

This answer roughly doubles Phase 2's size.

## Expected code size

| Part | Lines |
|---|---|
| The ownership walk (broker body) | about 35 |
| Gateway `readTsconfig` wrapper | about 30 |
| Analysis and resolution options: transformer and static | about 70 |
| Call-site changes in production files | about 200 across about 25 files |
| Tests and proxies | about 1,200 across about 60 files, most of it staging the lookup in proxies |
| Symbol-name fix in three readers | about 15, plus tests |
| Layer-test library script | 408 sites in 44 files, rewritten by script |
| Specimen test calls, if answer 5 is (a) | about 120 sites in 117 files, rewritten by script |

## Plan: the files Phase 2 touches

Phase 2 edits nothing until the operator says PE-8 has landed. Each step is checked before the next starts.

### Step 1: the layer-test library script (alone)

- New script `tmp/pe9/explicit-lib.cjs` (not source).
- The 44 test files under `packages/core/src/transformers/walk-file/` and `transformers/harness-value-types/`, plus
  `brokers/external-signature/*/` layer tests, that it rewrites. The script lists them, and the operator checks that
  list.

### Step 2: gateway

`packages/@gateway/npm/src/typescript/`:

- `read-tsconfig/read-tsconfig.ts`, `.proxy.ts`, `.test.ts`, `.integration.test.ts` (new)
- `bundled-typescript/bundled-typescript.ts` (lift `resolveProjectReferencePath`)
- `typescript.ts`, `typescript.test.ts`

### Step 3: core lookup, options and key

- new: `src/brokers/tsconfig/owner/tsconfig-owner-broker.ts`, `.proxy.ts`, `.test.ts`
- new: `src/transformers/analysis-options/analysis-options-transformer.ts`, `.test.ts` (both the analysis subset and
  the resolution subset, each with its key)
- new: `src/statics/analysis-options/analysis-options-statics.ts`, `.test.ts`
- `src/brokers/brokers.ts`, `src/transformers/transformers.ts` (exports)
- `src/transformers/hermetic-source-file/hermetic-source-file-transformer.ts`, `.test.ts`

### Step 4: symbol names (determinism)

- `src/transformers/walk-file/read-type-fact-layer-transformer.ts`, `.test.ts`
- `src/transformers/harness-value-types/read-harness-value-type-layer-transformer.ts`, `.test.ts`
- `src/brokers/external-signature/read-declaration/read-signature-type-layer-broker.ts`, `.test.ts`
- `src/brokers/external-signature/read-global-declaration/external-signature-read-global-declaration-broker.test.ts`
  (the same-source-twice test only)

### Step 5: the walk and its callers

- `src/transformers/walk-file/walk-file-transformer.ts`, `.test.ts`
- `src/transformers/harness-value-types/harness-value-types-transformer.ts`, `.test.ts`
- `src/brokers/analyze/extract/analyze-extract-broker.ts`, and a new core entry taking `absPath`, if answer 5 is (a)
- `src/brokers/compile/process-file/compile-process-file-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/compile/run/compile-run-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/compile/run/process-targets-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/compile/run/stable-namespace-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/run/unit/run-unit-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/run/id/run-id-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/resolve-sibling/callee/resolve-sibling-callee-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/module-format/read/module-format-read-broker.ts`, `.proxy.ts`, `.test.ts`
- desktop: `src/brokers/compiled-file/resolve/compiled-file-resolve-broker.ts`, `.proxy.ts`, `.test.ts`

### Step 6: the new `analysisHash` field

- shared: `src/contracts/assayer-cache-manifest/assayer-cache-manifest-contract.ts`, `.test.ts`,
  `assayer-cache-manifest.stub.ts`
- core: `src/brokers/compile/resolve-graph/compile-resolve-graph-broker.ts`, `.proxy.ts`, `.test.ts`,
  `.integration.test.ts`
- core: `src/brokers/compile/stub-graph/compile-stub-graph-broker.ts`, `.proxy.ts`, `.test.ts`,
  `.integration.test.ts`
- core: `src/brokers/compile/harness-graph/compile-harness-graph-broker.ts`, `.proxy.ts`, `.test.ts`,
  `.integration.test.ts` (blob read by `analysisHash`, and the harness's analysis key in `harnessHash`)
- desktop: `src/brokers/cache/load-blob/cache-load-blob-broker.ts`, `.proxy.ts`, `.test.ts`
- desktop: `src/contracts/current-namespace/current-namespace-contract.ts`, `.test.ts`, `current-namespace.stub.ts`
- desktop: `src/transformers/current-namespace/current-namespace-transformer.ts`, `.test.ts`
- any other reader of a manifest file entry that ward's typecheck names once the field exists. Phase 2 reports each
  one before editing it.

### Step 7: module resolution per file

- `src/brokers/compile/resolve-graph/resolve-specifier-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/compose/cross-file-map/compose-cross-file-map-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/param-type/resolve/param-type-resolve-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/param-type/resolve/resolve-type-ref-layer-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/run/cross-file-probes/run-cross-file-probes-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/stub/realize/stub-realize-broker.ts`, `.proxy.ts`, `.test.ts`
- `src/brokers/tsconfig/read/tsconfig-read-broker.ts`, `.proxy.ts`, `.test.ts`, which goes to `tmp/deletions/pe-9/`
  if nothing imports it any more

### Step 8: catalogue and harnesses (after the operator's answer 5 choice)

- `packages/core/test/harnesses/syntax-traits.ts`, `bucket-verdict.ts`, `example-resolution.harness.ts`,
  `stub-graph.harness.ts`, where each one walks a specimen
- if (a): the 117 specimen test files, by script, under the extended concession 15

### Step 9: docs

- `packages/core/CLAUDE.md` sections 5.10 (the owner rule, and why `strictNullChecks` stays forced), 8 (the module
  format entry names the owner, not the nearest config) and 9 (the stitch resolves per importing file)
- this file

## Hash plan for Phase 2

Run `bash tmp/p0-5b-hash/run.sh pe9 source`. Every specimen's run id moves (answer 4), so `before.sha256` and
`pe9.sha256` are compared by each run's `relPath`, read from its `run.json`. Every file whose `cases.json`, `run.json`
or `console.txt` moves is explained from its source and its library set: ES5 plus DOM before, ES2022 plus DOM and
`strict` after. `map-param` is the one move the walk already predicts.
