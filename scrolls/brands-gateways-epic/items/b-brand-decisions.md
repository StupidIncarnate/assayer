# B-2: brand decisions for assayer

This file is the decision file the Phase B scripts read through `--decisions=$H/items/b-brand-decisions.md`. Its
tables use the shapes in dungeonmaster's `bigbang/PORTING.md` section 3. Every table is one row per line, with fixed
columns and no `|` inside a cell, so the scripts read them with a line split. Paths are relative to `packages/`.

Each row is decided from what the value means in Assayer, not from its name. The brand text of every field is derived
by the scripts from the owner and the key. This file names no brand text. It names only an owner contract, where the
scripts need one.

## Inputs

- Brand census of B-1: `tmp/brand-census/standalone-brands.csv`, `brand-sharing.csv`, `per-package.csv`,
  `enum-stubs.csv`. Its summary is in `tmp/phase-b/b1-brand-census.txt`.
- A keyed-use scan run for this file: every `-contract.ts` that imports a standalone brand contract, and the key each
  reference sits under. The `top keys` column of 2.6 comes from it.
- The three `z.unknown()` sites, read in full.

## Where the code differs from the census and the EPIC

1. **`FilePath` (core) is used as a field.** The census of 2026-09-30 counted it as never a field. Since then
   `coreRuntimeContract` holds it under eight keys (`setupFile`, `registrar` and so on). It is a value brand (2.6).
2. **`TreeNodeName` (desktop) is never a field.** The CSV marks it class `F`, because
   `shared/src/contracts/compiled-tree/compiled-tree-contract.ts` names a `treeNodeNameContract`. That is a local,
   unexported const of its own. Shared cannot import desktop. No contract imports desktop's `treeNodeNameContract`.
   It goes plain (2.8). SD-4 must take the W1 list from table 2.8, not from the CSV's `class` column.
3. **`StubKey` is an identity, not a value.** Its own PURPOSE calls it "the stable, committable identity of one stub".
   `objectStub.key` and `envStub.key` own it. `stubOverlay.key`, `propertyGuard.key` and `stubOverlayObjectFile.type`
   point at it, and the overlay reconcile matches an overlay's key against the index's key. Split into per-field
   value brands, those keys could no longer be compared. It is an ownerless id (2.4), so 2.4 has three rows, not two.
4. **Counts.** Owned ids: 0. Ownerless ids: 3. Value brands: 25, not about 26. Plain brands: 22. `z.unknown()`
   fields: 3. That is 53 rows, against about 55 expected. The value-brand count falls by one from item 3 (StubKey),
   gains one from item 1 (FilePath), and loses one from item 2 (TreeNodeName). The two id rows the EPIC expected
   (`CoverageId`, `RunId`) are both here.

## Item 2: standalone brand classes

Class rule used for every row. A brand is an **owned id** when some contract declares it as its own `id`. It is an
**ownerless id** when it names one thing's identity, no contract has it as `id`, and other contracts match values
against it. Everything else is a **value brand**: each field gets its own derived inline brand. A brand that no
contract holds as a field is **never a field**, and W1 makes it plain.

#### 2.2 Owned ids (W3)

No standalone brand in assayer is a contract's own `id`. W3 has no rows.

| pkg | brand | standalone file | owner path | owner const | key | b3 text | text changes | uses | other owners of this id | inline copies | same-name group | fanOut | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

#### 2.3 Inline brands that share an id brand's text (re-derive in the same pass, SD3/SD4)

None. No contract file writes `.brand<'CoverageId'>()`, `.brand<'RunId'>()` or `.brand<'StubKey'>()` inline.

| brand text | inline site (path:line) |
|---|---|

#### 2.4 Ownerless ids (W4)

| pkg | brand | standalone file | decision | owner (path, status) | owner key | uses | inline copies | same-name group | fanOut | why |
|---|---|---|---|---|---|---|---|---|---|---|
| shared | CoverageId | shared/src/contracts/coverage-id/coverage-id-contract.ts | owner-id | shared/src/contracts/coverage/coverage-contract.ts (create; coverageContract, `id` only, keeping `z.string().min(1)`) | id | 10 | 0 | - | 43 | A coverage ID is the one address that matches a derived case back to the branch, exit or condition leaf it covers. Three kinds of object mint it (`branchNode.coverageId`, `exitNode.coverageId`, `conditionLeaf.id`), and five point at it (`probeSite.id` and `elseId`, `traceEvent.id`, `guardStep.branchCoverageId`, `caseSet.exitIds`, `derivedTestCase.reachesPath`, `caseResult.observedPath`). Every one must stay one brand, or a trace event could not be compared with the exit it observed. No existing contract owns all three kinds, so a new shared owner holds the id. The owner name `coverage` keeps the derived text `CoverageId` and reads as the CLAUDE.md term. OPEN for the operator: `coverage-point` reads better as an object but derives `CoveragePointId`. |
| shared | RunId | shared/src/contracts/run-id/run-id-contract.ts | owner-field | shared/src/contracts/run-result/run-result-contract.ts | runId | 1 | 0 | - | 3 | A run id names one saved run, in `assayer detail <id>` and as the folder `.assayer/cache/runs/<id>`. `runResult` is that saved run, and it stores the id under `runId`. Renaming the key to `id` would change the saved artifact both the CLI and the UI read, so the key stays and the field takes the derived text RunResultRunId. The 8 core parameters named `runId` (b13) do not end with the words run, result, run, id, so R8 will not retype them: they become `RunResult['runId']` by hand. |
| shared | StubKey | shared/src/contracts/stub-key/stub-key-contract.ts | owner-field | shared/src/contracts/stub-entry/stub-entry-contract.ts (create; stubEntryContract, `key` only, keeping `z.string().min(1)`) | key | 6 | 0 | - | 5 | A stub key is the committed identity of one stub in the stub repository (`<definitionRelPath>#<TypeName>` or `process.env#<PROPERTY>`). Object stubs and env stubs both own it, and overlays, property guards and the object overlay file point at it, and the overlay reconcile compares them. So one brand, on a new shared owner, since an env stub is not an object stub. The owner is `stub-entry`, not `stub`, so its stub file is not named `stub.stub.ts`. The key keeps its name `key`, because it is persisted in committed overlay files and is the domain term. Derived text StubEntryKey. `stubOverlayObjectFile.type` holds the same id under another key and reuses `stubEntryContract.shape.key`. |

Decision words: `owner-id` means the owner declares `id` and every field reuses `owner.shape.id`. `owner-field` means
the identity lives in a key that is not `id`, the key stays, and every field reuses `owner.shape.<key>`. `plain` means
W1's treatment. The script refuses a `plain` row, and refuses an owner note containing the words for a rename; neither
occurs here. Both created owners hold only the one key; W4 lists that in its leftovers notes, and nothing more is added.

#### 2.5 `questFolder`

Not applicable to assayer. This heading stays because it ends table 2.4 for the script.

#### 2.6 Value brands (W5)

`native owner` is `-` throughout. No value brand here belongs to one object; each field takes its own derived brand,
and a field that holds another owner's field (B4) is found later by R8. `inline copies` counts inline
`.brand<'<same text>'>()` sites outside the standalone file (`brand-sharing.csv`). No standalone brand name occurs in
two packages, so `same-name group` is `-` throughout.

| pkg | brand | standalone file | kind | native owner (path#key) | uses | owner contracts | top keys | inline copies | same-name group | fanOut | note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| app | ResolvedEdgeLine | app/src/contracts/resolved-edge-line/resolved-edge-line-contract.ts | string | - | 4 | 1 | symbol, source, inputs, output | 0 | - | 1 | a display line of the resolved-contract panel; the four fields are four different lines |
| core | FilePath | core/src/contracts/file-path/file-path-contract.ts | string | - | 8 | 1 | setupFile, astTransformer, registrar, interpretCaseModule, resolveEntryModule, probeRuntimeModule, probeInjectModule, harnessModule | 0 | - | 128 | an absolute path to one run-time module; class F since `coreRuntimeContract`, not P as the 2026-09-30 census said |
| desktop | RepoPath | desktop/src/contracts/repo-path/repo-path-contract.ts | string | - | 1 | 1 | repoPath | 1 | - | 50 | the repo folder the window reads; app `statusView.repoPath` writes the same text inline and re-derives with W6 |
| shared | BranchName | shared/src/contracts/branch-name/branch-name-contract.ts | string | - | 3 | 3 | branch | 0 | - | 35 | a git branch name; a value, git owns it |
| shared | ColumnNumber | shared/src/contracts/column-number/column-number-contract.ts | number | - | 8 | 8 | column | 3 | - | 14 | a 1-based source column; core `analysisExtractResult`, `mapExtractResult` and `sourcePosition` write the text inline |
| shared | ConstLength | shared/src/contracts/const-length/const-length-contract.ts | number | - | 1 | 1 | operandConstLength | 0 | - | 7 | the fixed length of a welded array constant |
| shared | ContentHash | shared/src/contracts/content-hash/content-hash-contract.ts | string | - | 11 | 7 | contentHash, layoutHash, tsconfigHash, harnessHash | 0 | - | 40 | carries the one real check, `.regex(/^[0-9a-f]{64}$/u)`; W5 must copy it onto every field (`lib/base-schema.cjs`), and refuses while a `contentHashContract.parse(x)` site remains (2 production parses); the four keys hash different inputs, so separate brands are right |
| shared | DocsTopic | shared/src/contracts/docs-topic/docs-topic-contract.ts | string | - | 1 | 1 | topic | 0 | - | 5 | - |
| shared | EntryLabel | shared/src/contracts/entry-label/entry-label-contract.ts | string | - | 2 | 2 | label | 0 | - | 33 | display only by its own rule; never keyed or matched, so per-field brands lose nothing |
| shared | EnvValue | shared/src/contracts/env-value/env-value-contract.ts | string | - | 1 | 1 | value | 0 | - | 2 | - |
| shared | EnvVarName | shared/src/contracts/env-var-name/env-var-name-contract.ts | string | - | 6 | 6 | property, name, operandEnvVarName | 0 | - | 8 | an environment variable name; a value, the process environment owns it |
| shared | FileCount | shared/src/contracts/file-count/file-count-contract.ts | number | - | 7 | 3 | current, max, stableMax, currentMax, fileCount, tsCount, tsxCount | 0 | - | 5 | - |
| shared | FolderName | shared/src/contracts/folder-name/folder-name-contract.ts | string | - | 2 | 2 | rootFolderName | 0 | - | 2 | - |
| shared | HarnessKeyPath | shared/src/contracts/harness-key-path/harness-key-path-contract.ts | string | - | 1 | 1 | key | 0 | - | 4 | a dotted route `inputs.<entry>.<param>`, read and written only through `statics/harness-module`; one field |
| shared | LineNumber | shared/src/contracts/line-number/line-number-contract.ts | number | - | 37 | 29 | line, startLine, endLine, reachedFns, n | 0 | - | 77 | the largest numeric W5 brand; trial candidate |
| shared | ModuleSpecifier | shared/src/contracts/module-specifier/module-specifier-contract.ts | string | - | 5 | 5 | specifier | 0 | - | 11 | the literal value of an import specifier |
| shared | NamespaceName | shared/src/contracts/namespace-name/namespace-name-contract.ts | string | - | 4 | 3 | namespace, branchName | 0 | - | 18 | names a cache namespace; `compiledTree.summary.branchName` holds one too |
| shared | PackageName | shared/src/contracts/package-name/package-name-contract.ts | string | - | 2 | 1 | packageName | 0 | - | 6 | an npm package name; npm owns it |
| shared | RelPath | shared/src/contracts/rel-path/rel-path-contract.ts | string | - | 19 | 16 | relPath, reader, path, readers, targetRelPath, definitionRelPath, from, overlayPath | 0 | - | 198 | a repo-relative path; a value, the file system owns it; the biggest string W5 brand by fan-out; trial candidate |
| shared | RepoName | shared/src/contracts/repo-name/repo-name-contract.ts | string | - | 2 | 2 | repoName | 0 | - | 1 | - |
| shared | SymbolName | shared/src/contracts/symbol-name/symbol-name-contract.ts | string | - | 74 | 38 | name, importedName, paramName, scopePath, property, typeName, typeRef, member, and 20 more | 1 | - | 342 | an identifier as the source spells it; the largest W5 brand, run alone as a trial; `mapNode.name` writes the text inline; `arrangeValueContract` references it with no key, and `stubOverlayObjectFile.properties` uses it as a `z.record` key, which stays plain (trap 5) |
| shared | SyntaxKindName | shared/src/contracts/syntax-kind-name/syntax-kind-name-contract.ts | string | - | 2 | 2 | kind | 0 | - | 2 | - |
| shared | TemplateText | shared/src/contracts/template-text/template-text-contract.ts | string | - | 2 | 2 | texts | 0 | - | 12 | - |
| shared | TraceValueText | shared/src/contracts/trace-value-text/trace-value-text-contract.ts | string | - | 1 | 1 | valueText | 0 | - | 9 | display only (P4); one field |
| shared | TypeText | shared/src/contracts/type-text/type-text-contract.ts | string | - | 7 | 4 | text, typeText, declaredText | 0 | - | 79 | display only, the checker's rendering of a type; 45 production parses, so a W5 trial candidate |

#### 2.7 Same-name groups (SD4: retype as one group; inline brands with the same text re-derive in the same pass)

No standalone brand name occurs in two packages. The rows below are the brand texts that a standalone brand shares
with inline sites in other contract files (`brand-sharing.csv`). W5 or W1 removes the standalone; the inline sites
re-derive their own text under W6's R2 autofix.

| brand | rows | packages | classes | fanOut sum | inline copies |
|---|---|---|---|---|---|
| AssayerVersion | 1 | cli | never | 2 | 3 |
| ColumnNumber | 1 | shared | value | 14 | 3 |
| RepoPath | 1 | desktop | value | 50 | 1 |
| SymbolName | 1 | shared | value | 342 | 1 |
| TreeNodeName | 1 | desktop | never | 3 | 1 |

#### 2.8 Never-a-field standalone brands (W1: plain)

No row carries a real check (a regex, a refine, a uuid, a named constant). The checks lost are `.min(1)`, `.int()`,
`.min(0)` and `.nonnegative()`, which the plain `string` or `number` type already covers in practice. Every row is
`plain`, and none is NOT PLAIN YET.

| pkg | brand | standalone file | W1 verdict | prod parses | test parses | stub calls | fanOut | why |
|---|---|---|---|---|---|---|---|---|
| app | DarkSpotLine | app/src/contracts/dark-spot-line/dark-spot-line-contract.ts | plain | 1 | 3 | 1 | 3 | a rendered report line |
| app | ExitCode | app/src/contracts/exit-code/exit-code-contract.ts | plain | 0 | 4 | 1 | 1 | dead (C-1 moves it out); if C-1 lands first, drop this line from the W1 list |
| app | UndrivenLine | app/src/contracts/undriven-line/undriven-line-contract.ts | plain | 1 | 3 | 1 | 3 | a rendered report line |
| cli | AdmissionLine | cli/src/contracts/admission-line/admission-line-contract.ts | plain | 4 | 3 | 1 | 9 | a rendered report line; the P1 text it carries is built elsewhere and keeps its words |
| cli | AssayerVersion | cli/src/contracts/assayer-version/assayer-version-contract.ts | plain | 0 | 3 | 1 | 2 | the three inline `AssayerVersion` fields in app, desktop and shared re-derive their own text (2.7) |
| cli | CliErrorMessage | cli/src/contracts/cli-error-message/cli-error-message-contract.ts | plain | 3 | 3 | 1 | 7 | a message string; P1 text stays word for word |
| cli | CliFileText | cli/src/contracts/cli-file-text/cli-file-text-contract.ts | plain | 0 | 3 | 16 | 16 | used only by cli test harnesses (C-1 kept it) |
| cli | CliOutput | cli/src/contracts/cli-output/cli-output-contract.ts | plain | 8 | 3 | 1 | 21 | captured CLI text |
| cli | CliPositional | cli/src/contracts/cli-positional/cli-positional-contract.ts | plain | 2 | 4 | 1 | 3 | a CLI argument; only `.min(1)` is lost, and an empty positional already fails the command's own lookup |
| cli | ProgressBarLine | cli/src/contracts/progress-bar-line/progress-bar-line-contract.ts | plain | 1 | 3 | 1 | 3 | a rendered line |
| core | AstProjection | core/src/contracts/ast-projection/ast-projection-contract.ts | plain | 2 | 4 | 1 | 6 | a structural projection string feeding coverage IDs; the type is `string` either way, and its content is built from AST kinds, not checked by the brand |
| core | CaseSignature | core/src/contracts/case-signature/case-signature-contract.ts | plain | 2 | 4 | 1 | 5 | - |
| core | FileContents | core/src/contracts/file-contents/file-contents-contract.ts | plain | 24 | 4 | 19 | 56 | raw file text, no check at all; the largest W1 row |
| core | NormalizedSource | core/src/contracts/normalized-source/normalized-source-contract.ts | plain | 1 | 3 | 2 | 4 | - |
| core | PredictedOutput | core/src/contracts/predicted-output/predicted-output-contract.ts | plain | 1 | 5 | 1 | 5 | - |
| core | ShimSource | core/src/contracts/shim-source/shim-source-contract.ts | plain | 1 | 3 | 1 | 3 | generated test-file text |
| core | StringLength | core/src/contracts/string-length/string-length-contract.ts | plain | 1 | 5 | 1 | 3 | loses `.int().nonnegative()`; the value is a `.length` read, never outside input |
| core | TestPathPattern | core/src/contracts/test-path-pattern/test-path-pattern-contract.ts | plain | 1 | 3 | 1 | 3 | built by core, never typed by a person |
| desktop | ExecutablePath | desktop/src/contracts/executable-path/executable-path-contract.ts | plain | 2 | 3 | 1 | 4 | - |
| desktop | TreeNodeName | desktop/src/contracts/tree-node-name/tree-node-name-contract.ts | plain | 2 | 4 | 1 | 3 | the CSV says class F, wrongly: shared `compiledTree` declares its own local const of the same name, and no contract imports desktop's |
| shared | ArrangeText | shared/src/contracts/arrange-text/arrange-text-contract.ts | plain | 1 | 4 | 1 | 3 | display text |
| shared | RunConsole | shared/src/contracts/run-console/run-console-contract.ts | plain | 4 | 4 | 28 | 38 | console text of a run; no check |

### Item 3: the `z.unknown()` sites in contracts

| # | path:line | field | decision | target | target path | status | why |
|---|---|---|---|---|---|---|---|
| 1 | core/src/contracts/harness-declaration/harness-declaration-contract.ts:27 | inputs | exception | z.object({}).catchall(z.object({}).catchall(z.unknown())) | core/src/contracts/harness-declaration/harness-declaration-contract.ts | exists | each leaf is what a harness author supplies because Assayer cannot build it: a callback, an instance, a thing with identity (CLAUDE.md, harness section); `z.json()` rejects every function, so the values could never pass; the same kind of exception as dungeonmaster's staged-call `args` |
| 2 | desktop/src/contracts/ipc-reply/ipc-reply-contract.ts:23 | valueRaw | json | z.json().optional() | - | n/a | the payload of an IPC reply is contract data (status, compiled tree, file view, run result, console text, stub view), and each renderer-side broker parses it into its own contract; `.optional()` because a saved run that never ran answers `undefined`, which the contract tests prove; check after W8 that no channel payload holds a nested `undefined` value, which `z.json()` rejects and would turn into a failure reply |
| 3 | shared/src/contracts/map-node/map-node-contract.ts:19 | meta | json | z.json() | - | n/a | plugin metadata on a map node, persisted in the JSON cache; the value of the `z.record` becomes `z.json()`, the record key stays plain `z.string()`; no producer writes `meta` today |

Reading the columns: `decision` is `own` (our data's contract), `json` (`z.json()`), `gateway` (a `#Gateway<Type>`
schema), `exception` (the field stays `z.unknown()`) or `responder`. Row 2's line is 23 in the current tree; the census
said 24. The script finds rows by file and field, so the line is informational.

Row 1 leaves a `z.unknown()` that `require-object-contract-brands` reports and cannot autofix. Assayer allows no
per-site suppression, so Phase R needs a repo-wide answer: a rule option in dungeonmaster that accepts a value which
is a caller-supplied callback by design, or a concession. The operator decides it before R-2.
