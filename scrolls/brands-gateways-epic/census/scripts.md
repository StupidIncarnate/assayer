# Script inventory for converting assayer (read-only research, 2026-09-30)

Shorthand used below:

- `E` = `/home/brutus-home/projects/codex-of-consentient-craft/scrolls/brands-gateways-epic`
- `A` = `/home/brutus-home/projects/assayer`
- `P34` = `E/phase34-scripts`, `BB` = `E/bigbang`
- `WT` = `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot`

Every number about assayer was measured in this session. Nothing in assayer or the codex repo was edited. The only runs were `npx adapter-census` (stdout only) and `bigbang/tools/diag.cjs` (output to the scratchpad `diag-base.json`); `git status` in assayer stayed clean.

---------------------------------------------------------------------------------------------------

## 1. Where assayer stands today (measured)

| Fact | Value | Consequence |
|---|---|---|
| Packages | `app`, `cli` (npm name `assayer`, unscoped), `core`, `desktop`, `hydration-recipes` (`@assayer-monorepo/hydration-recipes`), `shared`; `packages/@gateway/{npm,node,browser,bin}` exist and are named `@assayer-monorepo/<kind>` | Use `--scope=@assayer/`. Package folders without that scope are keyed by folder name by every script (`cli`, `hydration-recipes`, gateways). `--browser-pkgs=app` is the browser package. |
| zod | 4.6.5 in every package | The zod 4 codemod at `/tmp/claude-1001/.../35147971-.../scratchpad/zod4-codemod.mjs` is spent (105 files, already committed as 22fc4e3). Do not rerun. |
| `#gateway/*` imports in code | 0 | Gateway import rewrite is the first big mechanical job. |
| `imports` map in `package.json` | only in `hydration-recipes`; missing in app, cli, core, desktop, shared | `dungeonmaster init` (re-run) adds it to every existing package. |
| Root `tsconfig.base.json` | `module commonjs`, `moduleResolution node` | `#gateway/*` and `exports`-only packages do not resolve. Init sets node16 + `source` condition on the root tsconfig. |
| Baseline typecheck today (`diag.cjs --full`, unfenced) | **217 distinct errors in 169 files**; 151 are TS2307 (`@dungeonmaster/shared/@types` 85, `@dungeonmaster/shared/contracts` 53, `#gateway/*` 12); 16 TS2305 | Mostly the resolution problem above. Behind it sit real dangling names (next row). |
| Names assayer imports from dungeonmaster that master no longer exports | `AdapterResult` (25 imports), `errorMessageContract`/`ErrorMessage` (35), `absoluteFilePathContract`/`AbsoluteFilePath` (2), `processCwdAdapter` from `@dungeonmaster/shared/adapters` (1) | Dangling-import class of error, owned by dungeonmaster not assayer. See gap G9. In `app` (bundler resolution) they already show as TS2305. |
| Adapters | `adapter-census`: 63 adapters (16 pass-through, 47 logic), 145 production callers, 43 composing proxies, 26 stage a catch-all. Core also has 46 `*-layer-adapter.ts` files the census does not list. | Adapter work is the largest agent pile. |
| Contracts / stubs / proxies | 154 contract files, 154 stub files, 208 proxy files; 50 standalone brands (28 used as a field, 22 never); 78 unbranded object contracts; 58 ad-hoc shapes | Brand census numbers from `E/bigbang/PORTING.md` section 9, still current. |
| Stub/proxy imports through a barrel | 219 imports of `*Stub` from `@assayer/shared/contracts`, 15 from `@assayer/core/testing` | B03 per-file import rewrite applies. |
| Other | `AdapterResult` mentions 55, `JSON.parse` 38, `as never` 59, `registerMock` 149, `z.unknown/any` 3, `jest.mock` 2 | |
| `@dungeonmaster/eslint-plugin` linked into assayer | 90 rules; has `require-object-contract-brands`, `-indexed`, `enforce-owner-field-reuse`, `raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban`, `require-contract-parse`, `ban-*` proxy rules | PORTING section 0's "plugin has no brand rules" is out of date. |
| `.gitignore` | `/tmp`, `worktrees/` ignored | Default `--out-dir=<root>/tmp` is safe. |

Stale items in `E/bigbang/PORTING.md` section 0: zod 4 is done, gateways exist, the plugin has the brand rules. Still true: no decision tables, no run lists, `cli` unscoped.

---------------------------------------------------------------------------------------------------

## 2. Where each script lives and whether it still exists

| Script named in EPIC.md "Scripts used" | Exists? | Where |
|---|---|---|
| `tmp/a18-codemod/run.cjs` (raw imports and globals to `#gateway/*`) | yes, **only in the old worktree** | `WT/tmp/a18-codemod/run.cjs` (1,050 lines, gitignored; not in main `tmp/`, not committed). Needs `WT/tmp/a18-census.config.js` beside it. Logs of all 14 package runs sit next to it. |
| `tmp/a18-zod/rewrite.py` | yes, worktree only | `WT/tmp/a18-zod/rewrite.py` (24 lines) |
| `tmp/t05-scan-pkgs.js`, `tmp/t05-ward.config.js`, `tmp/t04-scan.config.js` | yes, worktree only | `WT/tmp/` (superseded by `ward scan`, see 3.8) |
| `tmp/adapters-fresh/{scan,swap,globals,spawns}.cjs, adapters.py, claims.py` (the census prototype that became `adapter-census`) | yes | both `codex/tmp/adapters-fresh/` and `WT/tmp/adapters-fresh/` |
| `tmp/restructure/caller_rewrite.py` (rewrote `#gateway/<pkg>/<old>` to flat names after the gateway restructure) | worktree only | `WT/tmp/restructure/` (dungeonmaster-specific, needs `plan.json`; not useful for assayer) |
| `tmp/phase34`, `tmp/phase34-feasibility`, `tmp/bigbang` | worktree only (patched working copies and run logs) | `WT/tmp/`. The committed copies under `E/` are canonical and carry the patches. |
| Assayer port trial outputs (brand census CSVs, diag JSONs) | worktree only | `WT/tmp/bigbang/port-trial/` |
| `adapter-census` | published | `@dungeonmaster/tooling`, bin already on assayer's PATH: `node_modules/.bin/adapter-census` |
| `dungeonmaster gateway-sync` | published | `packages/cli` (`CliGatewaySyncResponder`); assayer's root `postinstall` already calls it |
| `ward scan <rule>` | published | `packages/ward` (`npm run ward -- scan <rule> [-- paths]`); not in the epic's script table but exists on master |

Risk: the a18/t05/t04 scripts are gitignored. If `WT` is removed they are lost. Copy `a18-codemod/run.cjs`, `a18-census.config.js`, `a18-zod/rewrite.py` somewhere durable before that.

Only `gateway-pivot` holds these under `worktrees/*/tmp/` (all other worktrees were checked).

---------------------------------------------------------------------------------------------------

## 3. Inventory

Status column: **AS-IS** = runs on assayer with only `--root`/`--scope`-type flags. **FLAGS** = portable once the named flags/inputs are given. **PORT** = needs an edit or hand-built input first. **DM-ONLY** = hard-wired to dungeonmaster's shape.

### 3.0 Shared settings, read by every script via `P34/lib/port-config.cjs`

Flag, else `MIGRATE_*` env, else default. A flag is removed from `argv` and copied to the env so child processes see it.

| Flag | Env | Default | For assayer |
|---|---|---|---|
| `--root=DIR` | `MIGRATE_ROOT` | cwd | `/home/brutus-home/projects/assayer` |
| `--out-dir=DIR` | `MIGRATE_OUT` | `<root>/tmp` | default is fine |
| `--scope=@x/` | `MIGRATE_SCOPE` | `@dungeonmaster/` | `@assayer/` |
| `--gateway-dir=REL` | `MIGRATE_GATEWAY_DIR` | `packages/@gateway` | default |
| `--gateway-spec=#x/` | `MIGRATE_GATEWAY_SPEC` | `#gateway/` | default |
| `--zod-spec=SPEC` | `MIGRATE_ZOD_SPEC` | `#gateway/npm/zod` | default (gateways exist) |
| `--browser-pkgs=a,b` | `MIGRATE_BROWSER_PKGS` | `web` | `app` |
| `--eslint-prefix=@x/` | `MIGRATE_ESLINT_PREFIX` | `@dungeonmaster/` | default (assayer registers the plugin as `@dungeonmaster`) |
| `--decisions=FILE` | `MIGRATE_DECISIONS` | `E/items/b15-brand-migration.md` | a new file in assayer, see G3 |
| `--fence-extra`, `--link-fence=0\|1` | | link-fence on | keep on: assayer links `@dungeonmaster/*` by `file:`; with `--link-fence=0` the trial read 237 errors |

`P34/lib/repo.cjs` (shared engine: TypeScript resolution fenced to the root, overlay host, export-graph walker, per-package LanguageService, `gateEdits` per-file typecheck gate, Myers diff), `lib/base-schema.cjs`, `lib/rewrite-guards.cjs`, `lib/verify-sample.cjs` are libraries, not commands. `verify-sample.cjs <sampleDir> [--check=a.ts] [--no-exports-overlay]` proves a `--sample-out` copy without touching `packages/`.

Conventions: nearly every script is dry-run by default and writes only with the bare word `apply` (b18 and `a18-codemod` differ, see below). `--sample-out=DIR` is joined onto the root, so it must be root-relative. Removed files are moved to `<out>/deletions/<chunk>/<repo path>`, never deleted.

### 3.1 Read-only census scripts

| Script | What it does | Inputs / flags | Writes | Status | Phase |
|---|---|---|---|---|---|
| `adapter-census` (published bin) | Per package: every adapter, shape (pass-through / logic and why), matching gateway export (exact/related), prod/test callers, composing proxies, catch-all staging. `--format=table\|json`, `--package=`, `--cwd=`. | none | stdout only | **AS-IS** (already ran on assayer). Quirks: reports scope `@assayer-monorepo` (root name) not `@assayer/`; skips `*-layer-adapter.ts` (46 in core). | adapter deletion planning |
| `P34/brand-census/census.cjs` | AST census for the brand work: standalone brands (class F = used as an object field, P = never), brand-text sharing, enum stubs, per-package counts, B13 retype hits, B14 ad-hoc shapes. | `--root --out-dir --scope` | `<out>/brand-census/*.csv` | **FLAGS**. Hard-codes `'shared'` as the owner tiebreak (census.cjs:494); assayer has a `shared` package so fine. | brands (decision input) |
| `P34/b02-contract-index/index.cjs [pkg ...]` | Index of every `*-contract.ts`: parse sites, nesting, uses, barrel reach; classes parsed / value-used / type-only / test-only / dead. | | `<out>/phase34/b02-contract-index/out/` incl. `delete-candidates.txt` | **AS-IS** | contract index |
| `P34/b11-contract-merge/census.cjs` | Contract names declared in two or more packages, shapes, which definer each user reaches. | | `.../b11-contract-merge/out/duplicates.json` | **AS-IS** | renames / merges |
| `P34/b12-object-brand-fallout/run.cjs --census` | Count of unbranded object contracts. | | stdout | **AS-IS** (78 on assayer) | W6 |
| `P34/b14-shape-contracts/run.cjs --census` | Count of ad-hoc object shapes. | | stdout | **AS-IS** (58 on assayer) | W7 |
| `BB/promise-parse-scan.cjs [--root]` | Finds `x.parse(promise)` (missing await) using the checker. Must print `0 parse calls on a Promise`. | | stdout | **AS-IS** (0 on assayer) | brands, fixer rounds |
| `P34/feasibility/b14/census.cjs`, `b17/census.cjs`, `b04/census-stubs.cjs`, `feasibility/census-b04.cjs` | Prototype censuses behind B14/B17/B04. | | | **DM-ONLY** or superseded (b04 is the Tsestree retype; not needed) | |
| `P34/libcopy-census/*` (scan.js, retype.js, structural.js, stubcalls.js, users.py, build-stub-map.py, reqkeys.js, tsestree-classify.js, show.py, `stub-map.json`) | Census of dungeonmaster's own copies of library types (TypeScript, ESLint nodes) and a stub map. | | | **DM-ONLY** (`stub-map.json`, `build-stub-map.py` name this repo's packages; `reqkeys.js` writes a probe into `<root>/tmp`) | not used |
| `WT/tmp/a18-census.config.js` + `a18-operator/a18-siegelense-census.{mjs,config.js}` | ESLint configs that switch on `raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban` and list hits. `a18-siegelense-census.mjs` is hard-wired to `packages/siegelense`. | | JSON | **PORT**, and superseded by `ward scan` (3.8) except that `a18-codemod/run.cjs` itself reads `tmp/a18-census.config.js` | gateway import rewrite |

### 3.2 Gateway import rewrite and adapter work

| Script | What it does | Inputs / flags | Writes | Status | Phase |
|---|---|---|---|---|---|
| `WT/tmp/a18-codemod/run.cjs <pkg> [--apply] [--files a,b] [--reuse-census] [--no-verify] [--env-writes] [--crypto-webcrypto]` | Per package: censuses raw imports and platform globals with ESLint, builds a gateway index (every barrel's exports resolved through the checker), swaps a raw import or same-named global to the same symbol from `#gateway/<kind>/<name>` only when the barrel hands back the identical symbol, rewrites read-only `process.X`, skips anything a test or proxy mocks raw, and re-typechecks and re-lints each changed file before and after (a file that gets a new problem is left untouched and reported REJECTED). | cwd = repo root (hard `process.cwd()`); needs `packages/@gateway`; reads `tmp/a18-census.config.js`; writes reports to `tmp/a18-codemod/` | with `--apply`, `packages/` | **PORT** (small). Hard-coded: `ROOT=process.cwd()`, `tmp/a18-codemod`, `tmp/a18-census.config.js`; the census config requires `../packages/eslint-plugin/src/index.ts` (dungeonmaster's own source), must become `require('@dungeonmaster/eslint-plugin').default`; rule ids `@dungeonmaster/...`; gateway kinds `node/browser/npm`. Verify step uses the package tsconfig, so run it after init's node16 change. | gateway import rewrite (assayer raw imports: fs/promises 75, fs 68, node:path 36, path 29, child_process 26, ts-morph 122, typescript 15, react 33, @mantine 15, zod 169) |
| `WT/tmp/a18-zod/rewrite.py <pkg> [apply]` | Regex rewrite `from 'zod'` to `from '#gateway/npm/zod'` in files whose only raw import is zod. | cwd = repo root, `packages/<pkg>` | with `apply` | **PORT** (one-line: the `@dungeonmaster/` prefix test in `raw()`). Probably unnecessary: the codemod covers zod. Use only for files it skips. | gateway import rewrite |
| `dungeonmaster gateway-sync` (published; also run by init and postinstall) | For every `dependencies` entry of every package, creates `packages/@gateway/npm/src/<pkg>/` (copies dungeonmaster's own wrapper when it has one, else a passthrough barrel + test), adds the dep to the npm gateway, runs one `npm install --ignore-scripts`. | none | `packages/@gateway/npm`, lockfile | **AS-IS**. Covers `dependencies` only. Assayer's `devDependencies` imports (`@playwright/test`, `playwright`, `electron`, `@testing-library/*`, `vite`, `@vitejs/plugin-react`) and every `@gateway/bin` program (git, node, electron spawns) are not generated. | wrappers |
| `dungeonmaster init` (re-run) | Idempotent. Adds the four-entry `#gateway/*` `imports` map to every existing package, sets root tsconfig to node16 + `source`, adds `gateway-dist` to each `tsconfig.build.json`, links gateways into `workspaces`, root `postinstall`, runs gateway-sync. (Source: `packages/cli/src/responders/install/setup-gateway/install-setup-gateway-responder.ts`.) | | repo config | **AS-IS** | prerequisite |
| `WT/tmp/adapters-fresh/{scan,swap}.cjs` | One-TypeScript-program scan of every outside call per adapter, swap-cost query. Prototype of `adapter-census`. | | JSON | **DM-ONLY** (hard-codes `unreached.json`, skips the `testing` package); superseded | |
| `E/merge-master/adapter-map.json`, `resolve.cjs` | `adapter-map.json`: 51 hand-built entries mapping each deleted dungeonmaster adapter to its gateway replacement, call shape and proxy staging map. `resolve.cjs`: resolves a `git merge master` by script (conflict hunks, DU/UD, adapter imports via the map, dangling fix, brand autofix, suggestions, leftovers). | | | **DM-ONLY** (51 dungeonmaster adapter paths; `@dungeonmaster` hard-wired, `packages/server`). Useful only as a model of the map format. Assayer has no divergent master. | not used |
| `E/merge-master/plain-brand-residue.cjs --root=<W> [--apply] [--diag=f] [--deletions=dir] [--allow-drop-validation]` | After a merge, rewrites each use of a standalone brand the branch deleted: `XStub({value:v})` to `v`, `xContract.parse(a)` to `a`, `type X` to `string`/owner field. Table built from the deleted contract files in `--deletions`. | | `<out>/merge-master/plain-brand-{table,rewrites,leftovers}.json` | **PORT** (`'shared'`, `packages/shared`, `@dungeonmaster` literals). Closest existing tool for assayer's dangling dungeonmaster names (G9). | dangling names |
| `E/z10-scripts/usage-census.py`, `usage-sweep.py [--apply]`, `usage-verify.py` | Comment sweep: rewrites comment lines that name a `*Contract`/`*Stub` nothing exports any more (scalar brands deleted into `tmp/deletions`); `usage-verify.py` proves only comment lines changed and the line count is unchanged. | run from repo root; reads `packages/`, `tmp/deletions` | with `--apply` | **AS-IS** (after brands run). Fits assayer's "no stale comments" rule. | docs / comment sweep |

### 3.3 B03: package exports, barrels, per-file stub/proxy imports

| Script | What it does | Flags | Status | Hard-coded / notes |
|---|---|---|---|---|
| `P34/b03-exports-barrels/run.cjs [pkg ...] [--verify=f,..] [--sample-out=d] [apply]` | Each package's `exports` becomes `./*.proxy`, `./*.stub` plus one explicit `./<folderType>` key per barrel; root barrels (`contracts.ts`, `adapters.ts`, `brokers.ts`, `transformers.ts`) move to `src/<ft>/<ft>.ts` with relative specifiers recomputed and relative importers rewritten. Keeps `.`, `./testing`, any key it does not own. Lists non-TS mentions of moved barrels (package.json `files`, tsconfig, jest). | package names are short names (`shared`, `core`) | **FLAGS** | Dist paths come from `tsconfig.build.json`, falls back to `./dist/src`. Assayer packages have no `tsconfig.build.json` but `rootDir ./ outDir ./dist`, so the fallback matches. Special-cases a package named `testing` (none in assayer). Assayer has root-level non-barrel files in core (`harness-registrar.js`, `probe-runtime.js`, `probe-transformer.js`, `index.ts`, `testing.ts`) that the script will list or keep; read the dry run. |
| `P34/b03-per-file-imports/rewrite.cjs [--importers=] [--targets=] [--files=] [--sample-out=] [apply]` | Every import of a name whose declaring file is a `.stub.ts`/`.proxy.ts` that arrives through any barrel moves to the declaring file's per-file specifier. Resolves the new specifier back to the file under the planned `exports` before writing. Writes `out/last-run.diff`, `out/leftovers.json`. | `--importers`/`--targets` are package short names | **AS-IS** | Doc comments name `@dungeonmaster/...` but the code uses `--scope`. 219 + 15 assayer imports are its input. Leftovers: stub imports in production files (a rule C6 violation to redesign by hand). |
| `P34/b03-strip-barrels/run.cjs [pkg ...] [apply]` | Drops every stub/proxy re-export from production barrels; deletes a package-root `testing.ts` and its `./testing` key only when nothing still imports it. | | **AS-IS** | Run after the per-file rewrite, per package. |
| `P34/b03-stub-type-alias/run.cjs [--importers=] [apply]` | A production file that imports a stub only for `type X = ReturnType<typeof XStub>` loses the alias and gains `import type { X }` from the contract. | | **AS-IS** | Leftovers where a stub is called to build data. |

B03 run order per package group (never two agents on one package's barrels): `b03-exports-barrels` then `b03-per-file-imports` then `b03-strip-barrels` then (optional) `b03-stub-type-alias`; gate lint, typecheck, unit, integration on every dependent package.

### 3.4 Contract index, deletion, merges, renames

| Script | What it does | Status |
|---|---|---|
| `P34/b02-contract-index/delete.cjs <reviewed-list.txt> [--verify] [apply]` | Deletes contract, `<base>.stub.ts`, `<base>-contract.test.ts` and every barrel line for listed paths still `dead` in a fresh index; refuses anything else. Needs a reviewed list (a person or agent builds it from `delete-candidates.txt`). | **AS-IS** |
| `P34/b11-contract-merge/move.cjs --from=<losing> --to=<keeper> [--sample-out] [apply]` | Points every importer of the losing copy at the keeper, drops barrel lines, deletes the losing trio. Refuses if the schemas differ or the keeper lacks a name. | **AS-IS**. Doc names `@dungeonmaster/<pkg>/contracts` as the specifier shape; code builds from scope. Every merge decision is an agent/human call. |
| `P34/b15-rename/rename.cjs --file=<decl> --from=Old --to=New` or `--batch=<json>` `[apply]` | TypeScript language-service rename across the declaring package and dependents. Batch file: `[{ "file", "from", "to" }]`. Refuses when the new name already appears in a touched file. | **AS-IS**. Does not rename brand text strings, folders or files (leftovers list). |

### 3.5 Brands: waves W1 to W10 (all via `BB/run-all.sh`)

| Wave | Script | What it does | Inputs | Status |
|---|---|---|---|---|
| W1 | `P34/feasibility/b15/codemod.cjs --brand=<const> --file=<contract> [--no-check] apply` | Standalone scalar brand goes plain: type refs to `string`/`number`, `C.parse(v)` to `v`, `TStub({value:x})` to `x`, field `key: C` gets an inline brand; contract, stub, test moved to `<out>/deletions/W1/`. Refuses (exit 3) a brand with a real check that still has parse sites unless `--allow-drop-validation`. | `w1-runs.txt` lines `<const> <contract file>` (class P rows of `standalone-brands.csv`) | **FLAGS** (list is assayer's; no list generator, G3) |
| SD12 | `P34/b13-test-fallout/run.cjs [--pkgs=a,b] [--leftovers=f] apply` (+ `feasibility/b13/{retype,validate,index}.cjs`, `retype-overlay.cjs`) | Applies R8's parameter retype on an overlay and repairs call sites that now pass plain strings to branded parameters; reverts a file whose diagnostics rise. Harness params are skipped. | none | **AS-IS**. RUNBOOK says run from a dir where `feasibility/b13` is reachable; the committed run-all.sh calls it in place. |
| W3, W4 | `P34/b15-id-brands/run.cjs --brand=<Brand> [--pkg=] [--no-group] [--rounds=N] [--stats-only] [apply]` | Id brand becomes its owner's field; references reuse `Owner.shape.key` / `Owner['key']`; creates new owner contract/stub/test; then SD4 root-parse rewriter. | **decision tables 2.2 and 2.4** read from `--decisions` file between `#### 2.2 `/`#### 2.3 ` and `#### 2.4 `/`#### 2.5 ` headings, 14-column rows; `w3-runs.txt`, `w4-runs.txt` | **PORT**: needs assayer's own decisions file in that exact table shape (G3). |
| W2 | `P34/b15-rename/rename.cjs --batch=w2-*.json apply` | See 3.4. | `w2-*.json` from the b11 census | **FLAGS** |
| W5 | `P34/b15-value-brands/run.cjs --brand=<const> --file=<contract> [--no-group] apply` | Each object-contract field using a standalone value brand gets its own inline brand; typechecker-driven rewriter wraps literals in `ownerContract.parse(...)`. Guards from `lib/rewrite-guards.cjs`. | `w5-runs.txt` (from table 2.6/2.7 / brand-sharing.csv); first five lines are trials | **PORT** (list) |
| W6 | `P34/b12-object-brand-fallout/run.cjs apply` then R2 and R7 autofix (`eslint -c BB/brand-fix.config.js --fix`, one package per eslint process) | Brands every unbranded top-level object contract on an overlay and wraps each literal typed as a branded owner in its parse; R2/R7 brand nested objects and leaves. Parses only the data part of objects holding functions. | none | **AS-IS** |
| W7 | `P34/b14-shape-contracts/run.cjs [pkg ...] apply` (+ `shapes.cjs`, `feasibility/b14/{gen,batch,census}.cjs`) | Every ad-hoc object shape becomes a branded contract + stub + contract test; whole-package gate drops any shape that adds a diagnostic. | none | **FLAGS**. Generated stubs import `StubArgument` from `@dungeonmaster/shared/@types` (hard-coded, run.cjs:261); resolves in assayer because that package is linked and master still exports it. |
| W8 | `P34/b15-unknown-fields/run.cjs --only=json,own apply` (+ `table.cjs`, `gen.cjs`, `measure.cjs`) | Replaces `z.unknown()` per decision table item 3. | `--decisions` file, item 3 table | **PORT** (assayer has 3 `z.unknown/any`, so this wave is a hand edit, not a script) |
| W8R | `b15-unknown-fields/run.cjs --responders apply` (+ `responder-data.cjs`) | One strict-object contract per `responderResultContract.parse({status,data})` site under `packages/server`. | | **DM-ONLY** (assumes `packages/server` responders). Skip. |
| W9 | `P34/b15-dead-reparse/run.cjs [--pkgs=] [--kept-out=] apply` (NEEDS-GREEN) | Removes `xContract.parse(v)` whose argument the checker types as the parse result and whose provenance is a parse. Keeps parses beside "deliberate" comments. | | **AS-IS**. Read its diff for deliberate parses. |
| W10 | `BB/run-all.sh ... W10fix`: R2 then R8 autofix over every package's `src` | | | **FLAGS** |
| 3.2 | `P34/b15-enum-brands-off/run.cjs [pkg ...] [--census] apply`; `move-stubs [pkg ...] apply`; `RUN.md` | Drops `.brand` from top-level enum contracts, prints the `b15-stub-unwrap` commands, moves unreferenced enum stubs to `tmp/deletions/3.2/`. | | **AS-IS** (assayer has 10 branded enums) |
| after | `P34/b15-stub-unwrap/run.cjs <pkg> --stubs=AStub,BStub apply` | `XStub({value: literal})` to the literal for decided stubs, gate per file. | the stub list (from `enum-stubs.csv`/decisions) | **FLAGS** |
| after | `P34/b15-as-never/run.cjs <pkg> [--stub-args-only] apply` | Removes each test-file `as never` only where the file's diagnostics stay identical. | | **AS-IS** (59 casts in assayer) |
| tooling | `BB/brand-fix.config.js` | ESLint config that keeps only R2/R7/R8, from the target's own `eslint.config.js`. `BRAND_FIX_RULES=r2\|r7\|r8`. | `MIGRATE_ROOT`, `MIGRATE_ESLINT_PREFIX` | **AS-IS** (requires assayer's `eslint.config.js` to load: it requires `./eslint-rules`, which exists) |
| driver | `BB/run-all.sh [--root] [--lists] [--base] [--out-dir] [--decisions] [--scope] [--gateway-dir] [--gateway-spec] [--zod-spec] [--browser-pkgs] [--eslint-prefix] [--lint-src="..."] SEGMENT` | Resumable, commits each step as `<KEY>: <what> (script output, tree red)`, markers in `<out>/bigbang/state`, refuses to start while `packages/` is dirty. Segments: **A** = W1, SD12, W3, W4, W2; **B** = W5 trials (first 5 lines); **C** = rest of W5, W6 (+R2/R7), W7, W8 `--only=json,own`; **D** = W8R + W9 (needs green); **W10fix**. `run-a.sh` = segment A. | `--lists` folder with `w1-runs.txt`, `w3-runs.txt`, `w4-runs.txt`, `w5-runs.txt`, `w2-*.json` (samples for dungeonmaster in `BB/`) | **FLAGS**. Never run end to end on a second repo (PORTING section 0). Hard-wired: node heap 16 to 40 GB per step; default commit trailer "Claude'd it up in here!" (override with env `COMMIT_TRAILER`); `--lint-src` default `packages/eslint-plugin packages/local-eslint` (pass `--lint-src=` empty for assayer); the 141/104/18/8 lines in `BB/w*-runs.txt` are dungeonmaster's, not usable. |

### 3.6 Other rewriters (conditional for assayer)

| Script | What it does | Status for assayer |
|---|---|---|
| `P34/b18-adapter-result/run.cjs [--pkgs=] [--sample-out=] [--leftovers=] [--no-verify]` (+ `feasibility/b18/run.cjs`) | Every function returning `AdapterResult` / `{success:true}` becomes void, with callers, forwarders, function types, test asserts and proxies following the typechecker. | **PORT**. It is **dry-run only** (no `apply` mode, writes only `--sample-out`). It matches the `AdapterResult` name and `adapterResultContract`/`AdapterResultStub` by text. Assayer's `AdapterResult` comes from `@dungeonmaster/shared/contracts`, which master no longer exports, so the checker sees an error type. Needs a dry-run trial and an apply wiring. 25 imports, 55 mentions. |
| `P34/b17-json-parse/run.cjs [pkg ...] [--no-gate] apply` (+ `sites.cjs`) | Moves `JSON.parse` straight into a contract parse (single-use, multi-parse, cast-contract). Gate per file. | **AS-IS** candidate (38 `JSON.parse` in assayer). Run unit tests afterwards: the cast-contract rewrite adds a runtime check. |
| `P34/t05-recorded-failures/run.cjs [pkg ...] apply` | A code-carrying hand-made error staged on a proxy becomes the gateway proxy's named recorded failure or `FileMissingErrorStub`/`FsErrorStub`. | **AS-IS** but only useful after assayer's proxies compose gateway fs proxies (after adapter inlining). |
| `P34/l3-stub-swaps/run.cjs` | Copy-stub calls become the gateway's own stubs. | **DM-ONLY** (driven by dungeonmaster's library-copy map). |
| `P34/sd1-retype-residue/*`, `feasibility/b04/*` (Tsestree to TSESTree), `b02-contract-index/reviewed-*` | Retype of dungeonmaster's own flat ESLint-node copy, stub printer, dead-condition strip, malformed test deletion list. | **DM-ONLY** |

### 3.7 Fixer-round tooling (`BB/tools`, `BB/*`)

| Script | What it does | Flags | Status |
|---|---|---|---|
| `BB/tools/diag.cjs [--root] [--pkgs=a,b] [--jobs=3] [--out=f] [--full] [--fence] [--overlay=] [--no-build-pass]` | Typechecks every workspace package the way ward does (tsconfig.json then tsconfig.build.json, merged), one child process per package, JSON of `{pkg,file,line,col,code,message,template,templateFine,checkedBy}`. `--full` required (plain mode stops at the first syntax error). Unfenced by default like ward's tsc. `--out` resolves against the root, so give a root-relative path. | | **AS-IS**. Ran on assayer: 22.6 s wall, 1.4 GB. |
| `BB/tools/graph.cjs [--out=f]` | Import graph over `src` and `test` of all workspace packages, grouped (a file plus its test/proxy/stub), SCC-collapsed, levels. | | **AS-IS** |
| `BB/tools/queue.cjs --diag=f --graph=f --max=5 --mode=ready\|all [--by-template --fine] --out=f` | Fixer batches of up to 5 red files, one package per batch, leaves first; `--by-template` clusters errors so a cluster of hundreds is sent to a script, not an agent. | | **AS-IS** |
| `BB/tools/lib.cjs` | Helpers for the three tools above. | | library |
| `BB/fix-dangling.cjs [--diag=f] [apply]` + `fix-dangling-holds.py <base diag> <after diag>` | For TS2307/TS2305/TS2724 on imports of brands moved to `<out>/deletions/`, rewrites the importer the way the wave would have; the holds script holds back edits that caused new errors. | **FLAGS**. Registry of moved files is read from `<out>/deletions/<wave>/packages/...`; for dungeonmaster-owned names it needs that folder rebuilt (G9). |
| `BB/apply-suggestions.cjs [--root] <ruleId> [pkgDir ...]` | Applies ESLint's first suggestion for one rule, package by package, until none remain (1,410 `no-unnecessary-type-conversion` after W1). | **AS-IS** |
| `BB/strip-w5-wraps.py [--base=REV] [--files=] [apply]` | Removes shape-parse wraps W5 added, keeping pre-existing ones. | **FLAGS**: `--base` default is a dungeonmaster commit hash; always pass the commit before W5. Trap 1; the F125 guards make it mostly unnecessary. |
| `BB/fix-dangling-holds.py` | See above. | |
| `BB/FIXER-BRIEF.md` | The prompt every fixer agent gets (operator decisions D1 to D6, never-list, BLOCKED protocol). First lines name the repo root to substitute. | **FLAGS** (substitute root; its `Never` list matches assayer's rules) |
| `BB/recipes/{plain-into-brand,ts2322-mismatch,misc}.md` | Recipes appended to a fixer batch by error kind. | **AS-IS** |
| `E/agent-brief.md`, `E/a18-operator/{queue,batch}-agent-prompt.txt`, `siegelense-batches.md`, `E/items/a12-adapters-shared.md` (traps), `E/triage-*.md` | Agent briefs and batch plans for the adapter-to-gateway moves. Prompts use `{QUEUE}` and `{REPORT_EVERY}` placeholders and name this repo's paths. | **PORT** (templates) |

### 3.8 Lint switch-on scans

| Tool | What it does | Status |
|---|---|---|
| `npm run ward -- scan <rule> [-- <files or packages>]` (published) | Runs one rule at `error` regardless of config; prints JSON per package: violations plus 2 to 4 file batches. Exits 0 when it finds violations (data, not a gate). | **AS-IS**. Replaces `t04-scan.config.js`, `t05-scan-pkgs.js`, `a18-census.config.js`, `a18-siegelense-census.*`. Rule ids are `@dungeonmaster/<rule>`. |
| `scripts/consumer-check/run.mjs` (codex repo) | Builds a throwaway consumer repo and checks init end to end. | Tests dungeonmaster, not assayer. |

---------------------------------------------------------------------------------------------------

## 4. Gaps: mechanical work the epic did by hand or with agents

From `E/scripting-opportunities.md` (written 2026-09-28) and what exists on master now.

| # | Gap | Status on master | Matters for assayer? |
|---|---|---|---|
| G1 | **Pass-through adapter inliner** (caller call shape, import swap to the gateway barrel, proxy staging map built from the proxy method bodies, adapter folder and `adapters.ts` barrel lines removed, "left for an agent" list). Planned as `migrate-adapter` in `@dungeonmaster/tooling`. | **Not built.** `@dungeonmaster/tooling` has only `adapter-census` and `detect-duplicate-primitives`. The epic did callers by agents and one-off python (rule-tester, testing-library, mantine paths). | **Yes, the biggest.** 16 pass-through adapters (fs read-file/write-file/rename/rm/exists-sync/read-file-sync/mkdir, path basename/dirname/relative/resolve, node-module builtins, react create-element, electron main-entry-path, node-fs read-cache-*) with roughly 80 production callers and 40+ composing proxies. Plus about 14 "logic" adapters whose census row shows an `(exact)` gateway export. Census JSON already gives adapter to gateway export; the script would be new. 26 proxies stage a catch-all; those stay with agents. |
| G2 | Census-driven batching (2 to 6 files, dependency order, proxy composition closed transitively) | `adapter-census` prints per-adapter counts only; `queue.cjs` batches red files, not adapter groups | Medium. With 63 adapters, an operator can batch from the table by hand. |
| G3 | **Decision tables and run lists** (`w1/w3/w4/w5-runs.txt`, `w2-*.json`, tables 2.2/2.4/2.6/2.8) | PORTING: census then one read-only opus planner writes the tables, the operator derives lists. No generator. | **Yes.** The census CSVs make `w1-runs.txt` (class P rows) and `w5-runs.txt` (class F, grouped by `brand-sharing.csv`) mechanical; tables 2.2/2.4 (owner choice) are judgement. A 30-line list generator would remove an operator step. |
| G4 | Stub/proxy import rewrite | Built (B03 scripts) | Yes, covered. |
| G5 | Exports/barrels script and `create-package` templates | Built; templates emit the new form | Yes, covered. |
| G6 | `ward scan` and pre-edit ratchet | scan built; the hook ratchet for off `pre-edit` rules not confirmed | Medium: scan covers the switch-on step. |
| G7 | B12/B13 autofixes, `as never` remover, symbol renames | Built (rules in plugin; b15-as-never; b15-rename) | Yes, covered. |
| G8 | T05 invented-error fix | Built (`t05-recorded-failures`, code-bearing third only) | Low until proxies compose gateway proxies. |
| G9 | **Dangling names that dungeonmaster itself removed** (`AdapterResult`, `errorMessageContract`/`ErrorMessage`, `absoluteFilePathContract`, `processCwdAdapter`, maybe `registerSpyOn`) in assayer code. The epic's repair scripts only ever faced names deleted from the same repo's own `tmp/deletions`. | No script. `fix-dangling.cjs` and `plain-brand-residue.cjs` are the closest, both need the deleted contract files laid out under a `--deletions` dir (rebuild from codex git history at the commit before W1). Untested for foreign packages. | **Yes, first blocker for a green baseline.** About 63 import sites. `AdapterResult` is a real conversion (b18, dry-run only, G10). |
| G10 | `b18-adapter-result` has no `apply` | dry-run + `--sample-out` only | Yes for the 25 `AdapterResult` imports unless done by hand. |
| G11 | Wrappers for `devDependencies` imports and `@gateway/bin` programs (playwright, electron, testing-library, git, jest) | `gateway-sync` only reads `dependencies`; bin wrappers are hand-written per the consumer snippet | Yes, agent work (A12 "wrappers first"). Assayer's npm gateway has 15 folders (zod, ts-morph, typescript, react, react-dom__client, react-router-dom, mantine__core, mantine__hooks, uiw__react-codemirror, codemirror__view, codemirror__lang-javascript, jest, jest__core, ts-jest); `@playwright/test`, `playwright`, `electron`, `@testing-library/*` have none. |
| G12 | The a18 codemod and census config live only in a gitignored worktree `tmp/` | | Yes: copy them out before the worktree goes; then port the three hard-coded lines. |
| G13 | Hand steps H2 to H8 of the big-bang (rename owners, lift duplicates, 11 gateway schemas, stub defaults rejected by new owner schemas) | Left to fixer queue after green (F124) | Expect the same classes; assayer is about a seventh of the size. |
| G14 | W8 `--responders`, `b15-unknown-fields/measure.cjs`, `l3-stub-swaps`, `sd1`, `feasibility/b04`, `libcopy-census` | dungeonmaster-specific | No. |

---------------------------------------------------------------------------------------------------

## 5. Proposed ordered pipeline for assayer

Conventions for every command below:

```
E=/home/brutus-home/projects/codex-of-consentient-craft/scrolls/brands-gateways-epic
A=/home/brutus-home/projects/assayer
FLAGS="--root=$A --scope=@assayer/ --browser-pkgs=app --out-dir=$A/tmp"
```

Run on a scratch branch. One script at a time (each reads `packages/` from disk). `packages/` must be clean before each `apply`. The scripts only touch `packages/`; confirm `git status smoke-repo vendored-fixture eslint-rules` stays clean after each step (smoke-repo is specimen input, never to be rewritten). Verification after any applied step: scoped `npm run ward -- --uncommitted` while iterating, then `npm run ward` and `npm run test:syntax` (assayer CLAUDE.md requires both).

| # | Step | Script | Command | Expected output | Agent still needed? |
|---|---|---|---|---|---|
| 0.1 | Baseline | ward + diag | `npm run ward` (operator, record it). `cd /tmp && node $E/bigbang/tools/diag.cjs $FLAGS --full --jobs=3 --out=tmp/diag-base.json` | Today: 217 errors, 22 s. | No |
| 0.2 | Re-run init | `dungeonmaster init` (published) | in `$A`: `npx dungeonmaster init` | `imports` map in app/cli/core/desktop/shared; root tsconfig node16 + `source`; `gateway-dist` in build configs; gateway-sync run. Re-diag: TS2307 (`#gateway`, `shared/@types`, `shared/contracts`) should drop. | Yes if jest/ts-jest configs or the `commonjs` base config fight node16 (decide and fix once). Not a script. |
| 0.3 | Dangling dungeonmaster names | `bigbang/fix-dangling.cjs` or `merge-master/plain-brand-residue.cjs` after rebuilding a `--deletions` tree from codex history; then `b18-adapter-result` (dry run first) for `AdapterResult` | `node $E/merge-master/plain-brand-residue.cjs --root=$A --diag=$A/tmp/diag-base.json --deletions=$A/tmp/deletions/dm` (dry), then `... --apply` | Rewrites `ErrorMessage`/`AbsoluteFilePath` uses to `string`; leftovers JSON. | **Yes**: trial first (G9); `AdapterResult` conversion (25 sites) is hand or a patched b18 (G10). Goal: typecheck green or only known reds. |
| 1 | Censuses (read-only) | adapter-census, brand-census, b02, b11, b12/b14 `--census`, promise scan | `npx adapter-census --format=json > $A/tmp/adapter-census.json`; `node $E/phase34-scripts/brand-census/census.cjs $FLAGS`; `node $E/phase34-scripts/b02-contract-index/index.cjs $FLAGS`; `node $E/phase34-scripts/b11-contract-merge/census.cjs $FLAGS`; `... b12-object-brand-fallout/run.cjs $FLAGS --census`; `... b14-shape-contracts/run.cjs $FLAGS --census` | CSVs in `tmp/brand-census/`, `delete-candidates.txt`, `duplicates.json`, counts. | No |
| 2 | Gateway raw-call scan | `ward scan` | `npm run ward -- scan @dungeonmaster/raw-import-ban`, same for `platform-globals-ban`, `bin-program-spawn-ban` | Violations per package in small batches (replaces a18 census). | No |
| 3 | Missing wrappers | gateway-sync (npm deps) + agents | `npx dungeonmaster gateway-sync` | Passthrough folders for any new `dependencies`. | **Yes**: wrappers with proxy/stub for devDependency packages (`@playwright/test`, `playwright`, `electron`, `@testing-library/*`) and `@gateway/bin` programs (git). Do these before step 4 so the codemod can swap them. |
| 4 | Raw imports and globals to `#gateway/*` | `a18-codemod/run.cjs` (copy to `$A/tmp/a18-codemod/` with `a18-census.config.js`; patch ROOT, plugin require) | per package, dry then apply: `cd $A && node tmp/a18-codemod/run.cjs shared`, then `--apply`; order shared, core, hydration-recipes, cli, desktop, app. zod-only leftovers: `python3 tmp/a18-zod/rewrite.py <pkg> apply` | Per-package report; REJECTED files listed; zero `raw-import-ban` hits for accepted files. | Yes for REJECTED files, raw mocks in tests/proxies (the codemod skips them), and wrapper gaps. |
| 5 | Adapter inline and delete | **new script G1** (base: census JSON + a18-codemod gateway index + `lib/repo.cjs` gate) | not written yet. Design: for each census row with shape pass-through and an `(exact)` gateway, rewrite callers, rewrite proxy imports and staging through a table derived from the proxy method bodies, delete adapter + proxy + test + barrel line (move to `tmp/deletions/`), print left-for-agent list. | Callers on `#gateway/node/*`; adapters gone; leftover list = catch-all staging, brand-losing returns, changed return shapes. | **Yes, largest agent pile**: 47 logic adapters (become brokers/transformers), every proxy composing a catch-all (26), tests that passed only on a catch-all, `.cause`-reading call sites. Group composing proxies to one agent (O10 lesson). Briefs: `E/agent-brief.md`, `E/items/a12-adapters-shared.md`. Until the script exists, steps 4+5 go by agent batches from the census. |
| 6 | B03 exports and barrels | `b03-exports-barrels`, `b03-per-file-imports`, `b03-strip-barrels`, `b03-stub-type-alias` | per package, leaves first (shared, core, then hydration-recipes, desktop, cli, app): `node $E/phase34-scripts/b03-exports-barrels/run.cjs shared $FLAGS` then `... shared $FLAGS apply`; `node .../b03-per-file-imports/rewrite.cjs $FLAGS --targets=shared` then `apply`; `node .../b03-strip-barrels/run.cjs shared $FLAGS` then `apply`; `node .../b03-stub-type-alias/run.cjs $FLAGS apply` | New `exports`, barrels at `src/<ft>/<ft>.ts`, 219+15 stub/proxy imports moved to per-file paths, stub/proxy lines gone from production barrels. `out/leftovers.json`. Core's `./testing` and the `./adapters` key to resolve by hand. | Yes for leftovers: stub imports in production files (C6 redesign), strings mentioning `/testing`, core's root `.js` files, `package.json` `files`/tsconfig/jest mentions. |
| 7 | Contract index and merges | `b02-contract-index/delete.cjs`, `b11-contract-merge/move.cjs`, `b15-rename/rename.cjs` | `node .../delete.cjs $A/tmp/reviewed-delete.txt $FLAGS --verify` then `apply`; `node .../move.cjs --from=... --to=... $FLAGS` ; `node .../rename.cjs $FLAGS --batch=<json> apply` | Dead contract trios moved to `tmp/deletions`; merges; renames. | **Yes**: reviewing `delete-candidates.txt`, every merge decision, rename list. |
| 8 | Brand decisions | read-only opus planner agent | writes `plan/brand-decisions.md` in the table shape of PORTING section 3 (tables 2.2, 2.4, 2.6, 2.8, item 3), plus `w1/w3/w4/w5-runs.txt`, `w2-*.json` in `$A/tmp/lists/` (W1 and W5 lists derivable from CSVs, see G3) | Decision file and run lists. | **Yes** (judgement: owners, plain-vs-owned, brand-text sharing). |
| 9 | Brands, segments A to C | `bigbang/run-all.sh` | `bash $E/bigbang/run-all.sh $FLAGS --lists=$A/tmp/lists --decisions=$A/plan/brand-decisions.md --base=$(git -C $A rev-parse HEAD) --lint-src= A`, trial `B` (first five W5 lines, read each log), then `C`. Set `COMMIT_TRAILER` to assayer's attribution. | One commit per step (tree red), `<out>/bigbang/{A,B,C}.done`, leftovers files per wave. | No during the run; leftovers go to fixer rounds. Trial on a scratch branch first (never run end to end elsewhere). |
| 10 | Repairs | `fix-dangling.cjs`, `fix-dangling-holds.py`, `strip-w5-wraps.py --base=<commit before W5>`, `promise-parse-scan.cjs`, `apply-suggestions.cjs no-unnecessary-type-conversion` | as in PORTING section 6; `promise-parse-scan` must print 0 | Fewer red files before agents start. | No |
| 11 | Fixer rounds (typecheck, then unit, lint, integration, e2e) | `diag.cjs` + `graph.cjs` + `queue.cjs` + FIXER-BRIEF | `node $E/bigbang/tools/diag.cjs $FLAGS --full --jobs=3 --out=tmp/diag-rN.json`; `graph.cjs --out=...` once; `queue.cjs --diag=... --graph=... --max=5 --mode=ready --out=...`; `--by-template --fine` to find clusters worth a script | Batches of up to 5 files per agent; count falls each round. | **Yes: this is where agents belong.** Sonnet for leaves, opus for root/residue, integration and e2e. Operator runs every check, agents only edit. |
| 12 | NEEDS-GREEN | `run-all.sh ... D` (W9 only for assayer), `b15-as-never`, `b15-stub-unwrap` (stub list from `enum-stubs.csv`), `b15-enum-brands-off` | after typecheck and unit are green: `... run-all.sh $FLAGS ... D`; `b15-as-never/run.cjs <pkg> $FLAGS apply` per package; `b15-enum-brands-off/run.cjs $FLAGS` | W9 diff to read for deliberate parses; casts and enum stub wraps removed. Skip W8R (needs `packages/server`). | Read W9's diff. |
| 13 | Other rewriters | `b17-json-parse`, `t05-recorded-failures` | `node .../b17-json-parse/run.cjs $FLAGS apply` (38 sites); `t05` only once proxies compose gateway proxies | | Leftovers by hand; run unit tests. |
| 14 | Switch rules on | `ward scan` + `W10fix` | for each rule: `npm run ward -- scan @dungeonmaster/<rule>` until clean, then set it to `error`; `bash $E/bigbang/run-all.sh $FLAGS ... W10fix` for R2/R8 autofix | Each rule scans to 0 before it is enabled. | Yes for refusals without autofix (e.g. `z.unknown`, `ban-join-id-beside-child`). |
| 15 | Comment sweep | `z10-scripts/usage-census.py`, `usage-sweep.py`, `usage-verify.py` | from `$A`: `python3 $E/z10-scripts/usage-census.py`, `usage-sweep.py` (dry), `--apply`, `usage-verify.py` | Comment lines naming deleted contracts/stubs rewritten; verify proves comment-only. | Hand queue it prints. |
| 16 | Prove | build and tests | `npm run build` (stale `dist` hides lint and integration failures, trap 10), `node -e "require('./eslint.config.js')"` after any step touching lint inputs, `npm run ward`, `npm run test:syntax`, assayer e2e | Green. | No |

Notes on the pipeline:

- Steps 0.2 and 0.3 are the true unknowns. Nothing in the epic ran init on an already-existing package set that was also linked to a newer dungeonmaster; do these two on the scratch branch and re-run `diag` after each.
- Steps 4 and 5 can be reordered with 6: B03 only moves stub/proxy imports, so it does not depend on adapters being gone, but deleting adapters first removes about 110 adapter proxy files and the `adapters` barrel from B03's input.
- `E/bigbang/RUNBOOK.md` patches P1 to P8 were applied to the worktree `tmp/` copies and copied back; the committed scripts under `E/phase34-scripts/` and `E/bigbang/` already include them (their `apply` modes exist), except `b18-adapter-result` which still has none.
- All script commits and docs written for assayer must follow assayer's CLAUDE.md (plain language, no history narration). `run-all.sh`'s commit subjects say "tree red"; rewrite them with the `COMMIT_TRAILER` env and, if wanted, squash.
