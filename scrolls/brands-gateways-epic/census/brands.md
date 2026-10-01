# assayer brand census (read-only), 2026-09-30, commit 7c1bac6

Flags used everywhere: `--root=/home/brutus-home/projects/assayer --scope=@assayer/ --out-dir=<scratchpad>/census`.
All outputs: `<scratchpad>/census/` (brand-census/*.csv + summary.json, phase34/*/out, diag.json, graph.json,
eslint/<pkg>.json, ward-typecheck.txt, rules-dump.json). `git status --short` of assayer: empty before, empty after (cmp identical).
Every script honoured `--out-dir`. `--census` of b12 prints only (no file). No script errored. No script was patched.
Side effects outside the repo-tracked tree: `npm run ward -- --only typecheck` and eslint wrote only inside gitignored `.ward/`.

## 1. brand-census (1,487 files, 154 contract files)
- 50 standalone brand contracts: class F (used as an object field) 28, class P (never a field) 22.
  Per package F/P: shared 25/2, app 1/3, desktop 2/1, cli 0/7, core 0/9.
- Per package contract files / object contracts (all unbranded, 0 branded) / enums / standalone / unknown:
  app 10/4/2/4/0; cli 10/2/1/7/0; core 41/29/1/9/1; desktop 6/3/0/3/1; shared 87/49/6/27/1; hydration-recipes 0.
- Brand texts: 115 total, 14 shared by more than one site (AssayerVersion 5 sites across app|cli|desktop|shared,
  ColumnNumber 4, StatusMessage 3, RunMode 3, ExtractErrorMessage 3, LengthBound 3, ExitCode 2, RepoPath 2, OrderedBound 2,
  SourceOffset 2, DomainBound 2, TreeNodeName 2, ArrayCardinality 2, SymbolName 2).
- Enum brands: 10 (all have a stub; 32 stub calls; 23 are UndrivenCause).
- `z.unknown()`: 3 sites, `z.any()`: 0. core `harness-declaration-contract.ts:27` (`inputs`, catchall of catchall unknown),
  desktop `ipc-reply-contract.ts:24` (`valueRaw`), shared `map-node-contract.ts:19` (`meta`, record of unknown, branded PluginMetaBag).
- Standalone brand fan-out totals: 221 field uses, 470 type refs, 253 prod parses, 624 stub calls. Top fan-out: SymbolName 329 (shared F),
  RelPath 216, FilePath 116 (core P), TypeText 79, LineNumber 70, RepoPath 65, CoverageId 43, FileContents 42 (core P), RunConsole 42.
- Only one standalone brand has a real check: ContentHash (`.regex(/^[0-9a-f]{64}$/u)`, class F). No P brand carries a check
  (so no "NOT PLAIN YET" rows for W1).
- Ids: CoverageId (10 field uses, 9 owner contracts; keys `id` in probe-site, trace-event, condition-leaf; `coverageId` in branch-node,
  exit-node; `branchCoverageId`, `elseId`) and RunId (1 field: run-result.runId). No contract owns an id as its own standalone brand
  by the W3 rule, so W3 has no clear rows.
- b13 (R8 param retype hits): 9 (runId 8 in core, testId 1 in app). b14 hits 74 (see 5).

## 2. b11 contract merge
0 contract names declared in more than one package (duplicates.json = `[]`). I re-checked by regexp: no `xxxContract` const name repeats.
Brand-census says 2 "duplicateNames" (brand-text level); there are no same-name standalone rows (every `dupNameRows` = 1).

## 3. b02 contract index
154 indexed: parsed 144, dead 2, value-used 1, test-only 2, type-only 5; 9 contract files export a type that is not z.infer/input/output.
- dead: app `exit-code-contract.ts`; shared `resolution-failure-reason-contract.ts` (in a package barrel).
- test-only: cli `cli-file-text-contract.ts`, cli `cli-run-result-contract.ts`.
- type-only: core file-index-entry (barrel), probe-runtime, type-fact, walk-facts; shared anonymous-reach (barrel).
- delete-candidates.txt written to scratchpad (review needed; ExitCode and CliFileText are standalone brands, so W1 and 3.1 overlap).

## 4. b12 census
78 unbranded object contracts: shared 45, core 25, app 4, cli 2, desktop 2. (brand-census counts 87 object contracts; the b12 number is the top-level exported ones that need a brand.)

## 5. b14 census
58 ad-hoc shapes: data 56 (core 50, app 3, cli 2, desktop 1), mixed 1 (app), methodSet 1 (cli). By folder: transformers 22, brokers 21,
adapters 8+1, bindings 4, responders 2. By site: return 51, alias 6. Test-side method sets: 15 (core 8, app 5, cli 2), not contracts.

## 6. promise-parse-scan
`0 parse calls on a Promise`.

## 7. Typecheck (diag --full --jobs=3, unfenced like ward) and graph
**217 distinct errors in 169 files**, 18 s. Ward typecheck (`npm run ward -- --only typecheck`) agrees: per package app 9, core 86, desktop 50,
cli 23, shared 52, @gateway/browser 17, @gateway/bin 1, @gateway/npm 9, @gateway/node 25, hydration-recipes 0 (ward counts a shared
file once per dependent package, so its sum, 272, is higher than diag's de-duplicated 217).
diag by owning package: core 73, shared 52, desktop 37, "(outside packages)" 13 (files in the codex checkout), @gateway/node 12,
cli 10, app 9, @gateway/npm 8, @gateway/browser 3, hydration-recipes 0, @gateway/bin 0 (diag shows bin's one under outside).
By code (diag): TS2307 151, TS7006 30, TS7031 18, TS2305 16, TS5098 1, TS2724 1.
Causes:
- TS2307 on `@dungeonmaster/shared/@types` (cli 2, core 29, desktop 2, shared 52; stubs import `StubArgument`) and on
  `@dungeonmaster/shared/contracts|adapters` (core 39, desktop 12, cli 3). tsc says: "There are types at .../@types.d.ts, but this result could not be
  resolved under your current 'moduleResolution' setting. Consider updating to 'node16', 'nodenext', or 'bundler'". assayer's
  `tsconfig.base.json` has `moduleResolution: node`, which ignores the `exports` map of the linked codex packages. The source of those imports is unchanged
  by 7c1bac6 (git diff 22fc4e3..7c1bac6 touches only package.json in the five packages); the codex checkout's `shared/dist` was rebuilt today at 13:31
  with exports-only subpaths. So the earlier "0 errors" trial is stale. This is assayer's tsconfig or the codex dist, not brand work.
- app TS2305/2724: `ErrorMessage` / `errorMessageContract` no longer exported by the linked `@dungeonmaster/shared/contracts` (codex renamed it).
- TS2307 `#gateway/...` (13, outside packages): the linked codex `testing` package source imports `#gateway/npm/zod`, `#gateway/node/path`, etc., and
  assayer's resolution cannot map them. TS7006/TS7031 follow from that unresolved type (proxies' `call` params, @gateway/browser canvas proxy).
- @gateway/npm TS2305: `react` has no `Activity`, `cache`, `use`, `useActionState`, ... (react 18 types vs the wrapper written for 19). TS5098: gateway
  `tsconfig.build.json` sets `customConditions` while moduleResolution is `node` (@gateway/node and /npm).
Graph: 2,292 files, 955 groups, 11 cycles (88 files in cycles; biggest is core, 8 units/21 files, level 13, the analyze/compose/harness/stub broker ring),
max level 17 (core), levels 0..17 hist 335/315/157/71/23/13/7/7/3/6/2/3/2/1/2/3/4/1. Max level per package: core 17, app 9, shared 7, cli 6, desktop 6,
hydration-recipes 3, gateways 1 to 4. 0 unresolved in-repo specifiers. Packages order leaf-first: gateways, shared, core, cli/desktop/app.

## 8. Linked plugin and lint
Plugin: `/home/brutus-home/projects/assayer/node_modules/@dungeonmaster/eslint-plugin` -> codex checkout; `dist` rebuilt 2026-09-30 13:31; 90 rules registered.
Flat dist layout is `dist/brokers/rule/<name>` (no `dist/src`).
Epic R1..R9 against the plugin:
| EPIC | rule | in dist | assayer config severity | autofix |
|---|---|---|---|---|
| R1 | require-contract-parse | yes | off (both blocks) | no |
| R2 | require-object-contract-brands | yes | error | yes (meta.fixable code) |
| R3 | ban-type-aliases | yes | off | no |
| R3 | ban-adhoc-types | yes | error | no |
| R4 | ban-join-id-beside-child | yes | error | no |
| R5 | enforce-stub-usage | yes | error (off in `*.e2e.ts` blocks) | no |
| R7 | require-object-contract-brands-indexed | yes | error | yes |
| R8 | enforce-owner-field-reuse | yes | error | yes |
| R9 | enforce-unique-contract-names | yes | error | no |
| - | ban-id-rebrand | yes | NOT configured (not in assayer's rule set, not in plugin's own config either) | no |
| - | require-real-owner | does NOT exist in the plugin (neither dist nor codex src) | n/a | n/a |
| - | ban-primitives, require-zod-on-primitives | in dist but not configured (R2 replaced them) | n/a | no |
Other related, all error: require-contract-validation (off in integration/e2e blocks), enforce-contract-usage-in-tests, ban-flattened-contract-params,
require-validation-on-untyped-property-access, ban-unknown-payload-in-discriminated-union, forbid-type-reexport, ban-test-support-in-production,
ban-proxy-empty-called-with, ban-proxy-catch-all-defaults, ban-invented-failures, enforce-stub-patterns, enforce-proxy-patterns, platform-globals-ban,
raw-import-ban, bin-program-spawn-ban, gateway-dependency-declared, enforce-gateway-schema-fields, enforce-gateway-restricted-to,
enforce-gateway-config-names-exist, ban-gateway-export, enforce-test-colocation, enforce-implementation-colocation.
Config shape: `eslint.config.js` spreads `dungeonmaster.configs.dungeonmaster.typescript` (399 rules; 81 at error, 2 off among plugin rules) and
`...dungeonmasterTest.test` (455 rules, same two off), plus `fileOverrides`, plus one local rule `@assayer/no-nullish-coalescing-on-arrange-value`
(error). It does NOT spread `configs.dungeonmaster.gateway` (the block for `packages/@gateway/*/src/**`, which carries gateway-layout,
gateway-colocation, gateway-import-boundary, gateway-return-unknown-not-caller-type, gateway-schema-brand, all error). So the gateway rules
never run in assayer. The root config also cannot parse gateway files (project `./tsconfig.json` does not include them): 823 "parserOptions.project" fatals.
Autofix rules at error that a `lint --fix` touches: require-object-contract-brands, require-object-contract-brands-indexed, enforce-owner-field-reuse
(plus enforce-file-metadata). That explains "lint --fix re-applies the brand changes": the three brand rules are fixable and at error in the shared config.

Report-only eslint (no --fix; `eslint --no-warn-ignored -f json -o`, 16G heap, repo config, one package at a time), seconds each:
| package | files with msgs | errors |
|---|---|---|
| cli | 65 of 119 | 385 |
| desktop | 83 of 125 | 553 |
| app | 141 of 209 | 451 |
| shared | 88 of 269 | 351 |
| core | 542 of 753 | 1,864 |
| hydration-recipes | 0 of 13 | 0 |
| gateways (npm, node, browser) | all fail to parse (823) | n/a |
Brand rules, hits per package (autofixable in parentheses):
- require-object-contract-brands: app 17 (13), cli 17 (10), core 99 (88), desktop 14 (10), shared 177 (141); total 324 (262 fixable).
  Kinds: add `.brand<Owner>()` to an object 178 (all fixable; shared 101, core 64, app 6, desktop 4, cli 3); "brand sits only on an object contract or one of its fields,
  move or drop" 53 (not fixable: shared 30, core 9, cli 7, app 4, desktop 3; these are the standalone brands, the W1/W3/W5 queue);
  enum, literal or boolean field branded, remove 28 (fixable); leaf "brand text must be <Owner><Key>" about 58 (fixable; this is the shared-text group);
  `z.unknown()` 3 (not fixable); self-holding contract uses z.lazy instead of annotated getter 6 (not fixable; shared 5, core 1).
- require-object-contract-brands-indexed: 0. enforce-owner-field-reuse: 2 (core, `predicateKind` in is-falsy-arm-guard.ts, fixable).
  ban-join-id-beside-child 0, enforce-unique-contract-names 0, ban-adhoc-types 0, enforce-stub-usage 0, require-contract-validation 0.
Non-brand baseline in the same run (lint is red today): raw-import-ban 1,194 (app 207, cli 104, core 688, desktop 108, shared 87), no-unsafe-* 1,212,
enforce-proxy-child-creation 238, enforce-project-structure 220 (`Unknown folder "adapters/"`), platform-globals-ban 130, ban-test-support-in-production 122,
ban-proxy-empty-called-with 108, ban-anonymous-jsx-in-map 22, ban-invented-failures 20, enforce-import-dependencies 2, bin-program-spawn-ban 1.
raw-import-ban breakdown (the gateway pivot demand): `@assayer/shared/contracts` 633 (asks for `#gateway/npm/assayer__shared__contracts`), `zod` 155,
`ts-morph` 121, `node:path` 30, `react` 27, `@assayer/core/{brokers,contracts,testing,adapters,transformers}` 66, `node:fs` 20, `node:os` 16, `fs/promises` 16,
`node:fs/promises` 12, `@mantine/core` 12, test libs 25, other 70. 39 distinct specifiers.

## zod-spec decision
`packages/@gateway/npm/src/zod/zod.ts` exists (`export * from 'zod'; export { default } from 'zod';`, with test) and the gateway npm package's `./*` export resolves
`#gateway/npm/zod` to it. But the default `#gateway/npm/zod` cannot resolve yet:
- `package.json` `imports` map (`#gateway/npm/*` -> `@assayer-monorepo/npm/*`, plus node, browser, bin) exists only in the four gateway packages and `hydration-recipes`
  (which imports no gateway today). app, cli, core, desktop, shared have none.
- gateway packages are named `@assayer-monorepo/{npm,node,browser,bin}`; `node_modules/@assayer-monorepo` does not exist (workspaces `packages/@gateway/*` declared,
  no install since init). Also `node_modules/@assayer/cli` is absent because the cli package is named `assayer`.
- 5 packages use `moduleResolution: node` (app uses bundler), which does not read `imports`; jest `moduleNameMapper` has no `#gateway` entry.
- All 155 zod imports are the bare `from 'zod'` (shared 87, core 41, cli 11, app 10, desktop 6); lint already demands the gateway (raw-import-ban).
Recommendation: run every brand step with `--zod-spec=zod` until the imports map, install, moduleResolution and jest mapper are in place; then one
mechanical rewrite of the 155 imports to `#gateway/npm/zod`. If the operator wires the gateway first, the default is correct and needs no flag.
Also `--eslint-prefix` default `@dungeonmaster/` is right (plugin key `@dungeonmaster`). `--browser-pkgs` should be `app` (the web-like package; its tsconfig is bundler, DOM lib).
The scripts find the CLI by folder name (`cli`).

## 9. Decision tables assayer must draft (b15 sections 2.2 to 2.8 and item 3), sized from this census
Planner agent drafts these; a person reviews. Row counts are estimates from the census.
| table | what a row is | rows for assayer |
|---|---|---|
| 2.2 owned ids (W3) | brand that is an owner's own `id` | about 0 to 1. No standalone brand is declared as a contract's own `id` today. CoverageId is used as `id` in probe-site, trace-event, condition-leaf (reuse of one id) with no obvious owner object |
| 2.3 inline brands sharing an id brand's text | inline `.brand<'Text'>()` site | 0. No id text (CoverageId, RunId) appears inline elsewhere |
| 2.4 ownerless ids (W4) | id brand with owner-id / owner-field / plain | 2: CoverageId (open: owner-id on a new `coverage`/branch-node owner vs plain; 10 field uses in 9 contracts across shared and core) and RunId (owner-field `runResult.runId`, one field, key stays; text RunResultRunId) |
| 2.5 questFolder-type special cases | one-off field-of-owner analysis | 0 |
| 2.6 value brands (W5) | class F, non-id | 26 rows (shared 24 including ContentHash which keeps its regex, desktop 2, app 1; app ResolvedEdgeLine). Largest: SymbolName 74 field uses, LineNumber 37, RelPath 19, ContentHash 11, CoverageId excluded |
| 2.7 same-name groups | brand name in more than one package | 0 same-name standalone groups. The analogous work is 14 shared-text groups (AssayerVersion x4 packages, ColumnNumber, StatusMessage, RunMode, ExitCode, RepoPath, TreeNodeName, ...), 9 of which touch a standalone file, 5 inline-only in core. Lint says about 58 leaf sites need `<Owner><Key>` text |
| 2.8 never-a-field (W1 plain) | class P | 22 rows, all `plain` (no check to lose): cli 7, core 9, app 3, desktop 1, shared 2. Possibly 0 NOT PLAIN YET. Overlaps: app ExitCode is dead (b02); cli CliFileText is test-only |
| item 3 z.unknown() | site | 3 rows: core `harness-declaration.inputs` (own or json, a record of records), desktop `ipc-reply.valueRaw` (json or responder), shared `map-node.meta` (json; currently branded PluginMetaBag). No gateway rows expected |
| w2 duplicate contract renames | rename | 0 |
| 3.1 dead contract list | path | 2 dead, plus 2 test-only and 5 type-only to review: 2 to 9 |
| W7 shapes (b14) | shape | 58 (core 50) |
| W6 object brands | unbranded object contract | 78 (R2 autofix, per package: shared 45, core 25, app 4, cli 2, desktop 2); lint sees 178 object sites incl. nested |
Total hand-reviewed decision rows: about 55 (2 + 26 + 22 + 3 + about 2 dead), against 700+ in dungeonmaster. Expect W1 (22) and W5 (26) to be the bulk; a planner agent
for assayer is short work. Run lists: w1-runs 22 lines, w5-runs 26 lines, w3 about 0, w4 2, w2 none.

## Notes for the operator
- Typecheck is red before any brand step (217 diag errors). Fix or baseline it first (moduleResolution to node16/bundler for shared, core, cli, desktop; codex
  `errorMessageContract` rename in app; react types in @gateway/npm). Brand scripts gate on typecheck diagnostics, so a red baseline drops more sites to leftovers.
- Lint is red before brand steps (baseline 3,604 errors in the five source packages, mostly raw-import-ban and no-unsafe-*). `ward` lint runs `--fix`, which will apply 262 brand autofixes
  (R2) and 2 R8 fixes the moment it runs; that is the "re-applies brand changes" behaviour.
- The gateway lint block is not wired into eslint.config.js; gateway rules never run.
- require-real-owner does not exist anywhere; ban-id-rebrand exists in the plugin but is configured nowhere.
