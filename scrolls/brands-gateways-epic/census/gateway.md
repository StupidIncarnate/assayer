# Assayer gateway conversion: read-only census

Date of census: 2026-09-30, repo HEAD 7c1bac6 ("init with gateway setup"), branch init-ast-electron.
Method: python3 os.walk + regex scans (scripts in this scratchpad: scan2.py, adapters.py, gen.py), reading the dungeonmaster
sibling repo's EPIC.md ("Converting the next repo"), items/a12 and a18, and the installed plugin's config broker, plus the
last ward run files in `/home/brutus-home/projects/assayer/.ward/` (real lint and typecheck output).
Nothing was edited, built or installed. Counts from regex scans are marked "approx". Counts from `.ward` runs are exact.

Appendices A to F at the bottom of this file hold every full file list (generated).

---------------------------------------------------------------------------------------------------

## 0. The six things that block everything else (found while counting)

These are not caller work. They explain most of the red baseline and must be settled first.

### 0.1 Scope mismatch: workspace imports are being treated as raw npm imports (about 712 false hits)

- Root `package.json` name is `assayer-monorepo`. `raw-import-ban` and the gateway rules derive the repo "scope" from the root
  name (`packageScopeFromNameTransformer`: unscoped `assayer-monorepo` becomes `@assayer-monorepo`).
- The init scaffold named the gateways `@assayer-monorepo/{npm,node,browser,bin}` and hydration-recipes
  `@assayer-monorepo/hydration-recipes`.
- But Assayer's own workspace packages are `@assayer/core`, `@assayer/shared`, `@assayer/desktop`, `@assayer/app` (cli is the
  unscoped `assayer`). Under scope `@assayer-monorepo`, an import of `@assayer/shared/contracts` is not "workspace", so the rule
  reports it as a raw package and suggests the nonsense `#gateway/npm/assayer__shared__contracts`.
- Measured in the last lint run (run-1790800757049, 2026-09-30 13:39): `raw-import-ban` reports 1,204 errors total (app 209, cli 111,
  core 689, desktop 108, shared 87). Of those, 712 are `@assayer/*` imports: app 106, cli 84, core 447, desktop 75, shared 0.
  Only 492 are real outside-package imports.
- Fix options (operator decision): rename root `package.json` to `@assayer/monorepo` (scope becomes `@assayer`) and rename the four
  gateway packages and hydration-recipes to `@assayer/{npm,node,browser,bin}` / `@assayer/hydration-recipes`, then update every
  `imports` map; or rename every workspace package to `@assayer-monorepo/*`. The first touches fewer files.
- The lint run predates the init commit by about 3 hours (13:39 vs 17:02), but the rule code and the names are unchanged, so the
  conclusion holds. The typecheck runs (17:07) are post-commit.

### 0.2 `tsconfig.base.json` uses `module: commonjs`, `moduleResolution: node` (node10), which ignores `exports` and `imports`

- A `#gateway/*` import cannot resolve under node10. The dungeonmaster scaffold tsconfig
  (`node_modules/@dungeonmaster/eslint-plugin/configs/tsconfig.json`) uses `module: node16`, `moduleResolution: node16`,
  `customConditions: ["source"]`.
- Evidence that this is already hurting: latest full typecheck (run-1790813264305, 17:07) is red everywhere except hydration-recipes:
  app 9, cli 23, core 86, desktop 50, shared 52, gateway bin 1, browser 17, node 25, npm 9. The dominant codes are
  TS2307 "Cannot find module '@dungeonmaster/shared/contracts'" (core 80, desktop 26, shared 52 for `@dungeonmaster/shared/@types`,
  cli 17) and TS7006/TS7031 "implicitly any" (cascade from unresolved `@dungeonmaster/testing` types).
- The gateway packages themselves fail with TS5098 ("customConditions can only be used when moduleResolution is node16/nodenext/bundler"),
  one each in bin, browser, node, npm, because their `tsconfig.build.json` extends the root tsconfig, which extends the node10 base.
- Assayer's root-barrel files (`packages/shared/contracts.ts`, `packages/core/contracts.ts`, `core/brokers.ts`, ...) exist because node10
  resolves `@assayer/shared/contracts` to a root file. App uses `moduleResolution: bundler` already (fine for `imports`).
  Vite config sets `resolve.conditions: ['source', ...]`, jest base has `moduleNameMapper` for `@assayer/*` to root barrels.
- Jest: assayer's own `jest.config.base.js` (not `@dungeonmaster/testing/jest-config-base`) has no custom export conditions, so
  `#gateway/npm/zod` would resolve through the gateway `exports` to `dist` (`require` condition) rather than `src`.
  The gateway packages' own `jest.config.js` do use the dungeonmaster base.

### 0.3 The installed `@dungeonmaster/shared` no longer has the API Assayer's code imports

Imports of `@dungeonmaster/shared/*` in Assayer (approx, by name):
- `AdapterResult` from `/contracts`: 25 files (adapters only, vanishes with the adapters).
- `errorMessageContract` / `ErrorMessage`: 18 / 17 files. No such contract exists in the sibling shared any more.
  Non-adapter users: desktop `brokers/repo/source-root/repo-source-root-broker.proxy.ts`, desktop `contracts/ipc-reply/ipc-reply-contract.ts`,
  cli `responders/precheck/run/{config-resolve,compile-run}-layer-responder.proxy.ts`, core `test/harnesses/specimen-catalogue.ts`,
  core transformers `stub-contradictions`, `harness-validate`, brokers `compile/{process-file,resolve-graph,harness-graph}`, `manifest/load`,
  `stub-overlay/reconcile`, `git/{resolve-commit,ls-tree}`, `config/{validate,load}`. Assayer needs its own error-message contract in
  `@assayer/shared`.
- `absoluteFilePathContract` / `AbsoluteFilePath`: 1 file.
- `@dungeonmaster/shared/@types` `StubArgument`: 89 files (exists in the sibling, only fails under node10).
- `@dungeonmaster/shared/adapters` `processCwdAdapter`: 1 file, `packages/cli/bin/assayer.ts`. That barrel was deleted in the epic; the
  replacement is `cwd` from `#gateway/node/process`.
- `@dungeonmaster/testing/register-mock`: `registerMock` 46 files, `registerSpyOn` 6, `registerModuleMock` 3 (fine, toolkit import is allowed
  by `raw-import-ban`, EPIC concession 20).

### 0.4 Gateway packages are not wired into the build, test or lint graph

- Root `tsconfig.build.json` references only shared, core, cli, desktop. The gateways build with their own `tsc -p tsconfig.build.json`;
  nothing runs that. `scripts/jest-global-setup.js` also builds only `tsconfig.build.json`. EPIC says other packages "typecheck against
  their compiled output", so gateway `dist/` must exist before ward.
- Only `hydration-recipes` (a scaffold with 13 files and no outside calls) has the `imports` map. `core`, `shared`, `cli`, `app`, `desktop`
  have none and declare none of the gateway packages as dependencies, which `gateway-dependency-declared` (post-edit) requires:
  an `imports` entry `#gateway/<kind>/*` and a real `dependencies` entry for the gateway package.
- Scaffolded `@gateway/npm/src/react/react.ts` names React 19 members (`Activity`, `cache`, `cacheSignal`, ...). Assayer's `@types/react` is
  ^18.3.5, hence 8 TS2305 errors in the npm gateway. The wrapper needs trimming or the types upgrading.

### 0.5 `eslint.config.js` does not wire the gateway block or the workspace-names option

See section 7.

### 0.6 The folder type `adapters/` no longer exists in the rule set

`enforce-project-structure` reports `Unknown folder "adapters/". Must use one of: statics, contracts, guards, transformers, errors, flows,
middleware, brokers, bindings, state, responders, widgets, startup, assets, migrations` for every adapter file (and its proxy/test): app 28,
cli 12, core 152, desktop 28 = 220 errors in the last lint run. So adapters cannot stay. Thin ones dissolve into callers (A12 recipe).
The analyzer's ts-morph "layer adapters" and the jest probe adapters are product logic and have to be re-homed (section 8).

---------------------------------------------------------------------------------------------------

## 1. Baseline numbers (exact, from `.ward`)

Lint (run-1790800757049, 2026-09-30 13:39, packages app, cli, core, desktop, shared; hydration-recipes and gateways not in that run):

| package | total | raw-import-ban | platform-globals-ban | enforce-project-structure | enforce-proxy-child-creation | ban-proxy-empty-called-with | ban-test-support-in-production | require-object-contract-brands | ban-invented-failures | bin-program-spawn-ban | typed-unsafe (member-access, call, assignment, argument) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| app | 383 | 209 | 85 | 28 | 13 | 0 | 0 | 4 | 2 | 1 | 7 |
| cli | 391 | 111 | 20 | 12 | 8 | 16 | 0 | 7 | 0 | 5 | 211 |
| core | 1786 | 689 | 16 | 152 | 201 | 69 | 34 | 11 | 7 | 1 | 594 |
| desktop | 541 | 108 | 16 | 28 | 16 | 23 | 1 | 4 | 11 | 0 | 333 |
| shared | 210 | 87 | 0 | 0 | 0 | 0 | 87 | 36 | 0 | 0 | 0 |

Notes:
- The "typed-unsafe" errors (`no-unsafe-call` on an "error type") are a cascade of the unresolved `@dungeonmaster/*` types from 0.2.
- `ban-anonymous-jsx-in-map` 22 and `no-unnecessary-type-conversion` 12 in app, 10 in core, are not gateway rules.
- The `bin-program-spawn-ban` 5 in cli and 1 in app and core fire on raw `child_process` spawns of known programs (see section 4).
- The rules `raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban` are already at `error` in the installed plugin. There is no
  "off until switched on" step in this repo. Assayer's current ward lint is therefore already red on them.
- `platform-globals-ban` 85 in app: about 80 are Playwright `page.evaluate` callbacks in e2e harnesses and specs. The rule exempts an inline
  callback passed as first argument to `page.evaluate`/`evaluateAll`/`waitForFunction`/`addInitScript` (and a named function passed there),
  but those 85 were counted anyway. The rule code in the sibling repo has the carve-out; the lint run's rule messages could be re-read to see
  which survived. My regex (Appendix C) cannot tell, so treat the app window/document count (392/38 occurrences) as approx and mostly e2e.

Typecheck (run-1790813264305, 17:07): see 0.2.

File counts (approx, by kind; Appendix F): core 210 prod + 207 test + 57 proxy + 41 stub + 10 harness + 76x3 adapter files; shared 92 prod + 90 test + 87 stub; cli 39 + 39
+ 11 proxy + 10 stub + 2 harness + 18 adapter; app 59 + 68 test + 25 proxy + 10 stub + 7 harness + 42 adapter; desktop 33 + 31 test + 13 proxy + 6 stub + 42 adapter;
hydration-recipes 6 prod + 5 test + 2 proxy.

---------------------------------------------------------------------------------------------------

## 2. Section 1 of the brief: adapters/ folders

Four adapters folders exist (none in shared or hydration-recipes):

| package | folder | adapter files | each has .proxy.ts + .test.ts | total files |
|---|---|---|---|---|
| core | `packages/core/src/adapters/` | 76 | yes (76 + 76) | 228 |
| cli | `packages/cli/src/adapters/` | 6 | yes | 18 |
| app | `packages/app/src/adapters/` | 14 | yes | 42 |
| desktop | `packages/desktop/src/adapters/` | 14 | yes | 42 |
| total | | 110 | | 330 |

Plus root barrels that expose adapters: `packages/core/adapters.ts` (5 `export *` of adapter files) and the `./adapters` export in `core/package.json`;
`packages/core/testing.ts` exports 26 proxies (includes adapter proxy `ts-morph-walk-file-adapter.proxy`); `moduleNameMapper` entry `@assayer/core/adapters`.
Each adapter listing with its raw imports and its callers is in Appendix A. Summary by what each wraps:

### core (76 adapter files)

Thin outside-call wrappers (18 files, 20 including layer duplicates) with direct gateway replacements:

| adapter | wraps | gateway replacement | status | non-test callers |
|---|---|---|---|---|
| crypto/sha256 | node:crypto createHash | `#gateway/node/crypto` (`export * from 'crypto'`) | exists | 15 |
| fs/exists | fs/promises access | `#gateway/node/fs__promises` `pathExists` | exists | 11 |
| fs/exists-sync | fs existsSync | `#gateway/node/fs` `existsSync` | exists | 1 |
| fs/find-up | fs existsSync + path | `#gateway/node/fs` `findUpSync` | exists | 1 |
| fs/mkdir | fs/promises mkdir | `#gateway/node/fs__promises` `ensureDir` | exists | 10 |
| fs/read-file | fs/promises readFile | `#gateway/node/fs__promises` `readFile` | exists | 15 |
| fs/read-file-sync | fs readFileSync | `#gateway/node/fs` `readFileSync` | exists | 2 |
| fs/readdir | fs/promises readdir | `#gateway/node/fs__promises` `readdir` | exists | 1 |
| fs/rename | fs/promises rename | `#gateway/node/fs__promises` `rename` | exists | 7 |
| fs/rm | fs/promises rm | `#gateway/node/fs__promises` `rm` | exists | 1 |
| fs/write-file | fs/promises writeFile | `#gateway/node/fs__promises` `writeFile` (also `writeFileAtomic`, `writeFileCreatingParent`) | exists | 12 |
| path/basename, dirname, relative, resolve | node:path | `#gateway/node/path` | exists | 2, 2, 5, 1 |
| node-module/builtins | node:module builtinModules | `#gateway/node/module` `builtinModules` | exists | 2 |
| git/exec | child_process execFile('git') | `#gateway/bin/git` | MISSING (bin is empty) | 5 |
| jest/run-cli | @jest/core runCLI | `#gateway/npm/jest__core` (barrel-only) | exists | 1 |

Logic adapters that import outside packages but are Assayer's own product logic (not thin wrappers):

- `typescript/harness-gate` (typescript), `typescript/load-harness` (typescript transpile, `node:vm`, fs, util), `typescript/read-config`
  (typescript, crypto, path), `typescript/resolve-module` (typescript.resolveModuleName): need `#gateway/npm/typescript` (exists but 8 names
  missing, see section 5) and `#gateway/node/vm` (MISSING).
- `jest/probe-inject` (+ `probe-visit-node-layer`): typescript AST transforms. `jest/probe-runtime`, `jest/interpret-case`, `jest/resolve-entry`:
  no raw imports at all. These five are loaded by name from `<coreRoot>/dist/adapters` by generated test shims and by `probe-runtime.js` and
  `probe-transformer.js` (see 8.2).
- `ts-morph/*`: 54 files (about 48 import ts-morph; `walk-file/` alone holds 43 layer files plus `ts-morph-walk-file-adapter`; plus `read-external-signature`
  3, `read-global-signature` 3, `read-harness-value-types` 3). `export *` gateway exists. Callers of `tsMorphWalkFileAdapter`: 10 non-test
  (3 analyzer brokers, 2 compile/run brokers, 1 resolve-sibling broker, 1 transformer, 3 test harnesses) plus tests; layer files are internal to their folder.

### cli (6 adapter files)

| adapter | wraps | gateway replacement | status | non-test callers |
|---|---|---|---|---|
| analyzer-roots/resolve | fs, path | `#gateway/node/fs`, `#gateway/node/path` | exists | 2 |
| package-json/read | fs/promises, path, zod, `__dirname` | `#gateway/node/fs__promises`, `path`, `#gateway/npm/zod` (`__dirname` is exempt) | exists | 1 |
| process-stdout/compile-progress | `process.stdout.write` | `#gateway/node/process` `stdout` | exists | 1 |
| process-stdout/is-tty | `process.stdout.isTTY` | `#gateway/node/process` `stdout` (check; only `stdin-is-tty` has its own folder) | exists, verify | 1 |
| readline/stable-branch-pick | readline, process.stdin/out | `#gateway/node/readline` `question` | exists | 1 |
| util/parse-args | node:util parseArgs | `#gateway/node/util` (`export * from 'util'`) | exists | 2 |

### desktop (14 adapter files)

| adapter | wraps | gateway replacement | status | non-test callers |
|---|---|---|---|---|
| assayer-cli/entry-path | fs existsSync, path | node/fs, node/path | exists | 1 |
| electron/binary-path | `electron` default export (a path string in a Node launcher) | `#gateway/npm/electron` | MISSING | 1 |
| electron/desktop-boot | `app`, `BrowserWindow`, `Menu`, `ipcMain`, path, url, `process.env` | `#gateway/npm/electron`, node/path, node/url, node/process | electron MISSING | 1 |
| electron/main-entry-path | path, `__dirname` | node/path | exists | 1 |
| electron/preload-bridge (+ reply-value layer) | `contextBridge`, `ipcRenderer` | `#gateway/npm/electron` | MISSING | 1 |
| node-child-process/exec | child_process spawn (piped, collects output) | `#gateway/node/child_process` `spawnPiped` / `run` / `stream` | exists | 1 |
| node-child-process/spawn | child_process spawn detached | `#gateway/node/child_process` `spawnDetached` | exists | 1 |
| node-fs/cache-manifest-exists, read-cache-blob, read-cache-manifest, read-resolved-index, read-source, read-stub-index | fs/promises | `#gateway/node/fs__promises` | exists | 2,1,1,1,1,1 |

### app (14 adapter files)

| adapter | wraps | gateway replacement | status | non-test callers |
|---|---|---|---|---|
| assayer-bridge/* (8: get-compiled-file, get-compiled-tree, get-saved-console, get-saved-run, get-status, get-stubs, on-run-output, run-file) | `window.assayerBridge` | `#gateway/browser/window` | exists | 1 each (7 brokers + 1 binding) |
| codemirror/view | @codemirror/view, @codemirror/lang-javascript, @uiw/react-codemirror, react | npm/codemirror__view, codemirror__lang-javascript, uiw__react-codemirror, react | exist | 1 (code-viewer widget) |
| react-dom/mount | react-dom/client, @mantine/core + its CSS, react, `document` | npm/react-dom__client, mantine__core, react; browser/document; CSS side effect (concession 9) | exist, CSS needs a decision | 1 |
| react/create-element | react createElement | `#gateway/npm/react` | exists | 3 responders |
| testing-library/render, render-hook, wait-for | @testing-library/react (+ react, @mantine/core) | `#gateway/npm/testing-library__react` | MISSING | tests and proxies only: 12, 4, 6 |

### Callers of adapters, total

Non-test, non-proxy caller files (approx, name-match): app 13, cli 6, core 63 (of which 11 are test harnesses and 5 are runtime `.js`/barrel files), desktop 11.
Each of those files also has a `.proxy.ts` that composes the adapter proxy: proxies composing adapter proxies (by relative import) = core 46, app 12, desktop 11, cli 6.
The full caller list per adapter is Appendix A; the per-caller-file view (all adapters one file uses) is in section 9 as the group list.

---------------------------------------------------------------------------------------------------

## 3. Section 2: raw imports of npm packages and Node builtins (non-adapter and adapter sources)

Counts are files, approx (regex on import/export-from/require/dynamic import; sample-source strings in test fixtures removed). Full lists: Appendix B.
`@dungeonmaster/*` is excluded (allowed). `NA` = non-adapter source (prod, proxy, stub, harness, test, config), `AD` = under `src/adapters/`.

| package | specifier | NA files | AD files | note |
|---|---|---|---|---|
| shared | zod | 87 | 0 | all prod contracts; the whole raw-import surface of shared |
| core | zod | 41 | 0 | |
| core | ts-morph | 1 | 91 | NA is `test/harnesses/*`; AD includes 43 adapter test files |
| core | typescript | 0 | 9 | 6 adapter + 3 adapter tests |
| core | @jest/core | 0 | 2 | adapter + its proxy |
| core | fs | 14 | 12 | NA: 8 harnesses, 4 tests, 2 prod (`probe-transformer.js`, `assemble-shim-transformer.ts`) |
| core | fs/promises | 0 | 14 | adapters + proxies |
| core | path | 12 | 14 | |
| core | os | 6 | 4 | tests and harnesses |
| core | crypto | 1 | 3 | NA is `probe-transformer.js` |
| core | child_process | 0 | 2 | git-exec adapter + proxy |
| core | module, util, vm | 0 | 1 each | node-module-builtins, load-harness |
| cli | zod | 10 | 1 | |
| cli | fs, os, path, child_process | 2 each | | NA are the two harnesses in `test/harnesses/assayer-cli.harness.ts` and `assayer-compile.harness.ts` |
| cli | fs, fs/promises, path, readline, util | | 1, 2, 2, 2, 1 | adapters and proxies |
| desktop | zod | 6 | 0 | |
| desktop | electron | 0 | 6 | 3 adapters + 3 proxies |
| desktop | fs/promises, child_process, path, fs, url | | 12, 4, 3, 1, 1 | adapters and proxies |
| app | react | 14 | 6 | NA: 4 bindings + 10 widgets |
| app | @mantine/core | 10 | 2 | NA: 10 widgets |
| app | react-router-dom | 3 | 0 | app-flow, app-shell widget, one test |
| app | zod | 10 | 0 | |
| app | @testing-library/react | 4 | 4 | NA are 4 widget proxies |
| app | @testing-library/user-event | 5 | 0 | 4 proxies + 1 test |
| app | @playwright/test | 6 (5 harnesses + `playwright.config.ts`) | 0 | |
| app | @vitejs/plugin-react, vite | 1 each | 0 | `vite.config.ts` (matched by lint ignore `**/*.config.ts`) |
| app | @codemirror/*, @uiw/react-codemirror, react-dom/client | 0 | 1 each | |
| app | node:fs, node:os, node:path, node:child_process | 6, 5, 9, 2 | 0 | e2e harnesses and tests (incl. `jest.config.js`) |
| eslint-rules | node:path, @typescript-eslint/rule-tester | 1 each | 0 | one test file; folder is lint-ignored, own jest |
| scripts | node:child_process, node:fs, node:path, node:url | 1, 1, 2, 1 | 0 | build scripts `copy-dist-package-json.mjs`, `jest-global-setup.js` |
| smoke-repo | fs, path, ts-jest, typescript | 117, 120, 1, 1 | 0 | fixtures, see 3.1 |
| hydration-recipes | none | 0 | 0 | scaffold only |

Real raw imports in non-adapter production code (the part the rule will actually need fixed there) are small: shared 87 and core 41 `zod`,
cli 10 and desktop 6 and app 10 `zod`, app 10 widgets + 4 bindings (react), app 10 widgets (mantine), app 3 react-router-dom, core 2 files
(`assemble-shim-transformer.ts`, plus the runtime `.js`). Most of the rest sits inside `adapters/` which are going away.

### 3.1 Non-package code (in ward/lint graph?)

| dir | in ward graph | in lint | in tsc project | notes |
|---|---|---|---|---|
| `eslint-rules/` | no (own `npm run test:eslint-rules`, own jest) | no (`ignores: 'eslint-rules/**'`) | no | plain JS, `node:path` in one test, `rule-tester`. Leave raw. |
| `scripts/` | no | no (`.js`/`.mjs`, not matched by the `**/*.ts` file globs) | no | `copy-dist-package-json.mjs`, `jest-global-setup.js` use raw node:* and `process.execPath`. Run by jest/npm outside any package `imports` map. Leave raw. |
| `smoke-repo/` | no (`npm run test:syntax`, `typecheck:syntax --prefix smoke-repo`) | no (`ignores: 'smoke-repo/**'`) | own tsconfig | 234 files, 117 specimens. Specimens intentionally use raw `process`/`console` (analyzer inputs; `uses-process`, `uses-console`, `nested-console`, `env-object/multi-read`, `opaque-module`). Test files use raw `fs` and `path` 117 each to read the specimen. Do NOT migrate; they are fixture input. |
| `vendored-fixture/` | no | no | no | fixture package for specimen import resolution. Leave. |
| root `*.config.*`, `jest.config.base.js`, `playwright.config.ts`, per-package `vite.config.ts`, `jest.config.js` | no | no (ignored `**/*.config.ts`, `**/*.config.js`) | partly | raw requires are fine and cannot import `#gateway` (CJS jest/vite configs) |
| `packages/core/{harness-registrar,probe-runtime,probe-transformer}.js` | no | no (not `.ts`) | no | plain CJS loaded inside the Jest process; they `require('./dist/adapters')` and `node:fs/path/crypto`. Cannot import `#gateway`. |
| `packages/*/test/harnesses/*.ts`, `packages/*/bin/*.ts` | yes (linted, ward unit/integration) | yes | per package tsconfig | the cli, app, core harnesses carry raw node:fs/os/path/child_process (count above) |

---------------------------------------------------------------------------------------------------

## 4. Section 3: raw platform globals (approx; comment and string stripped regex)

Type positions (`Buffer` as a type) are exempt in the real rule and `require`, `__dirname`, `__filename`, `module` are exempt by name
(`EXEMPT_NAMES`). I counted them in the appendix but they are not violations.

Non-adapter production code (files; kind prod):

| package | globals (files) |
|---|---|
| core | `__dirname` 1 (`run-paths-broker.ts`, exempt); `module` 1 (identifier in `undriven-projection-transformer.ts`, likely a name not the global); `globalThis` 1 (`probe-runtime.js`); `require`/`exports` in 3 root `.js` runtime files |
| cli | `process` 1 (`bin/assayer.ts`); `require`, `module` 1 (`bin/assayer.ts`, `require.main === module`, exempt) |
| desktop | `process` 2 (`bin/desktop-main.ts`, `src/brokers/run/execute/run-execute-broker.ts`) |
| app | `document` 1 (`responders/app/mount/app-mount-responder.ts`), `globalThis` 1 (`surface-explorer-widget.tsx`), `location` 1 (`app-shell-widget.tsx`); `__mocks__/*.cjs` (lint-ignored) |
| shared | none |
| hydration-recipes | none |
| smoke-repo | `process` 5 files, `console` 8 files (specimens, intentional) |

Adapter files: desktop `process` 2 files, `__dirname` 2, `window` 1 (an `Electron BrowserWindow` local var?), cli `process` 3 files (`stdout`, `stdin`),
`__dirname` 1, app `window` 8 files (`window.assayerBridge`), `globalThis` 1, core `location` 3 files (a local variable named `location`, false positive).
Test/proxy/harness (support) code: app `window` 392 occurrences, `document` 38 (Playwright callbacks, mostly inside `page.evaluate`),
`__dirname` 12; core `process` 11 occurrences, `__dirname` 8; cli `process` 8, `Blob` 2; desktop `Buffer` 4. By count:
`setTimeout`, `setInterval`, `fetch`, `console`, `localStorage` (1 test), `crypto`: none in non-test source outside smoke-repo.
So the platform-globals work is small: about 6 production files plus the adapters' own bodies, plus e2e callbacks that the rule may already carve out.

### Spawned programs

Real spawns (Appendix D has the full list):
- git via `execFile('git', ...)`: one place, `core/src/adapters/git/exec/git-exec-adapter.ts`, called by 5 brokers: `rev-parse <ref>`, `rev-parse --abbrev-ref HEAD`,
  `rev-parse --short HEAD`, `ls-tree -r <ref>`, `rev-parse --is-inside-work-tree`, `branch --list main master`, `cat-file blob <sha>`.
  Needs `#gateway/bin/git` (MISSING). `bin-program-spawn-ban` fires here (core 1).
- node (`process.execPath`): `cli/test/harnesses/assayer-cli.harness.ts`, `assayer-compile.harness.ts` (about 6 spawn calls), `app/test/harnesses/smoke-cache.harness.ts`;
  `scripts/jest-global-setup.js` (`execFileSync(process.execPath, tsc ...)`, not in lint). Use `#gateway/node/child_process` (`run`/`spawnPiped`).
- npm: `app/test/e2e-global-build.ts` `execSync('npm run build')` (the flagged `bin-program-spawn-ban` in app 1). Needs `#gateway/bin/npm` `runScript`/`runBuild` (MISSING).
- electron binary and the assayer CLI as a child: `desktop/src/adapters/node-child-process/{spawn,exec}`: generic command + args, so they use `#gateway/node/child_process`
  (`spawnDetached`, `spawnPiped`/`stream`). Programs `electron` and `node` have no `bin` home (bin knows git, npm, claude, cp, lsof, kill).
- The cli has 5 `bin-program-spawn-ban` hits: its harness `spawn(process.execPath)` calls.
- `npx`: no spawn found. `core/transformers/json-parse-error-source-position-transformer.ts` has `exec(` which is `RegExp.exec`, a false positive.

---------------------------------------------------------------------------------------------------

## 5. Section 5: does a wrapper exist already?

Existing wrappers (under `packages/@gateway/*/src`, assayer's own copy, `@assayer-monorepo/*`):

- node (about 40 subpaths): AbortController, Date, Request, Response, atob, buffer, child_process (run, run-fire-and-forget, run-sync, run-sync-with-input,
  spawn-detached, spawn-live, spawn-long-lived, spawn-piped, stream, stream-lines), clearImmediate/clearInterval/clearTimeout, console, crypto, events, fetch, fs
  (sync wrappers + `export * from 'fs'`), fs__promises, http, module (builtinModules, createRequire, dynamicImport, resolvePackageRoot), net, os, path,
  process, queueMicrotask, readline, setImmediate/setInterval/setTimeout, stream, url, util, util__types, zlib.
- browser: AbortController, Blob, Date, Element, Error, Event, File, FileReader, HTML*, InputEvent, Node, ResizeObserver, Text, URL, URLSearchParams, WebSocket,
  XMLHttpRequest, atob, btoa, clear/setInterval/Timeout, console, createImageBitmap, crypto, document, fetch, indexedDB, localStorage, location, navigator,
  requestAnimationFrame, sessionStorage, window.
- npm (14): codemirror__lang-javascript, codemirror__view, jest, jest__core, mantine__core, mantine__hooks, react, react-dom__client, react-router-dom, ts-jest, ts-morph,
  typescript, uiw__react-codemirror, zod.
- bin: empty, only `src/index.d.ts` (placeholder, to delete once the first subpath exists).

Specifier by specifier (what Assayer actually imports):

| specifier | where used | wrapper | status |
|---|---|---|---|
| zod | shared 87, core 41, cli 11, desktop 6, app 10 | `#gateway/npm/zod` | exists |
| ts-morph | core adapters, 1 harness | `#gateway/npm/ts-morph` (`export *`) | exists |
| typescript | core adapters (6) + tests | `#gateway/npm/typescript` (explicit name list) | exists, 8 names MISSING: `findConfigFile`, `isExpression`, `isStatement`, `parseJsonConfigFileContent`, `readConfigFile`, `transform`, `transpileModule`, `visitEachChild` (core uses these; `sys`, `factory`, `createPrinter`, `createSourceFile`, `resolveModuleName`, `SyntaxKind`, `ScriptTarget`, `ModuleKind`, `ScriptKind`, `isBlock`... are present) |
| @jest/core | core `jest/run-cli` | `#gateway/npm/jest__core` | exists |
| react | app | `#gateway/npm/react` | exists (names used are all listed; React 19 names break typecheck against @types/react 18, see 0.4) |
| react-dom/client | app mount adapter | `#gateway/npm/react-dom__client` | exists |
| react-router-dom | app 3 | `#gateway/npm/react-router-dom` | exists |
| @mantine/core | app 10 widgets + adapters | `#gateway/npm/mantine__core` | exists |
| @mantine/core/styles.css | app mount adapter | none (side-effect CSS) | MISSING / needs decision: EPIC concession 9 puts CSS imports in the Vite entry file |
| @codemirror/view, @codemirror/lang-javascript, @uiw/react-codemirror | app codemirror adapter | npm/codemirror__view, codemirror__lang-javascript, uiw__react-codemirror | exist |
| electron | desktop (6 files) | none | MISSING (no worked example in dungeonmaster; write from scratch; default import is a path string in Node launcher context) |
| @testing-library/react | app adapters + 4 widget proxies | none | MISSING (dungeonmaster ships `testing-library__react` as a reference) |
| @testing-library/user-event | app 4 proxies + 1 test | none | MISSING (reference in dungeonmaster) |
| @testing-library/jest-dom | app `jest.config.js` setup only | none | not imported from TS, no wrapper needed |
| @playwright/test | app 5 harnesses + `playwright.config.ts` | none | MISSING (reference `playwright__test`) |
| vite, @vitejs/plugin-react | app `vite.config.ts` only | none | not needed: config files are lint-ignored. Optional. |
| playwright, left-pad, some-package, vendored-pkg, x | core tests | n/a | fixture strings, not imports |
| @typescript-eslint/rule-tester | eslint-rules test | none | not needed: outside the lint graph |
| fs, fs/promises, path, os, child_process, crypto, module, util, url, readline | many | node/fs, fs__promises, path, os, child_process, crypto, module, util, url, readline | exist |
| node:vm | core `load-harness` adapter | none | MISSING (`#gateway/node/vm` has no folder) |
| `process.stdout`, `process.stdin`, `process.env`, `process.cwd` | cli, desktop | `#gateway/node/process` (`stdout`, `stdin-is-tty`, `cwd`, `get-env`, `exec-path`, `exit` ...) | exist |
| `window`, `document`, `globalThis`, `location` | app | `#gateway/browser/window`, `document`, `location` | exist (`globalThis` has no wrapper, one use in `surface-explorer-widget.tsx`, check what it reads) |
| program `git` | core | `#gateway/bin/git` | MISSING |
| program `npm` | app e2e global build | `#gateway/bin/npm` | MISSING |
| program `node`, `electron` | cli/app harnesses, desktop | `#gateway/node/child_process` `run`/`spawnPiped`/`spawnDetached` | exist (no bin home for them) |

Missing wrappers needed (complete list):
1. `#gateway/bin/git` (new, hand-written; reference `node_modules/@dungeonmaster/bin/src/git` has `gitRun`, `currentBranch`, `headSha`, `verifyRef` ...; Assayer also needs `lsTree`, `catFileBlob`, `branchList`, `isInsideWorkTree`).
2. `#gateway/bin/npm` (reference `bin/src/npm`: `runScript`, `runBuild`), for one e2e global-build file.
3. `#gateway/node/vm` (new).
4. `#gateway/npm/typescript`: add 8 names.
5. `#gateway/npm/electron` (new, with proxy/stub; mocking `app`, `BrowserWindow`, `Menu`, `ipcMain`, `contextBridge`, `ipcRenderer`).
6. `#gateway/npm/testing-library__react` and `testing-library__user-event` (copy from dungeonmaster).
7. `#gateway/npm/playwright__test` (copy from dungeonmaster; used only by app e2e harnesses and config).
8. Decision: `@mantine/core/styles.css` placement (concession 9).
9. Fix the scaffolded react wrapper's React 19 names (not a new wrapper).
Optional: `vite`, `vitejs__plugin-react` (configs are lint-ignored), `@gateway/browser/globalThis`.

---------------------------------------------------------------------------------------------------

## 6. Section 6: test-side counts and how proxies mock adapters now

Regex counts over `.ts`/`.tsx` under `packages/` (approx but occurrence-level):

| package | jest.mock | jest.spyOn | registerMock calls | registerModuleMock | registerSpyOn | `as never` | `as unknown as` | `calledWith([])` (catch-all default staging) |
|---|---|---|---|---|---|---|---|---|
| core | 0 | 0 | 40 | 0 | 0 | 7 (6 files) | 1 (`fs-readdir-adapter.proxy.ts`) | 71 (23 files) |
| shared | 0 | 0 | 0 | 0 | 0 | 24 (8 files, stubs and contract tests) | 0 | 0 |
| cli | 0 | 0 | 19 | 0 | 2 | 0 | 0 | 18 (9 files) |
| app | 0 | 0 | 0 | 0 | 1 (surface-explorer-widget.proxy.tsx) | 5 (4 contract/transformer tests) | 0 | 1 |
| desktop | 0 | 0 | 22 | 3 (electron adapter proxies) | 6 (spawn, preload-bridge x4, desktop-boot) | 1 | 0 | 38 (14 files) |
| hydration-recipes | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

How it works now: an adapter proxy (`<name>-adapter.proxy.ts`) calls `registerMock({ fn: <raw node function> })` from `@dungeonmaster/testing/register-mock`
on the RAW module function (`readFile` from `fs/promises`, `execFile` from `node:child_process`, `existsSync`), seeds a catch-all default with
`handle.calledWith([]).resolves('')`, and exposes `returns`/`throws` that queue `handle.onceFor([])...`. A broker proxy composes the adapter proxy by relative
import (46 core broker proxies, 12 app, 11 desktop, 6 cli). Tests never use `jest.mock` or `jest.spyOn`. Electron adapters use `registerModuleMock` (3 files) and
`registerSpyOn` (desktop 3 files, cli 2, app 1). The `calledWith([])` form is what `ban-proxy-empty-called-with` flags (108 lint errors: core 69, desktop 23, cli 16).

Target shape (A12 recipe): each broker proxy composes the gateway wrapper's own proxy, imported per file, never from a barrel:
`#gateway/node/fs__promises/read-file/read-file.proxy` etc, staged by exact argument tuple; never `registerMock({ fn })` on a gateway wrapper with a real body.
The gateway's pass-through wrappers (`path`, `os`, `crypto`, `util`, `url`, `ts-morph`, `jest__core`, `zod`) have no `.proxy.ts` (barrel-only); callers mock those directly with
`registerMock({ fn })` as dungeonmaster did for `join`. The `ban-workspace-export-mocks` rule (inert here, see 7) governs mocking `@assayer/*` workspace exports.
The proxy-mock hoister recognises the literal specifier `@dungeonmaster/testing/register-mock`, so that import stays.

---------------------------------------------------------------------------------------------------

## 7. Section 7: lint config

`/home/brutus-home/projects/assayer/eslint.config.js` (CJS, flat config):

- Pulls everything from the linked plugin: `const dungeonmaster = require('@dungeonmaster/eslint-plugin').default;` then
  `dungeonmasterConfigs = dungeonmaster.configs.dungeonmaster`, `dungeonmasterTestConfigs = dungeonmaster.configs.dungeonmasterTest`. The plugin is a `file:` link to
  `../codex-of-consentient-craft/packages/eslint-plugin`, loaded from its `dist` (built 2026-09-30 16:49, same as the source mtime). The `configs` objects are built at
  plugin import time with default arguments (`configDungeonmasterBroker()`), so `gatewayLintConfig` is the default empty config and `workspacePackageNames` is `[]`.
- Two config blocks: `**/*.ts, **/*.tsx` minus tests, with `...dungeonmasterConfigs.typescript.rules` plus `@assayer/no-nullish-coalescing-on-arrange-value: 'error'`
  (local plugin `./eslint-rules`); the tests block with `dungeonmasterTestConfigs.test.rules` plus the same local rule. `...dungeonmasterConfigs.fileOverrides` and
  `...dungeonmasterTestConfigs.fileOverrides` follow. Parser options `project: './tsconfig.json'`.
- Global ignores: `**/dist/**`, `**/*.config.ts`, `**/*.config.js`, `**/*.d.ts`, `**/@types/**`, `**/__mocks__/**`, `smoke-repo/**`, `eslint-rules/**`.
- NOT wired: the plugin's `.gateway` block (`dungeonmasterConfigs.gateway`: carve-out for `packages/{npm,node,browser,bin}/src/*.ts` with gateway-import-boundary,
  gateway-colocation (requireStub), gateway-layout, gateway-return-unknown-not-caller-type, gateway-schema-brand); no `ignores` entry for `gatewayLocationsStatics.packageGlobs`
  on the main block; no `gatewayLintConfig` read from `.dungeonmaster.json` (whose `gateway` key is `{}`); no `workspacePackageNames`. Consequences: when ward lints the four
  gateway packages they get the full workspace rule set (and the root `tsconfig.json` project does not include `packages/@gateway/*/src`, so typed linting of them can fail);
  `ban-workspace-export-mocks` reports nothing (empty name list); `enforce-gateway-config-names-exist`, `ban-gateway-export`, `enforce-gateway-restricted-to` run on empty config.
  The dungeonmaster repo's own `eslint.config.js` shows the wiring (`configGatewayLintConfigBroker`, `configWorkspacePackageNamesBroker`, a gateway block).
  No per-file `off` entries exist in Assayer's config today. No `eslint-comments` disables allowed (`eslint-comments/no-use` is `error`).

Rule levels in the installed plugin (`dist/brokers/config/dungeonmaster/config-dungeonmaster-broker.js`), all inherited by Assayer unchanged:

| rule | level now | timing tag (shared statics `dungeonmasterRuleEnforceOnStatics`) | note |
|---|---|---|---|
| `@dungeonmaster/raw-import-ban` | error | ward-only (type-checked, not pre-edit) | 1,204 hits (712 false, see 0.1) |
| `@dungeonmaster/platform-globals-ban` | error | ward-only (type checker) | 137 hits across app/cli/core/desktop in the last run |
| `@dungeonmaster/bin-program-spawn-ban` | error | ward-only | 7 hits; fails open for any command it cannot read statically; does not see `#gateway/node/child_process` callers with a program resolved through another file (A18 R1 note) |
| `@dungeonmaster/ban-workspace-export-mocks` | error | pre-edit | inert (empty `workspacePackageNames`) |
| `@dungeonmaster/ban-proxy-catch-all-defaults` | error | pre-edit | 0 hits reported; yet 128 `calledWith([])` sites exist (the other rule catches them) |
| `@dungeonmaster/ban-proxy-empty-called-with` | error | ward-only (type checker) | 108 hits |
| `@dungeonmaster/ban-invented-failures` | error | pre-edit | 20 hits (app 2, core 7, desktop 11) |
| `@dungeonmaster/ban-test-support-in-production` | error | pre-edit | 122 hits (shared 87 = `contracts.ts` barrel re-exports 87 stubs; core 34; desktop 1) |
| `@dungeonmaster/ban-jest-mock-in-tests`, `ban-jest-mock-in-proxies` | error | pre-edit | no `jest.mock` anywhere, clean |
| `@dungeonmaster/gateway-dependency-declared` | error | post-edit | needs `imports` map + gateway dependency per package |
| `@dungeonmaster/enforce-gateway-schema-fields`, `ban-contract-type-predicates` | error | pre-edit | |
| `@dungeonmaster/ban-gateway-export`, `enforce-gateway-restricted-to`, `enforce-gateway-config-names-exist` | error with default config | pre-edit / post-edit | |
| `@dungeonmaster/enforce-project-structure` | error | pre-edit | 220 "Unknown folder adapters/" hits |
| `@dungeonmaster/require-object-contract-brands` (and `-indexed`) | error | pre-edit | 62 hits (brand work, not gateway) |
| `@dungeonmaster/require-contract-parse` | off | | |
| `@dungeonmaster/ban-type-aliases` | off | | |
| `@dungeonmaster/enforce-folder-return-types` etc. | error | | |

So the "pre-edit and off until switched on" story in the EPIC's consumer table does not apply here: in the installed plugin version these are at `error` already.

---------------------------------------------------------------------------------------------------

## 8. Section 8: conflicts with Assayer's own design constraints

### 8.1 Analyzer's direct ts-morph and typescript use (CLAUDE.md "Static analysis reads only the parsed AST", core/CLAUDE.md sections 3, 5.10)

- `#gateway/npm/ts-morph` is `export * from 'ts-morph'`, so `Project`, `Node`, `SyntaxKind`, and every type keep their identity. No analysis semantics change.
  The ban on `getText()` and the hermetic walk (`new Project({ useInMemoryFileSystem: true })`) are unaffected as long as nothing in the wrapper layer wraps or
  stringifies nodes. The wrapper must stay a pure pass-through; no curated behavior wrapper may get between the walk and ts-morph.
- Type identity risk: ts-morph bundles its own `ts` namespace. The gateway `typescript` wrapper is `export { default } from 'typescript'` plus a named list.
  If the gateway `npm` package resolves a different `typescript` copy than ts-morph's, `ts.SyntaxKind` values from the two can disagree. Gateway `dependencies` hold both `ts-morph` and
  `typescript`, so the same hoisting applies as today, but the CLAUDE.md "known defect" about `typescript` as a regular dependency interacts with this (see 8.5).
- `core/CLAUDE.md` sections 3 and 4 name `ts-morph-walk-file-adapter`, `walk-node-layer-adapter`, `dispatch-node-layer-adapter`, `handle-<x>-layer-adapter` and
  `adapters/ts-morph/**`, `adapters/typescript/**`, `adapters/jest/**` as the only places that touch ts-morph, with 46 mentions of "adapter". Those paths, the
  specimen registry reference to `readEntryAccessLayerAdapter` (`core/test/harnesses/specimen-registry.ts`), the CLAUDE.md recipe step 4 ("add the handler's proxy and test") and a
  regression-lock comment in `eslint-rules/no-nullish-coalescing-on-arrange-value/...rule.test.js` (line 90, names `packages/core/src/adapters/ts-morph/walk-file/`) all change when the folder is re-homed.
  Per the repo rules (docs state the present truth), CLAUDE.md and core/CLAUDE.md need rewriting at the same time as the move.
- The 43 walk-file layer adapters are not outside-call wrappers; they hold analysis logic. Because `adapters/` is no longer a legal folder type, they have to become brokers
  (`brokers/ts-morph/walk-file/...`, layer brokers), each with proxy and test, importing ts-morph only through `#gateway/npm/ts-morph`. That is a re-home of about 54 + 108 files, not a caller
  migration. `FileAnalysis`/`WalkFileResult` contracts and the specimen suite (`npm run test:syntax`, not in ward) must stay byte-identical (determinism); run both `npm run ward` and `npm run test:syntax`.

### 8.2 Runtime contracts that name `dist/adapters`

- `core/package.json` `exports["./adapters"]`, `core/adapters.ts`, `jest.config.base.js` `moduleNameMapper['^@assayer/core/adapters$']`.
- Generated test shims `require("<coreRoot>/dist/adapters")` for `jestInterpretCaseAdapter` and `jestResolveEntryAdapter`:
  `core/src/transformers/assemble-shim/assemble-shim-transformer.ts` (+ test, 5 occurrences), `core/src/brokers/run/unit/run-unit-broker.ts:170` (`adaptersPath: \`${coreRoot}/dist/adapters\``) (+ test line 102),
  `scripts/jest-global-setup.js` comment, `core/probe-runtime.js` (`require('./dist/adapters')` for `jestProbeRuntimeAdapter`), `core/probe-transformer.js` (`jestProbeInjectAdapter`), and `harness-registrar.js`.
  These run in a different process (inside Jest) as plain CJS, outside the gateway, and cannot import `#gateway/*`. Moving the five jest adapters out of `adapters/` requires changing
  the shim generator's `adaptersPath` and its tests, and the three `.js` runtime files, in one coordinated group.
- Assayer's own jest base (`jest.config.base.js`) has a `globalSetup` that builds `tsconfig.build.json` so that the compiled shim target is current. Gateway builds need to join that.

### 8.3 The `vm` sandbox for harnesses (CLAUDE.md "Harnesses fill only the gaps")

`typescriptLoadHarnessAdapter` imports `node:vm`, `fs`, `node:util`, `typescript` and evaluates the transpiled harness in a bare `vm` sandbox whose only reachable import is Assayer's collector.
There is no `#gateway/node/vm`. The wrapper must expose only what the sandbox needs (`runInNewContext`/`Script`/`createContext`), and the sandbox itself must not hand harness code
`#gateway` imports or a `require` to the gateway: the "closed vocabulary" and "never a raw assertion" rules (D19, R1) depend on that. A gateway proxy for `vm` has to mock at the right level
(never replace a wrapper with a real body by `registerMock({ fn })`).

### 8.4 Jest and Playwright are Assayer's product, not just its dependencies (R1)

- `jestRunCliAdapter` calls `runCLI` from `@jest/core`; `#gateway/npm/jest__core` is a bare `export *`, so the whole raw Jest API is reachable through the gateway by Assayer's own code.
  That is internal use, but CLAUDE.md R1 says raw runner controls are never exposed to an LLM author. Keep the gateway import confined to the one broker that runs jest and do not let a
  harness or generated file reach `#gateway/npm/jest*` or `playwright__test`.
- `jest`, `ts-jest` gateway wrappers exist and nothing imports them (only configs); the smoke-repo's `jest.config.js` and `ts-jest` config are fixture input.
- The app e2e harnesses use `@playwright/test`; a `#gateway/npm/playwright__test` wrapper is needed for those, but it is Assayer's own test tooling, not part of the product.
  Assayer must keep testing itself the ordinary way (CLAUDE.md "Assayer tests itself the ordinary way"): the gateway proxies are plain Jest/registerMock, which fits.
- Generated tests live in `.assayer/cache/` (not source, not linted, never committed). They `require` `@assayer/core` compiled output by path; they never import `#gateway`.

### 8.5 Electron preload and main (desktop)

- `desktop-boot` is the main-process I/O boundary; `electron-preload-bridge` is the preload one. `new BrowserWindow({ webPreferences: { sandbox: false } })` is set so the tsc-emitted multi-file preload can
  `require` its own modules. A `#gateway/npm/electron` import in the preload becomes `require('@assayer-monorepo/npm/dist/electron/electron.js')`, which loads only because `sandbox: false`.
  Do not turn the sandbox on, and make the preload's transitive gateway imports stay minimal (preload must not drag `#gateway/node/*` more than needed).
- `import electron from 'electron'` in `electron-binary-path-adapter.ts` relies on the default export being a path string outside Electron. A wrapper must preserve that (curated default).
- Dev flow: `nodemon.json` watches desktop `dist/` and sibling `core`/`shared` `dist/`, listed explicitly. Gateway `dist/` changes (npm, node) would not restart Electron; add them if gateway edits should
  reload the window. `npm run dev:stop` pattern notes (`[d]esktop-main.js`) are unaffected.
- `ASSAYER_DEV=1` and `ASSAYER_HEADLESS=1` are read from `process.env` in `desktop-boot` (platform-globals-ban hits): move to `#gateway/node/process` `getEnv`.
- The renderer reads `window.assayerBridge`: use `#gateway/browser/window`; never stub the bridge (CLAUDE.md "Driving the desktop app by hand").

### 8.6 "Core is not ready to publish" known defect (CLAUDE.md)

Core declares `typescript`, `ts-jest`, `ts-morph`, `zod`, `jest`, `@jest/core` as dependencies. After conversion the version lives in the gateway `@assayer-monorepo/npm` `dependencies`
(`@codemirror/*`, `@jest/core`, `@mantine/*`, `@uiw/react-codemirror`, `jest`, `react*`, `ts-jest`, `ts-morph`, `typescript`, `zod`) and `gateway-dependency-declared` forces core to list the gateway packages
instead. A published `@assayer/core` would then depend on `@assayer/npm`, `@assayer/node` which must be published too and have a `files: ["dist"]` that works. The `typescript`
peer-dependency decision (still open) must be settled together with this, since both the gateway and core would pull it. `app`'s npm deps (react, mantine) belong to the gateway package as well.
Gateway `package.json` has `publishConfig.access public` and `files: ["dist"]`, which already addresses the empty-`dist` half of the defect for gateways only, not for core.

### 8.7 Other design-constraint conflicts

- Determinism and "never getText": none of the gateway swaps change identity or analysis; the byte-identical cache test (`test:syntax`) is the check.
- P3 "detect by the type graph, never by convention": the analyzer's own detection code must stay free of `#gateway` special cases. Nothing in `core` today special-cases it. (Assayer
  analyzing a gateway-converted repo is plain imports to it.)
- Error text (P1): every new wrapper error and every migrated broker keeps its exact message; tests assert word for word. A12's recipe of catching `RunNotFoundError` only (git missing) must map to Assayer's existing exact P1 text for a missing `git`.
- No per-site waivers: A18/EPIC plans file-scoped `off` entries (concessions 13, 14) for special cases. Assayer's CLAUDE.md forbids per-site suppression, so any such entry would violate it. Candidates needing a
  decision: the playwright callbacks, `probe-runtime.js`-style runtime files (outside the lint graph, so no entry needed), `walk-file` (no global use). Avoid asking for any `off`.
- Specimens and smoke-repo: `smoke-repo/**`, `vendored-fixture/**` are analyzer input; converting them to `#gateway/*` would destroy the specimens (`uses-process`, `uses-console`, `nested-console`, env-object).
- `@dungeonmaster/shared` brand pivot: `contracts.ts` barrel re-exports 87 stubs (shared) and 8 (core); the `ban-test-support-in-production` rule is a B03 (per-file `./*.stub` exports) job, a separate epic item, but it blocks a clean lint of shared.

---------------------------------------------------------------------------------------------------

## 9. Draft split of work (small groups of 2 to 6 caller files, dependency order)

Rules from the EPIC: wrappers first and built; one group = one agent; groups edit a caller, its `.proxy.ts`, its `.test.ts`; run the whole unit suite of each package that composes
a changed proxy; scan every diff for banned shapes; never `registerMock({ fn })` on a gateway wrapper with a body; one agent per package at a time; the operator builds.

### Phase 0: infrastructure (operator, no caller edits, in this order)

- P0-1 Scope names: rename root package and the five scaffolded packages so scope = `@assayer` (or the reverse). Update `imports` maps. Removes about 712 false raw-import hits.
- P0-2 `tsconfig.base.json` to node16/customConditions `source` (app already bundler); gateways' `tsconfig.build.json` follow; root tsconfig references; jest base: export conditions and
  `diagnostics`/module options; add `imports` map and gateway `dependencies` to core, shared, cli, app, desktop; vite `resolve.conditions` already has `source`.
- P0-3 Wire gateways into `tsconfig.build.json`/`build`/`jest-global-setup.js`; fix react 19 names; rerun baseline typecheck of gateways (52 errors now).
- P0-4 `eslint.config.js`: gateway block and ignore, `gatewayLintConfig`, `workspacePackageNames` (the sibling's config is the model).
- P0-5 Replace `errorMessageContract` / `AdapterResult` / `absoluteFilePathContract` with Assayer-owned contracts in `@assayer/shared` (needs a small design: error text P1 types). Fix `processCwdAdapter`.
- P0-6 Record a fresh baseline ward after P0-1 to P0-5 (this is the "was it already red" answer).

### Phase 1: wrappers (each: wrapper, `.proxy.ts`, `.stub.ts`, test; build `@gateway/*` after each)

- W1 `#gateway/bin/git`: `gitRun`, `currentBranch`, `headSha`, `verifyRef` (copy shape), new `lsTree`, `catFileBlob`, `branchList`, `isInsideWorkTree`.
- W2 `#gateway/node/vm` (+ delete `bin/src/index.d.ts` placeholder once W1 lands).
- W3 `#gateway/npm/typescript`: add the 8 names (+ test).
- W4 `#gateway/npm/electron`: `app`, `BrowserWindow`, `Menu`, `ipcMain`, `ipcRenderer`, `contextBridge`, default path export; proxy staging by channel.
- W5 `#gateway/npm/testing-library__react`, `#gateway/npm/testing-library__user-event`.
- W6 `#gateway/npm/playwright__test`; optional `#gateway/bin/npm`.
- W7 decision on `@mantine/core/styles.css`.

### Phase 2: caller migration, package by package

Order: shared, core (leaf callers, then git, then typescript/vm, then jest/probe), desktop, cli, app. Counts of files per group are the non-test caller files; each also moves its proxy and test.

**shared** (87 prod files, zod only; no adapters):
- SH-Z scripted per EPIC concession 11: one scripted agent rewrites `from 'zod'` to `from '#gateway/npm/zod'` in the 87 contract files (A18 `-Z` pattern: a dry-run script that skips any file with another raw import), then lint/typecheck/unit of shared. Or split into 15 batches of about 6 by contract folder if scripts are not allowed.
- SH-B (not gateway, listed because shared lint stays red): `contracts.ts` stub re-exports (87), brand errors (36).

**core** (63 non-test caller files of adapters + 41 zod files; 46 broker proxies compose adapter proxies):
- CZ scripted zod rewrite in core (41 files), split into 7 batches if needed.
- CG1 `brokers/config/{find, generate, hash, load, stable-branch-save}` (5 files; uses fsExists, pathDirname, fsMkdir, fsWriteFile, cryptoSha256, fsReadFile)
- CG2 `brokers/manifest/{load, trash, write}`, `brokers/harness-index/write`, `brokers/resolved-index/write`, `brokers/stub-index/write` (6)
- CG3 `brokers/run/{console-find, console-save, find, id, load}` (5; `run/id` also uses typescriptHarnessGateAdapter, so it waits for CG10 if the gate adapter moves later; otherwise leave that single import for CG10)
- CG4 `brokers/run/{paths (run-paths-broker + run-each-layer-broker), cross-file-probes, unit}` (4; `unit` uses jestRunCliAdapter and tsMorphWalk, partial)
- CG5 `brokers/compile/{process-file, plan-current, resolve-root, run, stub-graph, walk-working-tree}` (6; process-file also uses tsMorphWalk)
- CG6 `brokers/compile/{harness-graph, resolve-graph (2 files)}`, `brokers/analyzer/hash` (4; harness-graph uses typescriptLoadHarness, so after W2/W3)
- CG7 `brokers/external-signature/{read, read-global}`, `brokers/stub-overlay/load`, `brokers/stub/realize`, `brokers/param-type/resolve` (5)
- CG8 `brokers/git/{cat-file, current-branch, detect-stable-branch, ls-tree, resolve-commit}` (5; after W1; stage with `runProxy`-style gateway proxy by command/args/cwd; keep the exact P1 text for a missing git)
- CG9 `brokers/harness/{classify, realize}`, `brokers/resolve-sibling/callee`, `brokers/compose/{cross-file-map, cross-file-predicates}` (5; after W2 and W3)
- CG10 re-home of the product-logic adapters (not an A12-style swap): `typescript/{harness-gate, load-harness, read-config, resolve-module}` (4 adapters + proxies + tests) into brokers/transformers
- CG11 `jest/{interpret-case, resolve-entry, probe-runtime, probe-inject, run-cli}` re-home, including the shim generator (`assemble-shim-transformer`, `run-unit-broker`, `arrange-text-transformer`, `probe-runtime-contract.ts`), the `.js` runtime files and `adaptersPath` (4 + 5 files; must be one coordinated group, see 8.2)
- CG12 `ts-morph/read-external-signature`, `read-global-signature`, `read-harness-value-types` re-home (3 folders, 9 adapter files) plus callers: `external-signature/*` (CG7 files) and `harness-graph`
- CG13 `ts-morph/walk-file`, 43 layer adapters + main adapter (the biggest group): re-home in about 8 batches of about 5 to 6 layer files by handler family (block/call/class/dynamic-import, exit/export/function, if/import/member-access, source-file/switch/type-declaration, variable/project-node/handler-result, read-* (14), walk-facts/walk-node/dispatch/desugar/flatten/derive-branch-id). Callers: analyze/{extract,file}, compiled-file/resolve (desktop, via core), declared-types-projection transformer, resolve-sibling/callee, compile/process-file, run/unit.
- CG14 core `test/harnesses/*.ts` (8 files: example-resolution, harness-graph, resolve-graph, specimen-catalogue, specimen-registry, stub-graph, syntax-traits, + raw `node:fs/os/path` in 8 harnesses) and `app/test/harnesses/syntax-surface.harness.ts` (1). Specimen registry changes are hand-authored (core/CLAUDE.md section 6).
- CG15 delete `core/src/adapters/` (all 76 + proxies + tests), `core/adapters.ts`, `./adapters` export, `testing.ts` adapter-proxy line, jest `moduleNameMapper`, `desktop`'s/`cli`'s uses.

**desktop** (after core build; 11 non-test callers; 14 adapters):
- DG1 `brokers/cache/{load-blob, load-manifest, load-resolved-index, load-stub-index}` (4; node-fs adapters -> fs__promises)
- DG2 `brokers/compiled-file/resolve`, `brokers/compiled-tree/resolve`, `brokers/stub-index/resolve` (3)
- DG3 `brokers/desktop/launch` (electronBinaryPath, mainEntryPath, nodeChildProcessSpawn), `brokers/run/execute` (assayerCliEntryPath, nodeChildProcessExec, `process`), `bin/desktop-main.ts` (`process`) (3; needs W4 for electron binary path)
- DG4 `responders/desktop-main/boot`, `responders/desktop-preload/expose` (2; electron boot and preload bridge, after W4; keep `sandbox: false`)
- DG5 zod rewrite (6 files) and delete `desktop/src/adapters/` (14 adapters).

**cli** (after core and desktop):
- CL1 `responders/precheck/run/{compile-run-layer, precheck-run, stable-branch-layer}` (3; progress writer, tty, readline, analyzer roots)
- CL2 `responders/{detail/show, unit/run, version/show}` + `bin/assayer.ts` (`processCwdAdapter` -> `cwd`, `process`) (4)
- CL3 `test/harnesses/{assayer-cli, assayer-compile}.harness.ts` (2; raw node:child_process/fs/os/path, `spawn(process.execPath)` x6)
- CL4 zod rewrite (11 files) and delete `cli/src/adapters/` (6 adapters).

**app** (independent of core; only needs `@assayer/shared`; after W5, W6, W7):
- AG1 bridge brokers `compiled-file/fetch`, `compiled-tree/fetch`, `run/execute`, `run/fetch-console` (4)
- AG2 `run/fetch-saved`, `status/fetch`, `stub-index/fetch`, `bindings/use-file-run` (4) then delete the 8 `assayer-bridge` adapters
- AG3 responders `explorer/page`, `shell/page`, `stubs/page` (react createElement) + `app/mount` (react-dom mount, CSS decision) + `widgets/code-viewer` (codemirror) (5)
- AG4 widgets with direct `react`/`@mantine/core` (10 widgets) and 4 bindings, `react-router-dom` (flow, shell): scripted swap to `#gateway/npm/*` (A18 -Z style), 3 batches
- AG5 `widgets/*.proxy.tsx` and tests with `@testing-library/*` (4 proxies + 1 test + the 3 testing-library adapters' 22 test/proxy callers) after W5
- AG6 e2e harnesses and specs (`@playwright/test` in 5 harnesses, node builtins in 7 harnesses, `e2e-global-build.ts` npm spawn) after W6; `document`/`location`/`globalThis` in 3 production files
- AG7 zod rewrite (10 files); delete `app/src/adapters/` (14).

**hydration-recipes**: nothing to migrate. Rename (P0-1) only.

### Phase 3: delete adapters, rules on

Remove every `adapters/` folder, the root barrels and package exports; fix `CLAUDE.md` and `packages/core/CLAUDE.md` text (no history language); run `npm run ward` and `npm run test:syntax`. The rules are already at `error`, so each package's scan must read zero before commit.

### Open decisions for the operator

1. Scope renaming direction (0.1).
2. How to re-home the analyzer's layer adapters (8.1) and the jest/probe adapters named in the shim (8.2): brokers? Core CLAUDE.md rewrite.
3. `@mantine/core/styles.css` (concession 9).
4. `typescript` as dependency vs peerDependency vs gateway (8.6).
5. Whether `core` published package should depend on gateway packages.
6. Whether scripted codemods are allowed (EPIC concession 11 allows scripted zod swaps if notated).

---------------------------------------------------------------------------------------------------

# APPENDIX A. Every adapter file, its callers (generated by adapters.py, name-match scan; approximate for names that are common words)


## app

- `assayer-bridge/get-compiled-file/assayer-bridge-get-compiled-file-adapter.ts` (assayerBridgeGetCompiledFileAdapter) raw imports: @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/compiled-file/fetch/compiled-file-fetch-broker.ts
- `assayer-bridge/get-compiled-tree/assayer-bridge-get-compiled-tree-adapter.ts` (assayerBridgeGetCompiledTreeAdapter) raw imports: @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/compiled-tree/fetch/compiled-tree-fetch-broker.ts
- `assayer-bridge/get-saved-console/assayer-bridge-get-saved-console-adapter.ts` (assayerBridgeGetSavedConsoleAdapter) raw imports: @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/run/fetch-console/run-fetch-console-broker.ts
- `assayer-bridge/get-saved-run/assayer-bridge-get-saved-run-adapter.ts` (assayerBridgeGetSavedRunAdapter) raw imports: @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/run/fetch-saved/run-fetch-saved-broker.ts
- `assayer-bridge/get-status/assayer-bridge-get-status-adapter.ts` (assayerBridgeGetStatusAdapter) raw imports: none; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/status/fetch/status-fetch-broker.ts
- `assayer-bridge/get-stubs/assayer-bridge-get-stubs-adapter.ts` (assayerBridgeGetStubsAdapter) raw imports: @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/stub-index/fetch/stub-index-fetch-broker.ts
- `assayer-bridge/on-run-output/assayer-bridge-on-run-output-adapter.ts` (assayerBridgeOnRunOutputAdapter) raw imports: none; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/bindings/use-file-run/use-file-run-binding.ts
- `assayer-bridge/run-file/assayer-bridge-run-file-adapter.ts` (assayerBridgeRunFileAdapter) raw imports: @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/brokers/run/execute/run-execute-broker.ts
- `codemirror/view/codemirror-view-adapter.ts` (codemirrorViewAdapter) raw imports: @codemirror/lang-javascript, @codemirror/view, @uiw/react-codemirror, react; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/widgets/code-viewer/code-viewer-widget.tsx
- `react-dom/mount/react-dom-mount-adapter.ts` (reactDomMountAdapter) raw imports: @dungeonmaster/shared/contracts, @mantine/core, @mantine/core/styles.css, react, react-dom/client; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/app/src/responders/app/mount/app-mount-responder.ts
- `react/create-element/react-create-element-adapter.ts` (reactCreateElementAdapter) raw imports: react; callers 6 (non-test/proxy 3, test/proxy 3)
    - packages/app/src/responders/explorer/page/explorer-page-responder.ts
    - packages/app/src/responders/stubs/page/stubs-page-responder.ts
    - packages/app/src/responders/shell/page/shell-page-responder.ts
    - plus 3 test/proxy files: app-mount-responder.test.ts, explorer-page-responder.test.ts, stubs-page-responder.test.ts
- `testing-library/render-hook/testing-library-render-hook-adapter.ts` (testingLibraryRenderHookAdapter) raw imports: @testing-library/react; callers 4 (non-test/proxy 0, test/proxy 4)
    - plus 4 test/proxy files: use-file-run-binding.test.ts, use-assayer-status-binding.test.ts, use-stub-index-binding.test.ts, use-compiled-tree-binding.test.ts
- `testing-library/render/testing-library-render-adapter.ts` (testingLibraryRenderAdapter) raw imports: @mantine/core, @testing-library/react, react; callers 12 (non-test/proxy 0, test/proxy 12)
    - plus 12 test/proxy files: run-console-widget.test.tsx, stub-repository-widget.test.tsx, code-viewer-widget.test.tsx, raw-blob-viewer-widget.test.tsx, app-shell-widget.test.tsx, explorer-header-widget.test.tsx, surface-explorer-widget.test.tsx, file-tree-node-layer-widget.test.tsx, file-tree-widget.test.tsx, detail-panel-widget.test.tsx, explorer-page-responder.test.ts, stubs-page-responder.test.ts
- `testing-library/wait-for/testing-library-wait-for-adapter.ts` (testingLibraryWaitForAdapter) raw imports: @dungeonmaster/shared/contracts, @testing-library/react; callers 6 (non-test/proxy 0, test/proxy 6)
    - plus 6 test/proxy files: use-file-run-binding.test.ts, use-assayer-status-binding.test.ts, use-stub-index-binding.test.ts, use-compiled-tree-binding.test.ts, stub-repository-widget.test.tsx, surface-explorer-widget.test.tsx

## cli

- `analyzer-roots/resolve/analyzer-roots-resolve-adapter.ts` (analyzerRootsResolveAdapter) raw imports: @assayer/core/contracts, fs, path; callers 4 (non-test/proxy 2, test/proxy 2)
    - packages/cli/src/responders/precheck/run/precheck-run-responder.ts
    - packages/cli/src/responders/unit/run/unit-run-responder.ts
    - plus 2 test/proxy files: precheck-run-responder.proxy.ts, unit-run-responder.proxy.ts
- `package-json/read/package-json-read-adapter.ts` (packageJsonReadAdapter) raw imports: fs/promises, path, zod; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/cli/src/responders/version/show/version-show-responder.ts
- `process-stdout/compile-progress/process-stdout-compile-progress-adapter.ts` (processStdoutCompileProgressAdapter) raw imports: @assayer/core/contracts, @assayer/shared/contracts; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/cli/src/responders/precheck/run/compile-run-layer-responder.ts
- `process-stdout/is-tty/process-stdout-is-tty-adapter.ts` (processStdoutIsTtyAdapter) raw imports: none; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/cli/src/responders/precheck/run/stable-branch-layer-responder.ts
- `readline/stable-branch-pick/readline-stable-branch-pick-adapter.ts` (readlineStableBranchPickAdapter) raw imports: @assayer/shared/contracts, readline; callers 2 (non-test/proxy 1, test/proxy 1)
    - packages/cli/src/responders/precheck/run/stable-branch-layer-responder.ts
    - plus 1 test/proxy files: stable-branch-layer-responder.proxy.ts
- `util/parse-args/util-parse-args-adapter.ts` (utilParseArgsAdapter) raw imports: node:util; callers 3 (non-test/proxy 2, test/proxy 1)
    - packages/cli/src/responders/detail/show/detail-show-responder.ts
    - packages/cli/src/responders/unit/run/unit-run-responder.ts
    - plus 1 test/proxy files: detail-show-responder.proxy.ts

## core

- `crypto/sha256/crypto-sha256-adapter.ts` (cryptoSha256Adapter) raw imports: @assayer/shared/contracts, node:crypto; callers 22 (non-test/proxy 15, test/proxy 7)
    - packages/core/test/harnesses/harness-graph.harness.ts
    - packages/core/test/harnesses/resolve-graph.harness.ts
    - packages/core/test/harnesses/example-resolution.harness.ts
    - packages/core/test/harnesses/stub-graph.harness.ts
    - packages/core/src/brokers/analyzer/hash/analyzer-hash-broker.ts
    - packages/core/src/brokers/stub/realize/stub-realize-broker.ts
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.ts
    - packages/core/src/brokers/compile/harness-graph/compile-harness-graph-broker.ts
    - packages/core/src/brokers/config/hash/config-hash-broker.ts
    - packages/core/src/brokers/run/id/run-id-broker.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
    - packages/core/src/brokers/run/cross-file-probes/run-cross-file-probes-broker.ts
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
    - plus 7 test/proxy files: compile-process-file-broker.test.ts, compile-resolve-graph-broker.test.ts, process-targets-layer-broker.test.ts, stable-namespace-layer-broker.test.ts, compile-run-broker.test.ts, run-unit-broker.test.ts, run-cross-file-probes-broker.test.ts
- `fs/exists-sync/fs-exists-sync-adapter.ts` (fsExistsSyncAdapter) raw imports: fs; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/src/brokers/harness/realize/harness-realize-broker.ts
- `fs/exists/fs-exists-adapter.ts` (fsExistsAdapter) raw imports: fs/promises; callers 15 (non-test/proxy 11, test/proxy 4)
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/manifest/load/manifest-load-broker.ts
    - packages/core/src/brokers/stub-overlay/load/stub-overlay-load-broker.ts
    - packages/core/src/brokers/config/find/config-find-broker.ts
    - packages/core/src/brokers/run/id/run-id-broker.ts
    - packages/core/src/brokers/run/find/run-find-broker.ts
    - packages/core/src/brokers/run/load/run-load-broker.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
    - packages/core/src/brokers/run/console-find/run-console-find-broker.ts
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
    - plus 4 test/proxy files: run-id-broker.proxy.ts, run-find-broker.proxy.ts, run-load-broker.proxy.ts, run-console-find-broker.proxy.ts
- `fs/find-up/fs-find-up-adapter.ts` (fsFindUpAdapter) raw imports: fs, path; callers 2 (non-test/proxy 1, test/proxy 1)
    - packages/core/src/brokers/run/paths/run-paths-broker.ts
    - plus 1 test/proxy files: run-paths-broker.proxy.ts
- `fs/mkdir/fs-mkdir-adapter.ts` (fsMkdirAdapter) raw imports: @dungeonmaster/shared/contracts, fs/promises; callers 10 (non-test/proxy 10, test/proxy 0)
    - packages/core/src/brokers/stub-index/write/stub-index-write-broker.ts
    - packages/core/src/brokers/harness-index/write/harness-index-write-broker.ts
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/manifest/write/manifest-write-broker.ts
    - packages/core/src/brokers/config/generate/config-generate-broker.ts
    - packages/core/src/brokers/run/console-save/run-console-save-broker.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
    - packages/core/src/brokers/resolved-index/write/resolved-index-write-broker.ts
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
- `fs/read-file-sync/fs-read-file-sync-adapter.ts` (fsReadFileSyncAdapter) raw imports: fs; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/core/src/brokers/resolve-sibling/callee/resolve-sibling-callee-broker.ts
    - packages/core/src/brokers/harness/realize/harness-realize-broker.ts
- `fs/read-file/fs-read-file-adapter.ts` (fsReadFileAdapter) raw imports: fs/promises; callers 34 (non-test/proxy 15, test/proxy 19)
    - packages/core/src/brokers/analyzer/hash/analyzer-hash-broker.ts
    - packages/core/src/brokers/compile/plan-current/compile-plan-current-broker.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.ts
    - packages/core/src/brokers/compile/stub-graph/compile-stub-graph-broker.ts
    - packages/core/src/brokers/compile/harness-graph/compile-harness-graph-broker.ts
    - packages/core/src/brokers/manifest/load/manifest-load-broker.ts
    - packages/core/src/brokers/stub-overlay/load/stub-overlay-load-broker.ts
    - packages/core/src/brokers/config/load/config-load-broker.ts
    - packages/core/src/brokers/run/paths/run-each-layer-broker.ts
    - packages/core/src/brokers/run/id/run-id-broker.ts
    - packages/core/src/brokers/run/find/run-find-broker.ts
    - packages/core/src/brokers/run/load/run-load-broker.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
    - packages/core/src/brokers/run/console-find/run-console-find-broker.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
    - plus 19 test/proxy files: analyzer-hash-broker.proxy.ts, analyzer-hash-broker.test.ts, compile-plan-current-broker.test.ts, compile-resolve-graph-broker.proxy.ts, compile-stub-graph-broker.proxy.ts, manifest-load-broker.test.ts, stub-overlay-load-broker.test.ts, config-load-broker.test.ts, run-each-layer-broker.proxy.ts, run-each-layer-broker.test.ts, run-id-broker.test.ts, run-id-broker.proxy.ts, run-find-broker.test.ts, run-find-broker.proxy.ts, run-load-broker.proxy.ts, run-load-broker.test.ts, run-unit-broker.test.ts, run-console-find-broker.proxy.ts, run-console-find-broker.test.ts
- `fs/readdir/fs-readdir-adapter.ts` (fsReaddirAdapter) raw imports: fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/src/brokers/compile/walk-working-tree/compile-walk-working-tree-broker.ts
- `fs/rename/fs-rename-adapter.ts` (fsRenameAdapter) raw imports: @dungeonmaster/shared/contracts, fs/promises; callers 7 (non-test/proxy 7, test/proxy 0)
    - packages/core/src/brokers/stub-index/write/stub-index-write-broker.ts
    - packages/core/src/brokers/harness-index/write/harness-index-write-broker.ts
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/manifest/write/manifest-write-broker.ts
    - packages/core/src/brokers/resolved-index/write/resolved-index-write-broker.ts
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
- `fs/rm/fs-rm-adapter.ts` (fsRmAdapter) raw imports: @dungeonmaster/shared/contracts, fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/src/brokers/manifest/trash/manifest-trash-broker.ts
- `fs/write-file/fs-write-file-adapter.ts` (fsWriteFileAdapter) raw imports: @dungeonmaster/shared/contracts, fs/promises; callers 12 (non-test/proxy 12, test/proxy 0)
    - packages/core/src/brokers/stub-index/write/stub-index-write-broker.ts
    - packages/core/src/brokers/harness-index/write/harness-index-write-broker.ts
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/manifest/write/manifest-write-broker.ts
    - packages/core/src/brokers/config/generate/config-generate-broker.ts
    - packages/core/src/brokers/config/stable-branch-save/config-stable-branch-save-broker.ts
    - packages/core/src/brokers/run/console-save/run-console-save-broker.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
    - packages/core/src/brokers/run/cross-file-probes/run-cross-file-probes-broker.ts
    - packages/core/src/brokers/resolved-index/write/resolved-index-write-broker.ts
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
- `git/exec/git-exec-adapter.ts` (gitExecAdapter) raw imports: node:child_process; callers 5 (non-test/proxy 5, test/proxy 0)
    - packages/core/src/brokers/git/resolve-commit/git-resolve-commit-broker.ts
    - packages/core/src/brokers/git/current-branch/git-current-branch-broker.ts
    - packages/core/src/brokers/git/ls-tree/git-ls-tree-broker.ts
    - packages/core/src/brokers/git/detect-stable-branch/git-detect-stable-branch-broker.ts
    - packages/core/src/brokers/git/cat-file/git-cat-file-broker.ts
- `jest/interpret-case/jest-interpret-case-adapter.ts` (jestInterpretCaseAdapter) raw imports: @assayer/shared/contracts; callers 6 (non-test/proxy 2, test/proxy 4)
    - packages/core/src/transformers/assemble-shim/assemble-shim-transformer.ts
    - packages/shared/src/transformers/arrange-text/arrange-text-transformer.ts
    - plus 4 test/proxy files: assemble-shim-transformer.test.ts, cause-arrange-transformer.test.ts, run-unit-broker.test.ts, unit-run-responder.test.ts
- `jest/probe-inject/jest-probe-inject-adapter.ts` (jestProbeInjectAdapter) raw imports: typescript; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/core/probe-transformer.js
    - packages/core/adapters.ts
- `jest/probe-inject/probe-visit-node-layer-adapter.ts` (probeVisitNodeLayerAdapter) raw imports: typescript; callers 0 (non-test/proxy 0, test/proxy 0)
- `jest/probe-runtime/jest-probe-runtime-adapter.ts` (jestProbeRuntimeAdapter) raw imports: @assayer/shared/contracts; callers 3 (non-test/proxy 2, test/proxy 1)
    - packages/core/probe-runtime.js
    - packages/core/src/contracts/probe-runtime/probe-runtime-contract.ts
    - plus 1 test/proxy files: unit-run-responder.test.ts
- `jest/resolve-entry/jest-resolve-entry-adapter.ts` (jestResolveEntryAdapter) raw imports: @assayer/shared/contracts; callers 3 (non-test/proxy 1, test/proxy 2)
    - packages/core/src/transformers/assemble-shim/assemble-shim-transformer.ts
    - plus 2 test/proxy files: assemble-shim-transformer.test.ts, run-unit-broker.test.ts
- `jest/run-cli/jest-run-cli-adapter.ts` (jestRunCliAdapter) raw imports: @jest/core, node:path; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
- `node-module/builtins/node-module-builtins-adapter.ts` (nodeModuleBuiltinsAdapter) raw imports: @assayer/shared/contracts, node:module; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/core/test/harnesses/syntax-traits.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.ts
- `path/basename/path-basename-adapter.ts` (pathBasenameAdapter) raw imports: node:path; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/core/src/brokers/compile/run/compile-run-broker.ts
    - packages/core/src/brokers/stub-overlay/load/stub-overlay-load-broker.ts
- `path/dirname/path-dirname-adapter.ts` (pathDirnameAdapter) raw imports: node:path; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/core/src/brokers/stub-overlay/load/stub-overlay-load-broker.ts
    - packages/core/src/brokers/config/find/config-find-broker.ts
- `path/relative/path-relative-adapter.ts` (pathRelativeAdapter) raw imports: @assayer/shared/contracts, node:path; callers 7 (non-test/proxy 5, test/proxy 2)
    - packages/core/src/brokers/analyzer/hash/analyzer-hash-broker.ts
    - packages/core/src/brokers/resolve-sibling/callee/resolve-sibling-callee-broker.ts
    - packages/core/src/brokers/compile/plan-current/compile-plan-current-broker.ts
    - packages/core/src/brokers/compile/resolve-graph/resolve-specifier-layer-broker.ts
    - packages/core/src/brokers/stub-overlay/load/stub-overlay-load-broker.ts
    - plus 2 test/proxy files: resolve-sibling-callee-broker.proxy.ts, resolve-specifier-layer-broker.proxy.ts
- `path/resolve/path-resolve-adapter.ts` (pathResolveAdapter) raw imports: node:path; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/src/brokers/compile/resolve-root/compile-resolve-root-broker.ts
- `ts-morph/read-external-signature/read-signature-type-layer-adapter.ts` (readSignatureTypeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/read-external-signature/ts-morph-read-external-signature-adapter.ts` (tsMorphReadExternalSignatureAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 2 (non-test/proxy 1, test/proxy 1)
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.ts
    - plus 1 test/proxy files: external-signature-read-broker.proxy.ts
- `ts-morph/read-global-signature/read-global-type-layer-adapter.ts` (readGlobalTypeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.ts` (tsMorphReadGlobalSignatureAdapter) raw imports: ${String(reference.specifier)}, @assayer/shared/contracts, node:path, ts-morph; callers 2 (non-test/proxy 1, test/proxy 1)
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.ts
    - plus 1 test/proxy files: external-signature-read-global-broker.proxy.ts
- `ts-morph/read-harness-value-types/read-harness-value-type-layer-adapter.ts` (readHarnessValueTypeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/read-harness-value-types/ts-morph-read-harness-value-types-adapter.ts` (tsMorphReadHarnessValueTypesAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/src/brokers/compile/harness-graph/compile-harness-graph-broker.ts
- `ts-morph/walk-file/derive-branch-id-layer-adapter.ts` (deriveBranchIdLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/desugar-switch-layer-adapter.ts` (desugarSwitchLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/dispatch-node-layer-adapter.ts` (dispatchNodeLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/flatten-short-circuit-layer-adapter.ts` (flattenShortCircuitLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-block-layer-adapter.ts` (handleBlockLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-call-layer-adapter.ts` (handleCallLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-class-layer-adapter.ts` (handleClassLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-dynamic-import-layer-adapter.ts` (handleDynamicImportLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-exit-layer-adapter.ts` (handleExitLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-export-layer-adapter.ts` (handleExportLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-function-layer-adapter.ts` (handleFunctionLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-if-layer-adapter.ts` (handleIfLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-import-layer-adapter.ts` (handleImportLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-member-access-layer-adapter.ts` (handleMemberAccessLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-source-file-layer-adapter.ts` (handleSourceFileLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-switch-layer-adapter.ts` (handleSwitchLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-type-declaration-layer-adapter.ts` (handleTypeDeclarationLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handle-variable-layer-adapter.ts` (handleVariableLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/handler-result-layer-adapter.ts` (handlerResultLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/project-node-layer-adapter.ts` (projectNodeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-accounted-layer-adapter.ts` (readAccountedLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-ambient-root-layer-adapter.ts` (readAmbientRootLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-call-args-layer-adapter.ts` (readCallArgsLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-callee-layer-adapter.ts` (readCalleeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-condition-layer-adapter.ts` (readConditionLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-condition-tree-layer-adapter.ts` (readConditionTreeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-conditional-exit-layer-adapter.ts` (readConditionalExitLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-const-operand-layer-adapter.ts` (readConstOperandLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-declared-type-text-layer-adapter.ts` (readDeclaredTypeTextLayerAdapter) raw imports: /abs/path/box, @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-entry-access-layer-adapter.ts` (readEntryAccessLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/core/test/harnesses/specimen-registry.ts
- `ts-morph/walk-file/read-env-operand-layer-adapter.ts` (readEnvOperandLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-export-flag-layer-adapter.ts` (readExportFlagLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-function-name-layer-adapter.ts` (readFunctionNameLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-module-export-layer-adapter.ts` (readModuleExportLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-nullish-leaf-layer-adapter.ts` (readNullishLeafLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-operand-type-layer-adapter.ts` (readOperandTypeLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-property-path-layer-adapter.ts` (readPropertyPathLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-terminal-layer-adapter.ts` (readTerminalLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-type-fact-layer-adapter.ts` (readTypeFactLayerAdapter) raw imports: @assayer/shared/contracts, ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/read-value-flow-exit-layer-adapter.ts` (readValueFlowExitLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/ts-morph-walk-file-adapter.ts` (tsMorphWalkFileAdapter) raw imports: ts-morph; callers 18 (non-test/proxy 10, test/proxy 8)
    - packages/core/adapters.ts
    - packages/core/test/harnesses/harness-graph.harness.ts
    - packages/core/test/harnesses/syntax-traits.ts
    - packages/core/src/transformers/declared-types-projection/declared-types-projection-transformer.ts
    - packages/core/src/brokers/resolve-sibling/callee/resolve-sibling-callee-broker.ts
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.ts
    - packages/core/src/brokers/analyze/extract/analyze-extract-broker.ts
    - packages/core/src/brokers/analyze/file/analyze-file-broker.ts
    - packages/desktop/src/brokers/compiled-file/resolve/compiled-file-resolve-broker.ts
    - plus 8 test/proxy files: stub-realize-broker.test.ts, compose-cross-file-map-broker.test.ts, compose-cross-file-predicates-broker.test.ts, resolve-type-ref-layer-broker.test.ts, param-type-resolve-broker.test.ts, harness-realize-broker.test.ts, run-cross-file-probes-broker.test.ts, analyze-file-broker.test.ts
- `ts-morph/walk-file/walk-facts-layer-adapter.ts` (walkFactsLayerAdapter) raw imports: none; callers 0 (non-test/proxy 0, test/proxy 0)
- `ts-morph/walk-file/walk-node-layer-adapter.ts` (walkNodeLayerAdapter) raw imports: ts-morph; callers 0 (non-test/proxy 0, test/proxy 0)
- `typescript/harness-gate/typescript-harness-gate-adapter.ts` (typescriptHarnessGateAdapter) raw imports: @assayer/core, @assayer/shared/contracts, typescript; callers 5 (non-test/proxy 5, test/proxy 0)
    - packages/core/test/harnesses/specimen-catalogue.ts
    - packages/core/src/brokers/harness/classify/harness-classify-broker.ts
    - packages/core/src/brokers/harness/realize/harness-realize-broker.ts
    - packages/core/src/brokers/run/id/run-id-broker.ts
    - packages/app/test/harnesses/syntax-surface.harness.ts
- `typescript/load-harness/typescript-load-harness-adapter.ts` (typescriptLoadHarnessAdapter) raw imports: @dungeonmaster/shared/contracts, fs, node:util, node:vm, typescript; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/core/src/brokers/harness/realize/harness-realize-broker.ts
    - packages/core/src/brokers/compile/harness-graph/compile-harness-graph-broker.ts
- `typescript/read-config/typescript-read-config-adapter.ts` (typescriptReadConfigAdapter) raw imports: @assayer/shared/contracts, node:crypto, node:path, typescript; callers 7 (non-test/proxy 6, test/proxy 1)
    - packages/core/src/brokers/stub/realize/stub-realize-broker.ts
    - packages/core/src/brokers/compose/cross-file-map/compose-cross-file-map-broker.ts
    - packages/core/src/brokers/compose/cross-file-predicates/compose-cross-file-predicates-broker.ts
    - packages/core/src/brokers/param-type/resolve/param-type-resolve-broker.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.ts
    - packages/core/src/brokers/run/cross-file-probes/run-cross-file-probes-broker.ts
    - plus 1 test/proxy files: compile-resolve-graph-broker.proxy.ts
- `typescript/resolve-module/typescript-resolve-module-adapter.ts` (typescriptResolveModuleAdapter) raw imports: typescript; callers 4 (non-test/proxy 2, test/proxy 2)
    - packages/core/src/brokers/resolve-sibling/callee/resolve-sibling-callee-broker.ts
    - packages/core/src/brokers/compile/resolve-graph/resolve-specifier-layer-broker.ts
    - plus 2 test/proxy files: resolve-sibling-callee-broker.proxy.ts, resolve-specifier-layer-broker.proxy.ts

## desktop

- `assayer-cli/entry-path/assayer-cli-entry-path-adapter.ts` (assayerCliEntryPathAdapter) raw imports: @assayer/core/contracts, node:fs, node:path; callers 2 (non-test/proxy 1, test/proxy 1)
    - packages/desktop/src/brokers/run/execute/run-execute-broker.ts
    - plus 1 test/proxy files: run-execute-broker.proxy.ts
- `electron/binary-path/electron-binary-path-adapter.ts` (electronBinaryPathAdapter) raw imports: electron; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/desktop/launch/desktop-launch-broker.ts
- `electron/desktop-boot/electron-desktop-boot-adapter.ts` (electronDesktopBootAdapter) raw imports: @assayer/shared/contracts, @dungeonmaster/shared/contracts, electron, node:path, node:url; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/responders/desktop-main/boot/desktop-main-boot-responder.ts
- `electron/main-entry-path/electron-main-entry-path-adapter.ts` (electronMainEntryPathAdapter) raw imports: node:path; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/desktop/launch/desktop-launch-broker.ts
- `electron/preload-bridge/electron-preload-bridge-adapter.ts` (electronPreloadBridgeAdapter) raw imports: @dungeonmaster/shared/contracts, electron; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/responders/desktop-preload/expose/desktop-preload-expose-responder.ts
- `electron/preload-bridge/reply-value-layer-adapter.ts` (replyValueLayerAdapter) raw imports: none; callers 0 (non-test/proxy 0, test/proxy 0)
- `node-child-process/exec/node-child-process-exec-adapter.ts` (nodeChildProcessExecAdapter) raw imports: node:child_process; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/run/execute/run-execute-broker.ts
- `node-child-process/spawn/node-child-process-spawn-adapter.ts` (nodeChildProcessSpawnAdapter) raw imports: @dungeonmaster/shared/contracts, node:child_process; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/desktop/launch/desktop-launch-broker.ts
- `node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter.ts` (nodeFsCacheManifestExistsAdapter) raw imports: node:fs/promises; callers 2 (non-test/proxy 2, test/proxy 0)
    - packages/desktop/src/brokers/stub-index/resolve/stub-index-resolve-broker.ts
    - packages/desktop/src/brokers/compiled-tree/resolve/compiled-tree-resolve-broker.ts
- `node-fs/read-cache-blob/node-fs-read-cache-blob-adapter.ts` (nodeFsReadCacheBlobAdapter) raw imports: node:fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/cache/load-blob/cache-load-blob-broker.ts
- `node-fs/read-cache-manifest/node-fs-read-cache-manifest-adapter.ts` (nodeFsReadCacheManifestAdapter) raw imports: node:fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/cache/load-manifest/cache-load-manifest-broker.ts
- `node-fs/read-resolved-index/node-fs-read-resolved-index-adapter.ts` (nodeFsReadResolvedIndexAdapter) raw imports: @assayer/shared/contracts, node:fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/cache/load-resolved-index/cache-load-resolved-index-broker.ts
- `node-fs/read-source/node-fs-read-source-adapter.ts` (nodeFsReadSourceAdapter) raw imports: @assayer/core/contracts, node:fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/compiled-file/resolve/compiled-file-resolve-broker.ts
- `node-fs/read-stub-index/node-fs-read-stub-index-adapter.ts` (nodeFsReadStubIndexAdapter) raw imports: @assayer/shared/contracts, node:fs/promises; callers 1 (non-test/proxy 1, test/proxy 0)
    - packages/desktop/src/brokers/cache/load-stub-index/cache-load-stub-index-broker.ts

# APPENDIX B. Raw npm and builtin imports, by package, kind and specifier (file lists)

Noise filtered: template-string and fixture specifiers dropped by a name-validity regex. In core, `left-pad`, `some-package`, `vendored-pkg`, `x`, `playwright`, `@playwright/test` hits are sample-source strings inside test fixtures, not real imports. `@dungeonmaster/*` toolkit imports are listed separately (allowed by raw-import-ban).


## desktop

### builtin|adapter
- node:child_process: 2 files
    - packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.ts
    - packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.ts
- node:fs: 1 files
    - packages/desktop/src/adapters/assayer-cli/entry-path/assayer-cli-entry-path-adapter.ts
- node:fs/promises: 6 files
    - packages/desktop/src/adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter.ts
    - packages/desktop/src/adapters/node-fs/read-cache-blob/node-fs-read-cache-blob-adapter.ts
    - packages/desktop/src/adapters/node-fs/read-cache-manifest/node-fs-read-cache-manifest-adapter.ts
    - packages/desktop/src/adapters/node-fs/read-resolved-index/node-fs-read-resolved-index-adapter.ts
    - packages/desktop/src/adapters/node-fs/read-source/node-fs-read-source-adapter.ts
    - packages/desktop/src/adapters/node-fs/read-stub-index/node-fs-read-stub-index-adapter.ts
- node:path: 3 files
    - packages/desktop/src/adapters/assayer-cli/entry-path/assayer-cli-entry-path-adapter.ts
    - packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts
    - packages/desktop/src/adapters/electron/main-entry-path/electron-main-entry-path-adapter.ts
- node:url: 1 files
    - packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts
### builtin|adapter-proxy
- node:child_process: 2 files
    - packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.proxy.ts
    - packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy.ts
- node:fs/promises: 6 files
    - packages/desktop/src/adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-cache-blob/node-fs-read-cache-blob-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-cache-manifest/node-fs-read-cache-manifest-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-resolved-index/node-fs-read-resolved-index-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-source/node-fs-read-source-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-stub-index/node-fs-read-stub-index-adapter.proxy.ts
### npm|adapter
- electron: 3 files
    - packages/desktop/src/adapters/electron/binary-path/electron-binary-path-adapter.ts
    - packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts
    - packages/desktop/src/adapters/electron/preload-bridge/electron-preload-bridge-adapter.ts
### npm|adapter-proxy
- electron: 3 files
    - packages/desktop/src/adapters/electron/binary-path/electron-binary-path-adapter.proxy.ts
    - packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.proxy.ts
    - packages/desktop/src/adapters/electron/preload-bridge/electron-preload-bridge-adapter.proxy.ts
### npm|prod
- zod: 6 files
    - packages/desktop/src/contracts/desktop-status/desktop-status-contract.ts
    - packages/desktop/src/contracts/exec-result/exec-result-contract.ts
    - packages/desktop/src/contracts/executable-path/executable-path-contract.ts
    - packages/desktop/src/contracts/ipc-reply/ipc-reply-contract.ts
    - packages/desktop/src/contracts/repo-path/repo-path-contract.ts
    - packages/desktop/src/contracts/tree-node-name/tree-node-name-contract.ts
### toolkit|adapter
- @dungeonmaster/shared/contracts: 3 files
    - packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts
    - packages/desktop/src/adapters/electron/preload-bridge/electron-preload-bridge-adapter.ts
    - packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.ts
### toolkit|adapter-proxy
- @dungeonmaster/testing/register-mock: 11 files
    - packages/desktop/src/adapters/electron/binary-path/electron-binary-path-adapter.proxy.ts
    - packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.proxy.ts
    - packages/desktop/src/adapters/electron/preload-bridge/electron-preload-bridge-adapter.proxy.ts
    - packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.proxy.ts
    - packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-cache-blob/node-fs-read-cache-blob-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-cache-manifest/node-fs-read-cache-manifest-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-resolved-index/node-fs-read-resolved-index-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-source/node-fs-read-source-adapter.proxy.ts
    - packages/desktop/src/adapters/node-fs/read-stub-index/node-fs-read-stub-index-adapter.proxy.ts
### toolkit|prod
- @dungeonmaster/shared/contracts: 8 files
    - packages/desktop/src/brokers/desktop/launch/desktop-launch-broker.ts
    - packages/desktop/src/contracts/ipc-reply/ipc-reply-contract.ts
    - packages/desktop/src/flows/desktop-main/desktop-main-flow.ts
    - packages/desktop/src/flows/desktop-preload/desktop-preload-flow.ts
    - packages/desktop/src/responders/desktop-main/boot/desktop-main-boot-responder.ts
    - packages/desktop/src/responders/desktop-preload/expose/desktop-preload-expose-responder.ts
    - packages/desktop/src/startup/start-desktop-main.ts
    - packages/desktop/src/startup/start-desktop-preload.ts
### toolkit|proxy
- @dungeonmaster/shared/contracts: 1 files
    - packages/desktop/src/brokers/repo/source-root/repo-source-root-broker.proxy.ts
- @dungeonmaster/testing/register-mock: 5 files
    - packages/desktop/src/brokers/compiled-file/resolve/compiled-file-resolve-broker.proxy.ts
    - packages/desktop/src/brokers/repo/source-root/repo-source-root-broker.proxy.ts
    - packages/desktop/src/brokers/run/execute/run-execute-broker.proxy.ts
    - packages/desktop/src/brokers/status/resolve/status-resolve-broker.proxy.ts
    - packages/desktop/src/brokers/stub-index/resolve/stub-index-resolve-broker.proxy.ts
### toolkit|stub
- @dungeonmaster/shared/@types: 2 files
    - packages/desktop/src/contracts/desktop-status/desktop-status.stub.ts
    - packages/desktop/src/contracts/exec-result/exec-result.stub.ts

## hydration-recipes

### toolkit|config
- @dungeonmaster/testing/jest-config-base: 1 files
    - packages/hydration-recipes/jest.config.js

## cli

### builtin|adapter
- fs: 1 files
    - packages/cli/src/adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter.ts
- fs/promises: 1 files
    - packages/cli/src/adapters/package-json/read/package-json-read-adapter.ts
- node:util: 1 files
    - packages/cli/src/adapters/util/parse-args/util-parse-args-adapter.ts
- path: 2 files
    - packages/cli/src/adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter.ts
    - packages/cli/src/adapters/package-json/read/package-json-read-adapter.ts
- readline: 1 files
    - packages/cli/src/adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter.ts
### builtin|adapter-proxy
- fs/promises: 1 files
    - packages/cli/src/adapters/package-json/read/package-json-read-adapter.proxy.ts
- readline: 1 files
    - packages/cli/src/adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter.proxy.ts
### builtin|harness
- node:child_process: 2 files
    - packages/cli/test/harnesses/assayer-cli.harness.ts
    - packages/cli/test/harnesses/assayer-compile.harness.ts
- node:fs: 2 files
    - packages/cli/test/harnesses/assayer-cli.harness.ts
    - packages/cli/test/harnesses/assayer-compile.harness.ts
- node:os: 2 files
    - packages/cli/test/harnesses/assayer-cli.harness.ts
    - packages/cli/test/harnesses/assayer-compile.harness.ts
- node:path: 2 files
    - packages/cli/test/harnesses/assayer-cli.harness.ts
    - packages/cli/test/harnesses/assayer-compile.harness.ts
### npm|adapter
- zod: 1 files
    - packages/cli/src/adapters/package-json/read/package-json-read-adapter.ts
### npm|prod
- zod: 10 files
    - packages/cli/src/contracts/admission-line/admission-line-contract.ts
    - packages/cli/src/contracts/assayer-version/assayer-version-contract.ts
    - packages/cli/src/contracts/cli-command/cli-command-contract.ts
    - packages/cli/src/contracts/cli-error-message/cli-error-message-contract.ts
    - packages/cli/src/contracts/cli-file-text/cli-file-text-contract.ts
    - packages/cli/src/contracts/cli-output/cli-output-contract.ts
    - packages/cli/src/contracts/cli-positional/cli-positional-contract.ts
    - packages/cli/src/contracts/cli-run-result/cli-run-result-contract.ts
    - packages/cli/src/contracts/progress-bar-line/progress-bar-line-contract.ts
    - packages/cli/src/contracts/zod-issue-list/zod-issue-list-contract.ts
### toolkit|adapter-proxy
- @dungeonmaster/testing/register-mock: 3 files
    - packages/cli/src/adapters/package-json/read/package-json-read-adapter.proxy.ts
    - packages/cli/src/adapters/process-stdout/compile-progress/process-stdout-compile-progress-adapter.proxy.ts
    - packages/cli/src/adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter.proxy.ts
### toolkit|prod
- @dungeonmaster/shared/adapters: 1 files
    - packages/cli/bin/assayer.ts
### toolkit|proxy
- @dungeonmaster/shared/contracts: 2 files
    - packages/cli/src/responders/precheck/run/compile-run-layer-responder.proxy.ts
    - packages/cli/src/responders/precheck/run/config-resolve-layer-responder.proxy.ts
- @dungeonmaster/testing/register-mock: 6 files
    - packages/cli/src/responders/detail/show/detail-show-responder.proxy.ts
    - packages/cli/src/responders/precheck/run/compile-run-layer-responder.proxy.ts
    - packages/cli/src/responders/precheck/run/config-resolve-layer-responder.proxy.ts
    - packages/cli/src/responders/precheck/run/precheck-run-responder.proxy.ts
    - packages/cli/src/responders/precheck/run/stable-branch-layer-responder.proxy.ts
    - packages/cli/src/responders/unit/run/unit-run-responder.proxy.ts
### toolkit|stub
- @dungeonmaster/shared/@types: 2 files
    - packages/cli/src/contracts/cli-run-result/cli-run-result.stub.ts
    - packages/cli/src/contracts/zod-issue-list/zod-issue-list.stub.ts

## app

### builtin|config
- path: 1 files
    - packages/app/jest.config.js
### builtin|harness
- node:child_process: 1 files
    - packages/app/test/harnesses/smoke-cache.harness.ts
- node:fs: 6 files
    - packages/app/test/harnesses/cache-only-source-app.harness.ts
    - packages/app/test/harnesses/empty-surface-app.harness.ts
    - packages/app/test/harnesses/no-cache-app.harness.ts
    - packages/app/test/harnesses/smoke-cache.harness.ts
    - packages/app/test/harnesses/syntax-surface.harness.ts
    - packages/app/test/harnesses/unresolvable-namespace-app.harness.ts
- node:os: 5 files
    - packages/app/test/harnesses/cache-only-source-app.harness.ts
    - packages/app/test/harnesses/empty-surface-app.harness.ts
    - packages/app/test/harnesses/no-cache-app.harness.ts
    - packages/app/test/harnesses/smoke-cache.harness.ts
    - packages/app/test/harnesses/unresolvable-namespace-app.harness.ts
- node:path: 6 files
    - packages/app/test/harnesses/cache-only-source-app.harness.ts
    - packages/app/test/harnesses/empty-surface-app.harness.ts
    - packages/app/test/harnesses/no-cache-app.harness.ts
    - packages/app/test/harnesses/smoke-cache.harness.ts
    - packages/app/test/harnesses/syntax-surface.harness.ts
    - packages/app/test/harnesses/unresolvable-namespace-app.harness.ts
### builtin|test
- node:child_process: 1 files
    - packages/app/test/e2e-global-build.ts
- node:path: 2 files
    - packages/app/src/main.test.tsx
    - packages/app/test/e2e-global-build.ts
### npm|adapter
- @codemirror/lang-javascript: 1 files
    - packages/app/src/adapters/codemirror/view/codemirror-view-adapter.ts
- @codemirror/view: 1 files
    - packages/app/src/adapters/codemirror/view/codemirror-view-adapter.ts
- @mantine/core: 2 files
    - packages/app/src/adapters/react-dom/mount/react-dom-mount-adapter.ts
    - packages/app/src/adapters/testing-library/render/testing-library-render-adapter.ts
- @testing-library/react: 3 files
    - packages/app/src/adapters/testing-library/render-hook/testing-library-render-hook-adapter.ts
    - packages/app/src/adapters/testing-library/render/testing-library-render-adapter.ts
    - packages/app/src/adapters/testing-library/wait-for/testing-library-wait-for-adapter.ts
- @uiw/react-codemirror: 1 files
    - packages/app/src/adapters/codemirror/view/codemirror-view-adapter.ts
- react: 4 files
    - packages/app/src/adapters/codemirror/view/codemirror-view-adapter.ts
    - packages/app/src/adapters/react-dom/mount/react-dom-mount-adapter.ts
    - packages/app/src/adapters/react/create-element/react-create-element-adapter.ts
    - packages/app/src/adapters/testing-library/render/testing-library-render-adapter.ts
- react-dom: 1 files
    - packages/app/src/adapters/react-dom/mount/react-dom-mount-adapter.ts
### npm|adapter-test
- @testing-library/react: 1 files
    - packages/app/src/adapters/codemirror/view/codemirror-view-adapter.test.ts
- react: 2 files
    - packages/app/src/adapters/react-dom/mount/react-dom-mount-adapter.test.ts
    - packages/app/src/adapters/testing-library/render/testing-library-render-adapter.test.ts
### npm|config
- @playwright/test: 1 files
    - packages/app/playwright.config.ts
- @vitejs/plugin-react: 1 files
    - packages/app/vite.config.ts
- vite: 1 files
    - packages/app/vite.config.ts
### npm|harness
- @playwright/test: 5 files
    - packages/app/test/harnesses/cache-only-source-app.harness.ts
    - packages/app/test/harnesses/e2e-fixtures.ts
    - packages/app/test/harnesses/empty-surface-app.harness.ts
    - packages/app/test/harnesses/no-cache-app.harness.ts
    - packages/app/test/harnesses/unresolvable-namespace-app.harness.ts
### npm|prod
- @mantine/core: 10 files
    - packages/app/src/widgets/app-shell/app-shell-widget.tsx
    - packages/app/src/widgets/code-viewer/code-viewer-widget.tsx
    - packages/app/src/widgets/detail-panel/detail-panel-widget.tsx
    - packages/app/src/widgets/explorer-header/explorer-header-widget.tsx
    - packages/app/src/widgets/file-tree/file-tree-node-layer-widget.tsx
    - packages/app/src/widgets/file-tree/file-tree-widget.tsx
    - packages/app/src/widgets/raw-blob-viewer/raw-blob-viewer-widget.tsx
    - packages/app/src/widgets/run-console/run-console-widget.tsx
    - packages/app/src/widgets/stub-repository/stub-repository-widget.tsx
    - packages/app/src/widgets/surface-explorer/surface-explorer-widget.tsx
- react: 14 files
    - packages/app/src/bindings/use-assayer-status/use-assayer-status-binding.ts
    - packages/app/src/bindings/use-compiled-tree/use-compiled-tree-binding.ts
    - packages/app/src/bindings/use-file-run/use-file-run-binding.ts
    - packages/app/src/bindings/use-stub-index/use-stub-index-binding.ts
    - packages/app/src/widgets/app-shell/app-shell-widget.tsx
    - packages/app/src/widgets/code-viewer/code-viewer-widget.tsx
    - packages/app/src/widgets/detail-panel/detail-panel-widget.tsx
    - packages/app/src/widgets/explorer-header/explorer-header-widget.tsx
    - packages/app/src/widgets/file-tree/file-tree-node-layer-widget.tsx
    - packages/app/src/widgets/file-tree/file-tree-widget.tsx
    - packages/app/src/widgets/raw-blob-viewer/raw-blob-viewer-widget.tsx
    - packages/app/src/widgets/run-console/run-console-widget.tsx
    - packages/app/src/widgets/stub-repository/stub-repository-widget.tsx
    - packages/app/src/widgets/surface-explorer/surface-explorer-widget.tsx
- react-router-dom: 2 files
    - packages/app/src/flows/app/app-flow.tsx
    - packages/app/src/widgets/app-shell/app-shell-widget.tsx
- zod: 10 files
    - packages/app/src/contracts/case-run-status/case-run-status-contract.ts
    - packages/app/src/contracts/dark-spot-line/dark-spot-line-contract.ts
    - packages/app/src/contracts/exit-code/exit-code-contract.ts
    - packages/app/src/contracts/flat-property-demand/flat-property-demand-contract.ts
    - packages/app/src/contracts/gutter-marker/gutter-marker-contract.ts
    - packages/app/src/contracts/resolved-contract-view/resolved-contract-view-contract.ts
    - packages/app/src/contracts/resolved-edge-line/resolved-edge-line-contract.ts
    - packages/app/src/contracts/run-console-status/run-console-status-contract.ts
    - packages/app/src/contracts/status-view/status-view-contract.ts
    - packages/app/src/contracts/undriven-line/undriven-line-contract.ts
### npm|proxy
- @testing-library/react: 4 files
    - packages/app/src/widgets/detail-panel/detail-panel-widget.proxy.tsx
    - packages/app/src/widgets/file-tree/file-tree-node-layer-widget.proxy.tsx
    - packages/app/src/widgets/file-tree/file-tree-widget.proxy.tsx
    - packages/app/src/widgets/surface-explorer/surface-explorer-widget.proxy.tsx
- @testing-library/user-event: 4 files
    - packages/app/src/widgets/detail-panel/detail-panel-widget.proxy.tsx
    - packages/app/src/widgets/file-tree/file-tree-node-layer-widget.proxy.tsx
    - packages/app/src/widgets/file-tree/file-tree-widget.proxy.tsx
    - packages/app/src/widgets/surface-explorer/surface-explorer-widget.proxy.tsx
### npm|test
- @testing-library/user-event: 1 files
    - packages/app/src/widgets/detail-panel/detail-panel-widget.test.tsx
- react-router-dom: 1 files
    - packages/app/src/widgets/app-shell/app-shell-widget.test.tsx
### toolkit|adapter
- @dungeonmaster/shared/contracts: 2 files
    - packages/app/src/adapters/react-dom/mount/react-dom-mount-adapter.ts
    - packages/app/src/adapters/testing-library/wait-for/testing-library-wait-for-adapter.ts
### toolkit|adapter-proxy
- @dungeonmaster/shared/contracts: 1 files
    - packages/app/src/adapters/assayer-bridge/run-file/assayer-bridge-run-file-adapter.proxy.ts
### toolkit|harness
- @dungeonmaster/shared/contracts: 1 files
    - packages/app/test/harnesses/e2e-fixtures.ts
### toolkit|prod
- @dungeonmaster/shared/contracts: 3 files
    - packages/app/src/flows/app-mount/app-mount-flow.tsx
    - packages/app/src/responders/app/mount/app-mount-responder.ts
    - packages/app/src/startup/start-app.ts
### toolkit|proxy
- @dungeonmaster/testing/register-mock: 1 files
    - packages/app/src/widgets/surface-explorer/surface-explorer-widget.proxy.tsx
### toolkit|stub
- @dungeonmaster/shared/@types: 4 files
    - packages/app/src/contracts/flat-property-demand/flat-property-demand.stub.ts
    - packages/app/src/contracts/gutter-marker/gutter-marker.stub.ts
    - packages/app/src/contracts/resolved-contract-view/resolved-contract-view.stub.ts
    - packages/app/src/contracts/status-view/status-view.stub.ts

## core

### builtin|adapter
- fs: 4 files
    - packages/core/src/adapters/fs/exists-sync/fs-exists-sync-adapter.ts
    - packages/core/src/adapters/fs/find-up/fs-find-up-adapter.ts
    - packages/core/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.ts
    - packages/core/src/adapters/typescript/load-harness/typescript-load-harness-adapter.ts
- fs/promises: 7 files
    - packages/core/src/adapters/fs/exists/fs-exists-adapter.ts
    - packages/core/src/adapters/fs/mkdir/fs-mkdir-adapter.ts
    - packages/core/src/adapters/fs/read-file/fs-read-file-adapter.ts
    - packages/core/src/adapters/fs/readdir/fs-readdir-adapter.ts
    - packages/core/src/adapters/fs/rename/fs-rename-adapter.ts
    - packages/core/src/adapters/fs/rm/fs-rm-adapter.ts
    - packages/core/src/adapters/fs/write-file/fs-write-file-adapter.ts
- node:child_process: 1 files
    - packages/core/src/adapters/git/exec/git-exec-adapter.ts
- node:crypto: 2 files
    - packages/core/src/adapters/crypto/sha256/crypto-sha256-adapter.ts
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.ts
- node:module: 1 files
    - packages/core/src/adapters/node-module/builtins/node-module-builtins-adapter.ts
- node:path: 7 files
    - packages/core/src/adapters/jest/run-cli/jest-run-cli-adapter.ts
    - packages/core/src/adapters/path/basename/path-basename-adapter.ts
    - packages/core/src/adapters/path/dirname/path-dirname-adapter.ts
    - packages/core/src/adapters/path/relative/path-relative-adapter.ts
    - packages/core/src/adapters/path/resolve/path-resolve-adapter.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.ts
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.ts
- node:util: 1 files
    - packages/core/src/adapters/typescript/load-harness/typescript-load-harness-adapter.ts
- node:vm: 1 files
    - packages/core/src/adapters/typescript/load-harness/typescript-load-harness-adapter.ts
- path: 1 files
    - packages/core/src/adapters/fs/find-up/fs-find-up-adapter.ts
### builtin|adapter-proxy
- fs: 2 files
    - packages/core/src/adapters/fs/exists-sync/fs-exists-sync-adapter.proxy.ts
    - packages/core/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy.ts
- fs/promises: 7 files
    - packages/core/src/adapters/fs/exists/fs-exists-adapter.proxy.ts
    - packages/core/src/adapters/fs/mkdir/fs-mkdir-adapter.proxy.ts
    - packages/core/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts
    - packages/core/src/adapters/fs/readdir/fs-readdir-adapter.proxy.ts
    - packages/core/src/adapters/fs/rename/fs-rename-adapter.proxy.ts
    - packages/core/src/adapters/fs/rm/fs-rm-adapter.proxy.ts
    - packages/core/src/adapters/fs/write-file/fs-write-file-adapter.proxy.ts
- node:child_process: 1 files
    - packages/core/src/adapters/git/exec/git-exec-adapter.proxy.ts
### builtin|adapter-test
- fs: 1 files
    - packages/core/src/adapters/ts-morph/walk-file/read-callee-layer-adapter.test.ts
- node:crypto: 1 files
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.test.ts
- node:fs: 5 files
    - packages/core/src/adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter.test.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.test.ts
    - packages/core/src/adapters/typescript/load-harness/typescript-load-harness-adapter.test.ts
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.test.ts
    - packages/core/src/adapters/typescript/resolve-module/typescript-resolve-module-adapter.test.ts
- node:os: 4 files
    - packages/core/src/adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter.test.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.test.ts
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.test.ts
    - packages/core/src/adapters/typescript/resolve-module/typescript-resolve-module-adapter.test.ts
- node:path: 6 files
    - packages/core/src/adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter.test.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/dispatch-node-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-variable-layer-adapter.test.ts
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.test.ts
    - packages/core/src/adapters/typescript/resolve-module/typescript-resolve-module-adapter.test.ts
### builtin|harness
- node:fs: 8 files
    - packages/core/test/harnesses/example-resolution.harness.ts
    - packages/core/test/harnesses/harness-graph.harness.ts
    - packages/core/test/harnesses/resolve-graph.harness.ts
    - packages/core/test/harnesses/run-find.harness.ts
    - packages/core/test/harnesses/run-unit.harness.ts
    - packages/core/test/harnesses/specimen-catalogue.ts
    - packages/core/test/harnesses/stub-graph.harness.ts
    - packages/core/test/harnesses/syntax-traits.ts
- node:os: 6 files
    - packages/core/test/harnesses/example-resolution.harness.ts
    - packages/core/test/harnesses/harness-graph.harness.ts
    - packages/core/test/harnesses/resolve-graph.harness.ts
    - packages/core/test/harnesses/run-find.harness.ts
    - packages/core/test/harnesses/run-unit.harness.ts
    - packages/core/test/harnesses/stub-graph.harness.ts
- node:path: 8 files
    - packages/core/test/harnesses/example-resolution.harness.ts
    - packages/core/test/harnesses/harness-graph.harness.ts
    - packages/core/test/harnesses/resolve-graph.harness.ts
    - packages/core/test/harnesses/run-find.harness.ts
    - packages/core/test/harnesses/run-unit.harness.ts
    - packages/core/test/harnesses/specimen-catalogue.ts
    - packages/core/test/harnesses/stub-graph.harness.ts
    - packages/core/test/harnesses/syntax-traits.ts
### builtin|prod
- node:crypto: 1 files
    - packages/core/probe-transformer.js
- node:fs: 2 files
    - packages/core/probe-transformer.js
    - packages/core/src/transformers/assemble-shim/assemble-shim-transformer.ts
- node:path: 2 files
    - packages/core/probe-transformer.js
    - packages/core/src/transformers/assemble-shim/assemble-shim-transformer.ts
### builtin|test
- node:fs: 4 files
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.integration.test.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.test.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.test.ts
    - packages/core/src/transformers/assemble-shim/assemble-shim-transformer.test.ts
- node:path: 2 files
    - packages/core/src/brokers/run/unit/run-unit-broker.test.ts
    - packages/core/src/transformers/assemble-shim/assemble-shim-transformer.test.ts
### npm|adapter
- @jest/core: 1 files
    - packages/core/src/adapters/jest/run-cli/jest-run-cli-adapter.ts
- ts-morph: 48 files
    - packages/core/src/adapters/ts-morph/read-external-signature/read-signature-type-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/read-global-type-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter.ts
    - packages/core/src/adapters/ts-morph/read-harness-value-types/read-harness-value-type-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/read-harness-value-types/ts-morph-read-harness-value-types-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/derive-branch-id-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/desugar-switch-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/dispatch-node-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/flatten-short-circuit-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-block-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-call-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-class-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-dynamic-import-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-exit-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-export-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-function-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-if-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-import-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-member-access-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-source-file-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-switch-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-type-declaration-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-variable-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/handler-result-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/project-node-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-accounted-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-ambient-root-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-call-args-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-callee-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-condition-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-condition-tree-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-conditional-exit-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-const-operand-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-declared-type-text-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-entry-access-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-env-operand-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-export-flag-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-function-name-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-module-export-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-nullish-leaf-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-operand-type-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-property-path-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-terminal-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-type-fact-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-value-flow-exit-layer-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/ts-morph-walk-file-adapter.ts
    - packages/core/src/adapters/ts-morph/walk-file/walk-node-layer-adapter.ts
- typescript: 6 files
    - packages/core/src/adapters/jest/probe-inject/jest-probe-inject-adapter.ts
    - packages/core/src/adapters/jest/probe-inject/probe-visit-node-layer-adapter.ts
    - packages/core/src/adapters/typescript/harness-gate/typescript-harness-gate-adapter.ts
    - packages/core/src/adapters/typescript/load-harness/typescript-load-harness-adapter.ts
    - packages/core/src/adapters/typescript/read-config/typescript-read-config-adapter.ts
    - packages/core/src/adapters/typescript/resolve-module/typescript-resolve-module-adapter.ts
### npm|adapter-proxy
- @jest/core: 1 files
    - packages/core/src/adapters/jest/run-cli/jest-run-cli-adapter.proxy.ts
### npm|adapter-test
- playwright: 1 files
    - packages/core/src/adapters/typescript/harness-gate/typescript-harness-gate-adapter.test.ts
- ts-morph: 43 files
    - packages/core/src/adapters/ts-morph/read-external-signature/read-signature-type-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/read-global-signature/read-global-type-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/read-harness-value-types/read-harness-value-type-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/derive-branch-id-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/desugar-switch-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/dispatch-node-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/flatten-short-circuit-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-block-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-call-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-class-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-dynamic-import-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-exit-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-export-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-function-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-if-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-import-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-member-access-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-source-file-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-switch-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-type-declaration-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/handle-variable-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/project-node-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-accounted-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-ambient-root-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-call-args-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-callee-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-condition-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-condition-tree-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-conditional-exit-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-const-operand-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-declared-type-text-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-entry-access-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-env-operand-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-export-flag-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-function-name-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-module-export-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-nullish-leaf-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-operand-type-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-property-path-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-terminal-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-type-fact-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/read-value-flow-exit-layer-adapter.test.ts
    - packages/core/src/adapters/ts-morph/walk-file/walk-node-layer-adapter.test.ts
- typescript: 3 files
    - packages/core/src/adapters/jest/probe-inject/jest-probe-inject-adapter.test.ts
    - packages/core/src/adapters/jest/probe-inject/probe-visit-node-layer-adapter.test.ts
    - packages/core/src/adapters/typescript/resolve-module/typescript-resolve-module-adapter.test.ts
- vendored-pkg: 1 files
    - packages/core/src/adapters/typescript/resolve-module/typescript-resolve-module-adapter.test.ts
- x: 1 files
    - packages/core/src/adapters/fs/write-file/fs-write-file-adapter.test.ts
### npm|harness
- ts-morph: 1 files
    - packages/core/test/harnesses/specimen-catalogue.ts
- vendored-pkg: 1 files
    - packages/core/test/harnesses/resolve-graph.harness.ts
### npm|prod
- zod: 41 files
    - packages/core/src/contracts/analysis-extract-result/analysis-extract-result-contract.ts
    - packages/core/src/contracts/arm-values/arm-values-contract.ts
    - packages/core/src/contracts/ast-projection/ast-projection-contract.ts
    - packages/core/src/contracts/call-site/call-site-contract.ts
    - packages/core/src/contracts/case-set/case-set-contract.ts
    - packages/core/src/contracts/case-signature/case-signature-contract.ts
    - packages/core/src/contracts/compile-progress-event/compile-progress-event-contract.ts
    - packages/core/src/contracts/condition-cause/condition-cause-contract.ts
    - packages/core/src/contracts/declared-shape/declared-shape-contract.ts
    - packages/core/src/contracts/dir-entry/dir-entry-contract.ts
    - packages/core/src/contracts/extracted-function/extracted-function-contract.ts
    - packages/core/src/contracts/file-contents/file-contents-contract.ts
    - packages/core/src/contracts/file-index-entry/file-index-entry-contract.ts
    - packages/core/src/contracts/file-path/file-path-contract.ts
    - packages/core/src/contracts/git-exec-result/git-exec-result-contract.ts
    - packages/core/src/contracts/harness-declaration/harness-declaration-contract.ts
    - packages/core/src/contracts/invoked-fn/invoked-fn-contract.ts
    - packages/core/src/contracts/map-extract-result/map-extract-result-contract.ts
    - packages/core/src/contracts/normalized-source/normalized-source-contract.ts
    - packages/core/src/contracts/ordered-bounds/ordered-bounds-contract.ts
    - packages/core/src/contracts/predicted-output/predicted-output-contract.ts
    - packages/core/src/contracts/probe-plan/probe-plan-contract.ts
    - packages/core/src/contracts/probe-runtime/probe-runtime-contract.ts
    - packages/core/src/contracts/probe-site/probe-site-contract.ts
    - packages/core/src/contracts/property-guard/property-guard-contract.ts
    - packages/core/src/contracts/run-verdict/run-verdict-contract.ts
    - packages/core/src/contracts/scope-record/scope-record-contract.ts
    - packages/core/src/contracts/shim-source/shim-source-contract.ts
    - packages/core/src/contracts/source-position/source-position-contract.ts
    - packages/core/src/contracts/string-length/string-length-contract.ts
    - packages/core/src/contracts/stub-overlay-env-file/stub-overlay-env-file-contract.ts
    - packages/core/src/contracts/stub-overlay-object-file/stub-overlay-object-file-contract.ts
    - packages/core/src/contracts/test-path-pattern/test-path-pattern-contract.ts
    - packages/core/src/contracts/type-fact/type-fact-contract.ts
    - packages/core/src/contracts/undriven-cause/undriven-cause-contract.ts
    - packages/core/src/contracts/value-domain/value-domain-contract.ts
    - packages/core/src/contracts/value-use/value-use-contract.ts
    - packages/core/src/contracts/walk-context/walk-context-contract.ts
    - packages/core/src/contracts/walk-facts/walk-facts-contract.ts
    - packages/core/src/contracts/walk-file-result/walk-file-result-contract.ts
    - packages/core/src/contracts/walk-node/walk-node-contract.ts
### npm|test
- @playwright/test: 1 files
    - packages/core/src/brokers/harness/realize/harness-realize-broker.test.ts
- left-pad: 1 files
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.test.ts
- playwright: 2 files
    - packages/core/src/brokers/compile/plan-current/compile-plan-current-broker.test.ts
    - packages/core/src/brokers/harness/classify/harness-classify-broker.test.ts
- some-package: 1 files
    - packages/core/src/brokers/param-type/resolve/param-type-resolve-broker.test.ts
### toolkit|adapter
- @dungeonmaster/shared/contracts: 5 files
    - packages/core/src/adapters/fs/mkdir/fs-mkdir-adapter.ts
    - packages/core/src/adapters/fs/rename/fs-rename-adapter.ts
    - packages/core/src/adapters/fs/rm/fs-rm-adapter.ts
    - packages/core/src/adapters/fs/write-file/fs-write-file-adapter.ts
    - packages/core/src/adapters/typescript/load-harness/typescript-load-harness-adapter.ts
### toolkit|adapter-proxy
- @dungeonmaster/testing/register-mock: 11 files
    - packages/core/src/adapters/fs/exists-sync/fs-exists-sync-adapter.proxy.ts
    - packages/core/src/adapters/fs/exists/fs-exists-adapter.proxy.ts
    - packages/core/src/adapters/fs/mkdir/fs-mkdir-adapter.proxy.ts
    - packages/core/src/adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy.ts
    - packages/core/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts
    - packages/core/src/adapters/fs/readdir/fs-readdir-adapter.proxy.ts
    - packages/core/src/adapters/fs/rename/fs-rename-adapter.proxy.ts
    - packages/core/src/adapters/fs/rm/fs-rm-adapter.proxy.ts
    - packages/core/src/adapters/fs/write-file/fs-write-file-adapter.proxy.ts
    - packages/core/src/adapters/git/exec/git-exec-adapter.proxy.ts
    - packages/core/src/adapters/jest/run-cli/jest-run-cli-adapter.proxy.ts
### toolkit|harness
- @dungeonmaster/shared/contracts: 2 files
    - packages/core/test/harnesses/harness-graph.harness.ts
    - packages/core/test/harnesses/specimen-catalogue.ts
### toolkit|prod
- @dungeonmaster/shared/contracts: 19 files
    - packages/core/src/brokers/compile/harness-graph/compile-harness-graph-broker.ts
    - packages/core/src/brokers/compile/process-file/compile-process-file-broker.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.ts
    - packages/core/src/brokers/compile/run/process-targets-layer-broker.ts
    - packages/core/src/brokers/compile/run/stable-namespace-layer-broker.ts
    - packages/core/src/brokers/config/load/config-load-broker.ts
    - packages/core/src/brokers/config/validate/config-validate-broker.ts
    - packages/core/src/brokers/git/ls-tree/git-ls-tree-broker.ts
    - packages/core/src/brokers/git/resolve-commit/git-resolve-commit-broker.ts
    - packages/core/src/brokers/harness-index/write/harness-index-write-broker.ts
    - packages/core/src/brokers/manifest/load/manifest-load-broker.ts
    - packages/core/src/brokers/manifest/trash/manifest-trash-broker.ts
    - packages/core/src/brokers/manifest/write/manifest-write-broker.ts
    - packages/core/src/brokers/resolved-index/write/resolved-index-write-broker.ts
    - packages/core/src/brokers/run/console-save/run-console-save-broker.ts
    - packages/core/src/brokers/stub-index/write/stub-index-write-broker.ts
    - packages/core/src/brokers/stub-overlay/reconcile/stub-overlay-reconcile-broker.ts
    - packages/core/src/transformers/harness-validate/harness-validate-transformer.ts
    - packages/core/src/transformers/stub-contradictions/stub-contradictions-transformer.ts
### toolkit|proxy
- @dungeonmaster/testing/register-mock: 14 files
    - packages/core/src/brokers/analyzer/hash/analyzer-hash-broker.proxy.ts
    - packages/core/src/brokers/compile/resolve-graph/compile-resolve-graph-broker.proxy.ts
    - packages/core/src/brokers/compile/resolve-graph/resolve-specifier-layer-broker.proxy.ts
    - packages/core/src/brokers/compile/run/compile-run-broker.proxy.ts
    - packages/core/src/brokers/external-signature/read-global/external-signature-read-global-broker.proxy.ts
    - packages/core/src/brokers/external-signature/read/external-signature-read-broker.proxy.ts
    - packages/core/src/brokers/resolve-sibling/callee/resolve-sibling-callee-broker.proxy.ts
    - packages/core/src/brokers/run/console-find/run-console-find-broker.proxy.ts
    - packages/core/src/brokers/run/find/run-find-broker.proxy.ts
    - packages/core/src/brokers/run/id/run-id-broker.proxy.ts
    - packages/core/src/brokers/run/load/run-load-broker.proxy.ts
    - packages/core/src/brokers/run/paths/run-each-layer-broker.proxy.ts
    - packages/core/src/brokers/run/paths/run-paths-broker.proxy.ts
    - packages/core/src/brokers/run/unit/run-unit-broker.proxy.ts
### toolkit|stub
- @dungeonmaster/shared/@types: 29 files
    - packages/core/src/contracts/analysis-extract-result/analysis-extract-result.stub.ts
    - packages/core/src/contracts/arm-values/arm-values.stub.ts
    - packages/core/src/contracts/call-site/call-site.stub.ts
    - packages/core/src/contracts/case-set/case-set.stub.ts
    - packages/core/src/contracts/compile-progress-event/compile-progress-event.stub.ts
    - packages/core/src/contracts/condition-cause/condition-cause.stub.ts
    - packages/core/src/contracts/declared-shape/declared-shape.stub.ts
    - packages/core/src/contracts/dir-entry/dir-entry.stub.ts
    - packages/core/src/contracts/extracted-function/extracted-function.stub.ts
    - packages/core/src/contracts/file-index-entry/file-index-entry.stub.ts
    - packages/core/src/contracts/git-exec-result/git-exec-result.stub.ts
    - packages/core/src/contracts/harness-declaration/harness-declaration.stub.ts
    - packages/core/src/contracts/invoked-fn/invoked-fn.stub.ts
    - packages/core/src/contracts/ordered-bounds/ordered-bounds.stub.ts
    - packages/core/src/contracts/probe-plan/probe-plan.stub.ts
    - packages/core/src/contracts/probe-site/probe-site.stub.ts
    - packages/core/src/contracts/property-guard/property-guard.stub.ts
    - packages/core/src/contracts/run-verdict/run-verdict.stub.ts
    - packages/core/src/contracts/scope-record/scope-record.stub.ts
    - packages/core/src/contracts/source-position/source-position.stub.ts
    - packages/core/src/contracts/stub-overlay-env-file/stub-overlay-env-file.stub.ts
    - packages/core/src/contracts/stub-overlay-object-file/stub-overlay-object-file.stub.ts
    - packages/core/src/contracts/type-fact/type-fact.stub.ts
    - packages/core/src/contracts/value-domain/value-domain.stub.ts
    - packages/core/src/contracts/value-use/value-use.stub.ts
    - packages/core/src/contracts/walk-context/walk-context.stub.ts
    - packages/core/src/contracts/walk-facts/walk-facts.stub.ts
    - packages/core/src/contracts/walk-file-result/walk-file-result.stub.ts
    - packages/core/src/contracts/walk-node/walk-node.stub.ts

## shared

### npm|prod
- zod: 87 files
    - packages/shared/src/contracts/anonymous-reach/anonymous-reach-contract.ts
    - packages/shared/src/contracts/arrange-binding/arrange-binding-contract.ts
    - packages/shared/src/contracts/arrange-text/arrange-text-contract.ts
    - packages/shared/src/contracts/arrange-value/arrange-value-contract.ts
    - packages/shared/src/contracts/array-cardinality/array-cardinality-contract.ts
    - packages/shared/src/contracts/assayer-cache-manifest/assayer-cache-manifest-contract.ts
    - packages/shared/src/contracts/assayer-config/assayer-config-contract.ts
    - packages/shared/src/contracts/branch-name/branch-name-contract.ts
    - packages/shared/src/contracts/branch-node/branch-node-contract.ts
    - packages/shared/src/contracts/case-result/case-result-contract.ts
    - packages/shared/src/contracts/column-number/column-number-contract.ts
    - packages/shared/src/contracts/compile-mode/compile-mode-contract.ts
    - packages/shared/src/contracts/compile-result/compile-result-contract.ts
    - packages/shared/src/contracts/compile-status/compile-status-contract.ts
    - packages/shared/src/contracts/compiled-file-blob/compiled-file-blob-contract.ts
    - packages/shared/src/contracts/compiled-file-view/compiled-file-view-contract.ts
    - packages/shared/src/contracts/compiled-tree/compiled-tree-contract.ts
    - packages/shared/src/contracts/condition-leaf/condition-leaf-contract.ts
    - packages/shared/src/contracts/condition-node/condition-node-contract.ts
    - packages/shared/src/contracts/const-length/const-length-contract.ts
    - packages/shared/src/contracts/content-hash/content-hash-contract.ts
    - packages/shared/src/contracts/coverage-id/coverage-id-contract.ts
    - packages/shared/src/contracts/dark-spot/dark-spot-contract.ts
    - packages/shared/src/contracts/declared-type/declared-type-contract.ts
    - packages/shared/src/contracts/declaring-scope/declaring-scope-contract.ts
    - packages/shared/src/contracts/derived-test-case/derived-test-case-contract.ts
    - packages/shared/src/contracts/docs-result/docs-result-contract.ts
    - packages/shared/src/contracts/docs-topic/docs-topic-contract.ts
    - packages/shared/src/contracts/entry-access/entry-access-contract.ts
    - packages/shared/src/contracts/entry-gap/entry-gap-contract.ts
    - packages/shared/src/contracts/entry-label/entry-label-contract.ts
    - packages/shared/src/contracts/entry-signature/entry-signature-contract.ts
    - packages/shared/src/contracts/env-read/env-read-contract.ts
    - packages/shared/src/contracts/env-stub/env-stub-contract.ts
    - packages/shared/src/contracts/env-value/env-value-contract.ts
    - packages/shared/src/contracts/env-var-name/env-var-name-contract.ts
    - packages/shared/src/contracts/exit-node/exit-node-contract.ts
    - packages/shared/src/contracts/external-signature/external-signature-contract.ts
    - packages/shared/src/contracts/file-analysis/file-analysis-contract.ts
    - packages/shared/src/contracts/file-count/file-count-contract.ts
    - packages/shared/src/contracts/file-module-graph/file-module-graph-contract.ts
    - packages/shared/src/contracts/folder-name/folder-name-contract.ts
    - packages/shared/src/contracts/function-analysis/function-analysis-contract.ts
    - packages/shared/src/contracts/global-use/global-use-contract.ts
    - packages/shared/src/contracts/guard-step/guard-step-contract.ts
    - packages/shared/src/contracts/harness-file/harness-file-contract.ts
    - packages/shared/src/contracts/harness-index/harness-index-contract.ts
    - packages/shared/src/contracts/harness-input-key/harness-input-key-contract.ts
    - packages/shared/src/contracts/harness-key-path/harness-key-path-contract.ts
    - packages/shared/src/contracts/line-enrichment/line-enrichment-contract.ts
    - packages/shared/src/contracts/line-number/line-number-contract.ts
    - packages/shared/src/contracts/lint-entry/lint-entry-contract.ts
    - packages/shared/src/contracts/map-node-kind/map-node-kind-contract.ts
    - packages/shared/src/contracts/map-node/map-node-contract.ts
    - packages/shared/src/contracts/module-edge/module-edge-contract.ts
    - packages/shared/src/contracts/module-reference/module-reference-contract.ts
    - packages/shared/src/contracts/module-specifier/module-specifier-contract.ts
    - packages/shared/src/contracts/namespace-name/namespace-name-contract.ts
    - packages/shared/src/contracts/object-stub/object-stub-contract.ts
    - packages/shared/src/contracts/package-name/package-name-contract.ts
    - packages/shared/src/contracts/param-descriptor/param-descriptor-contract.ts
    - packages/shared/src/contracts/predicate/predicate-contract.ts
    - packages/shared/src/contracts/property-demand/property-demand-contract.ts
    - packages/shared/src/contracts/rel-path/rel-path-contract.ts
    - packages/shared/src/contracts/repo-name/repo-name-contract.ts
    - packages/shared/src/contracts/representative-value/representative-value-contract.ts
    - packages/shared/src/contracts/resolution-failure-reason/resolution-failure-reason-contract.ts
    - packages/shared/src/contracts/resolved-edge/resolved-edge-contract.ts
    - packages/shared/src/contracts/resolved-index/resolved-index-contract.ts
    - packages/shared/src/contracts/run-console/run-console-contract.ts
    - packages/shared/src/contracts/run-id/run-id-contract.ts
    - packages/shared/src/contracts/run-result/run-result-contract.ts
    - packages/shared/src/contracts/source-line/source-line-contract.ts
    - packages/shared/src/contracts/status-result/status-result-contract.ts
    - packages/shared/src/contracts/stub-index/stub-index-contract.ts
    - packages/shared/src/contracts/stub-key/stub-key-contract.ts
    - packages/shared/src/contracts/stub-overlay/stub-overlay-contract.ts
    - packages/shared/src/contracts/stub-view/stub-view-contract.ts
    - packages/shared/src/contracts/symbol-name/symbol-name-contract.ts
    - packages/shared/src/contracts/syntax-kind-name/syntax-kind-name-contract.ts
    - packages/shared/src/contracts/template-text/template-text-contract.ts
    - packages/shared/src/contracts/trace-event/trace-event-contract.ts
    - packages/shared/src/contracts/trace-value-text/trace-value-text-contract.ts
    - packages/shared/src/contracts/tree-node-kind/tree-node-kind-contract.ts
    - packages/shared/src/contracts/type-descriptor/type-descriptor-contract.ts
    - packages/shared/src/contracts/type-text/type-text-contract.ts
    - packages/shared/src/contracts/undriven-entry/undriven-entry-contract.ts
### toolkit|stub
- @dungeonmaster/shared/@types: 52 files
    - packages/shared/src/contracts/anonymous-reach/anonymous-reach.stub.ts
    - packages/shared/src/contracts/arrange-binding/arrange-binding.stub.ts
    - packages/shared/src/contracts/assayer-cache-manifest/assayer-cache-manifest.stub.ts
    - packages/shared/src/contracts/assayer-config/assayer-config.stub.ts
    - packages/shared/src/contracts/branch-node/branch-node.stub.ts
    - packages/shared/src/contracts/case-result/case-result.stub.ts
    - packages/shared/src/contracts/compile-result/compile-result.stub.ts
    - packages/shared/src/contracts/compiled-file-blob/compiled-file-blob.stub.ts
    - packages/shared/src/contracts/compiled-file-view/compiled-file-view.stub.ts
    - packages/shared/src/contracts/compiled-tree/compiled-tree.stub.ts
    - packages/shared/src/contracts/condition-leaf/condition-leaf.stub.ts
    - packages/shared/src/contracts/condition-node/condition-node.stub.ts
    - packages/shared/src/contracts/dark-spot/dark-spot.stub.ts
    - packages/shared/src/contracts/declared-type/declared-type.stub.ts
    - packages/shared/src/contracts/declaring-scope/declaring-scope.stub.ts
    - packages/shared/src/contracts/derived-test-case/derived-test-case.stub.ts
    - packages/shared/src/contracts/docs-result/docs-result.stub.ts
    - packages/shared/src/contracts/entry-access/entry-access.stub.ts
    - packages/shared/src/contracts/entry-gap/entry-gap.stub.ts
    - packages/shared/src/contracts/entry-signature/entry-signature.stub.ts
    - packages/shared/src/contracts/env-read/env-read.stub.ts
    - packages/shared/src/contracts/env-stub/env-stub.stub.ts
    - packages/shared/src/contracts/exit-node/exit-node.stub.ts
    - packages/shared/src/contracts/external-signature/external-signature.stub.ts
    - packages/shared/src/contracts/file-analysis/file-analysis.stub.ts
    - packages/shared/src/contracts/file-module-graph/file-module-graph.stub.ts
    - packages/shared/src/contracts/function-analysis/function-analysis.stub.ts
    - packages/shared/src/contracts/global-use/global-use.stub.ts
    - packages/shared/src/contracts/guard-step/guard-step.stub.ts
    - packages/shared/src/contracts/harness-file/harness-file.stub.ts
    - packages/shared/src/contracts/harness-index/harness-index.stub.ts
    - packages/shared/src/contracts/harness-input-key/harness-input-key.stub.ts
    - packages/shared/src/contracts/line-enrichment/line-enrichment.stub.ts
    - packages/shared/src/contracts/lint-entry/lint-entry.stub.ts
    - packages/shared/src/contracts/map-node/map-node.stub.ts
    - packages/shared/src/contracts/module-edge/module-edge.stub.ts
    - packages/shared/src/contracts/module-reference/module-reference.stub.ts
    - packages/shared/src/contracts/object-stub/object-stub.stub.ts
    - packages/shared/src/contracts/param-descriptor/param-descriptor.stub.ts
    - packages/shared/src/contracts/predicate/predicate.stub.ts
    - packages/shared/src/contracts/property-demand/property-demand.stub.ts
    - packages/shared/src/contracts/resolved-edge/resolved-edge.stub.ts
    - packages/shared/src/contracts/resolved-index/resolved-index.stub.ts
    - packages/shared/src/contracts/run-result/run-result.stub.ts
    - packages/shared/src/contracts/source-line/source-line.stub.ts
    - packages/shared/src/contracts/status-result/status-result.stub.ts
    - packages/shared/src/contracts/stub-index/stub-index.stub.ts
    - packages/shared/src/contracts/stub-overlay/stub-overlay.stub.ts
    - packages/shared/src/contracts/stub-view/stub-view.stub.ts
    - packages/shared/src/contracts/trace-event/trace-event.stub.ts
    - packages/shared/src/contracts/type-descriptor/type-descriptor.stub.ts
    - packages/shared/src/contracts/undriven-entry/undriven-entry.stub.ts

## eslint-rules

### builtin|test
- node:path: 1 files
    - eslint-rules/no-nullish-coalescing-on-arrange-value/no-nullish-coalescing-on-arrange-value-rule.test.js
### npm|test
- @typescript-eslint/rule-tester: 1 files
    - eslint-rules/no-nullish-coalescing-on-arrange-value/no-nullish-coalescing-on-arrange-value-rule.test.js

## scripts

### builtin|prod
- node:child_process: 1 files
    - scripts/jest-global-setup.js
- node:fs: 1 files
    - scripts/copy-dist-package-json.mjs
- node:path: 2 files
    - scripts/copy-dist-package-json.mjs
    - scripts/jest-global-setup.js
- node:url: 1 files
    - scripts/copy-dist-package-json.mjs

## smoke-repo

### builtin|config
- path: 1 files
    - smoke-repo/packages/syntax-repository/jest.config.js
### builtin|prod
- node:path: 2 files
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.ts
### builtin|test
- fs: 117 files
    - smoke-repo/packages/syntax-repository/src/happy-path/array/at/at.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/const-alias/const-alias.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/const-literal/const-literal.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/cross-file-map/band-reading.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/cross-file-map/cross-file-map.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/element-assign/element-assign.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/element-length/element-length.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/index-access/index-access.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/map-conditional/map-conditional.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/map/map.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/nested/nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/pop/pop.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/shift/shift.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/sibling-fill/sibling-fill.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/slice/slice.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/spread/spread.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/string-element/string-element.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/stub-sibling-array/stub-sibling-array.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/two-maps/two-maps.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/unshift/unshift.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/and/and.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/eq-false/eq-false.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/mixed/mixed.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/not/not.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/or/or.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/class/class.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/const-arrow-callee/const-arrow-callee.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/if-in-switch/if-in-switch.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/same-file-predicate/same-file-predicate.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/switch-in-if/switch-in-if.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/through-caller/through-caller.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/export-default/const-default/const-default.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/arrow/arrow.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/declaration/declaration.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/deep-nested/deep-nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/expression/expression.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/iife/iife.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/nested/nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/harness/callback-param/callback-param.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/harness/object-param/object-param.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if-else/in-class/in-class.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if-else/in-function/in-function.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if-else/pure-statement/pure-statement.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if/no-else/no-else.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/import-local/uses-greeting/greeting.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/import-local/uses-greeting/uses-greeting.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/length/array-guard/array-guard.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/length/bounded-name/bounded-name.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-global/nested-console/nested-console.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-global/uses-console/uses-console.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-global/uses-process/uses-process.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/null/eq-null/eq-null.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/branch-local/branch-local.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-reader/cross-file-reader.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-reader/settings.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-shape/cross-file-shape.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-shape/reader-b.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-shape/types.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/generic-alias/box.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/generic-alias/generic-alias.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/intersection/intersection.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/local-shape/local-shape.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/property-depth/property-depth.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/type-alias/type-alias.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/types-only/types-only.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/optional-chain/basic/basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/short-circuit/and-chain/and-chain.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/short-circuit/nullish/nullish.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/short-circuit/or-chain/or-chain.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/in-class/in-class.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/in-function/in-function.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/no-default/no-default.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/template-literal/basic/basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/arrow-basic/arrow-basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/return-basic/return-basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/return-nested/return-nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/value-basic/value-basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/tsx/component/component.test.tsx
    - smoke-repo/packages/syntax-repository/src/happy-path/tuple/tuple-param/tuple-param.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/typeof/typeof-narrow/typeof-narrow.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/union/mixed-union/mixed-union.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/unreachable/compatible-guards/compatible-guards.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/dead-surface/dead-surface.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/dead-surface/uncalled-nested/uncalled-nested.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/env-object/multi-read/multi-read.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/callback-param/callback-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/map-param/map-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/object-param/object-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/partial-harness/partial-harness.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/truthy-array-param/truthy-array-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/truthy-object-param/truthy-object-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/length/contradictory-bounds/contradictory-bounds.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/loop/in-function/in-function.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/ternary/arg-position/arg-position.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/const-comparand/const-comparand.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/enum-case/enum-case.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/hof-callback/hof-callback.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-if/opaque-if.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-module/opaque-module.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-ternary/opaque-ternary.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/returned-closure/returned-closure.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/typeof-narrow-member/typeof-narrow-member.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/typeof-narrow-opaque/typeof-narrow-opaque.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/const-array-branch/const-array-branch.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/cross-file-guards.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/exceeds-limit.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/within-budget.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/iife/iife.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/sequential-guards/sequential-guards.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/welded-arg/welded-arg.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/welded-const/welded-const.test.ts
- node:path: 2 files
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.test.ts
- path: 117 files
    - smoke-repo/packages/syntax-repository/src/happy-path/array/at/at.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/const-alias/const-alias.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/const-literal/const-literal.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/cross-file-map/band-reading.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/cross-file-map/cross-file-map.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/element-assign/element-assign.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/element-length/element-length.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/index-access/index-access.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/map-conditional/map-conditional.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/map/map.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/nested/nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/pop/pop.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/shift/shift.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/sibling-fill/sibling-fill.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/slice/slice.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/spread/spread.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/string-element/string-element.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/stub-sibling-array/stub-sibling-array.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/two-maps/two-maps.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/array/unshift/unshift.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/and/and.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/eq-false/eq-false.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/mixed/mixed.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/not/not.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/boolean/or/or.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/class/class.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/const-arrow-callee/const-arrow-callee.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/if-in-switch/if-in-switch.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/same-file-predicate/same-file-predicate.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/switch-in-if/switch-in-if.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/composition/through-caller/through-caller.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/export-default/const-default/const-default.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/arrow/arrow.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/declaration/declaration.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/deep-nested/deep-nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/expression/expression.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/iife/iife.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/function/nested/nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/harness/callback-param/callback-param.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/harness/object-param/object-param.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if-else/in-class/in-class.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if-else/in-function/in-function.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if-else/pure-statement/pure-statement.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/if/no-else/no-else.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/import-local/uses-greeting/greeting.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/import-local/uses-greeting/uses-greeting.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/length/array-guard/array-guard.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/length/bounded-name/bounded-name.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/calls-join/calls-join.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-builtin/uses-builtin/uses-builtin.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-global/nested-console/nested-console.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-global/uses-console/uses-console.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/node-global/uses-process/uses-process.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/null/eq-null/eq-null.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/branch-local/branch-local.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-reader/cross-file-reader.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-reader/settings.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-shape/cross-file-shape.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-shape/reader-b.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/cross-file-shape/types.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/generic-alias/box.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/generic-alias/generic-alias.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/intersection/intersection.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/local-shape/local-shape.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/property-depth/property-depth.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/type-alias/type-alias.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/object/types-only/types-only.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/optional-chain/basic/basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/short-circuit/and-chain/and-chain.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/short-circuit/nullish/nullish.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/short-circuit/or-chain/or-chain.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/in-class/in-class.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/in-function/in-function.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/no-default/no-default.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/template-literal/basic/basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/arrow-basic/arrow-basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/return-basic/return-basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/return-nested/return-nested.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/ternary/value-basic/value-basic.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/tsx/component/component.test.tsx
    - smoke-repo/packages/syntax-repository/src/happy-path/tuple/tuple-param/tuple-param.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/typeof/typeof-narrow/typeof-narrow.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/union/mixed-union/mixed-union.test.ts
    - smoke-repo/packages/syntax-repository/src/happy-path/unreachable/compatible-guards/compatible-guards.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/dead-surface/dead-surface.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/dead-surface/uncalled-nested/uncalled-nested.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/env-object/multi-read/multi-read.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/callback-param/callback-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/map-param/map-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/object-param/object-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/partial-harness/partial-harness.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/truthy-array-param/truthy-array-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/input-gap/truthy-object-param/truthy-object-param.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/length/contradictory-bounds/contradictory-bounds.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/loop/in-function/in-function.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/run-gap/needs-ctor-arg/needs-ctor-arg.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/ternary/arg-position/arg-position.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/const-comparand/const-comparand.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/enum-case/enum-case.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/hof-callback/hof-callback.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-if/opaque-if.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-module/opaque-module.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-ternary/opaque-ternary.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/returned-closure/returned-closure.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/typeof-narrow-member/typeof-narrow-member.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/undriven/typeof-narrow-opaque/typeof-narrow-opaque.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/const-array-branch/const-array-branch.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/cross-file-guards.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/exceeds-limit.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/cross-file-guards/within-budget.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/iife/iife.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/sequential-guards/sequential-guards.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/welded-arg/welded-arg.test.ts
    - smoke-repo/packages/syntax-repository/src/sad-path/unreachable/welded-const/welded-const.test.ts
### npm|config
- ts-jest: 1 files
    - smoke-repo/packages/syntax-repository/jest.config.js
- typescript: 1 files
    - smoke-repo/packages/syntax-repository/jest.config.js
### npm|prod
- vendored-fixture: 1 files
    - smoke-repo/packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.ts
### npm|test
- vendored-fixture: 1 files
    - smoke-repo/packages/syntax-repository/src/happy-path/npm-package/uses-package/uses-package.test.ts

# APPENDIX C. Platform globals (comment and string stripped regex; approximate: includes type positions and local names)


## desktop
- support Buffer: 1 files -> packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.proxy.ts
- support module: 1 files -> packages/desktop/jest.config.js
- support process: 2 files -> packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.proxy.ts, packages/desktop/src/brokers/run/execute/run-execute-broker.test.ts
- support queueMicrotask: 1 files -> packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.proxy.ts
- support require: 3 files -> packages/desktop/bin/desktop-main.integration.test.ts, packages/desktop/bin/desktop-preload.integration.test.ts, packages/desktop/jest.config.js
- adapter Buffer: 1 files -> packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.ts
- adapter __dirname: 2 files -> packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts, packages/desktop/src/adapters/electron/main-entry-path/electron-main-entry-path-adapter.ts
- adapter process: 2 files -> packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts, packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.ts
- adapter window: 1 files -> packages/desktop/src/adapters/electron/desktop-boot/electron-desktop-boot-adapter.ts
- prod process: 2 files -> packages/desktop/bin/desktop-main.ts, packages/desktop/src/brokers/run/execute/run-execute-broker.ts

## hydration-recipes
- support module: 1 files -> packages/hydration-recipes/jest.config.js
- support require: 1 files -> packages/hydration-recipes/jest.config.js

## cli
- support Blob: 1 files -> packages/cli/test/harnesses/assayer-compile.harness.ts
- support Buffer: 2 files -> packages/cli/test/harnesses/assayer-cli.harness.ts, packages/cli/test/harnesses/assayer-compile.harness.ts
- support __dirname: 2 files -> packages/cli/test/harnesses/assayer-cli.harness.ts, packages/cli/test/harnesses/assayer-compile.harness.ts
- support module: 1 files -> packages/cli/jest.config.js
- support process: 5 files -> packages/cli/src/adapters/process-stdout/compile-progress/process-stdout-compile-progress-adapter.proxy.ts, packages/cli/src/adapters/process-stdout/is-tty/process-stdout-is-tty-adapter.proxy.ts, packages/cli/src/adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter.proxy.ts, packages/cli/test/harnesses/assayer-cli.harness.ts, packages/cli/test/harnesses/assayer-compile.harness.ts
- support require: 1 files -> packages/cli/jest.config.js
- adapter __dirname: 1 files -> packages/cli/src/adapters/package-json/read/package-json-read-adapter.ts
- adapter process: 3 files -> packages/cli/src/adapters/process-stdout/compile-progress/process-stdout-compile-progress-adapter.ts, packages/cli/src/adapters/process-stdout/is-tty/process-stdout-is-tty-adapter.ts, packages/cli/src/adapters/readline/stable-branch-pick/readline-stable-branch-pick-adapter.ts
- prod module: 1 files -> packages/cli/bin/assayer.ts
- prod process: 1 files -> packages/cli/bin/assayer.ts
- prod require: 1 files -> packages/cli/bin/assayer.ts

## app
- support __dirname: 9 files
- support document: 4 files -> packages/app/src/adapters/codemirror/view/codemirror-view-adapter.test.ts, packages/app/src/adapters/react-dom/mount/react-dom-mount-adapter.test.ts, packages/app/src/responders/app/mount/app-mount-responder.test.ts, packages/app/src/widgets/code-viewer/code-viewer-widget.test.tsx
- support globalThis: 3 files -> packages/app/src/flows/app/run-console.e2e.ts, packages/app/src/widgets/surface-explorer/surface-explorer-widget.proxy.tsx, packages/app/test/harnesses/e2e-fixtures.ts
- support localStorage: 1 files -> packages/app/test/harnesses/e2e-fixtures.ts
- support module: 1 files -> packages/app/jest.config.js
- support process: 2 files -> packages/app/playwright.config.ts, packages/app/test/harnesses/smoke-cache.harness.ts
- support require: 2 files -> packages/app/jest.config.js, packages/app/src/main.test.tsx
- support sessionStorage: 1 files -> packages/app/test/harnesses/e2e-fixtures.ts
- support window: 23 files
- prod document: 1 files -> packages/app/src/responders/app/mount/app-mount-responder.ts
- prod globalThis: 2 files -> packages/app/src/__mocks__/jsdom-polyfills.cjs, packages/app/src/widgets/surface-explorer/surface-explorer-widget.tsx
- prod location: 1 files -> packages/app/src/widgets/app-shell/app-shell-widget.tsx
- prod module: 1 files -> packages/app/src/__mocks__/style-mock.cjs
- prod window: 1 files -> packages/app/src/__mocks__/jsdom-polyfills.cjs
- adapter globalThis: 1 files -> packages/app/src/adapters/codemirror/view/codemirror-view-adapter.ts
- adapter window: 8 files -> packages/app/src/adapters/assayer-bridge/get-compiled-file/assayer-bridge-get-compiled-file-adapter.ts, packages/app/src/adapters/assayer-bridge/get-compiled-tree/assayer-bridge-get-compiled-tree-adapter.ts, packages/app/src/adapters/assayer-bridge/get-saved-console/assayer-bridge-get-saved-console-adapter.ts, packages/app/src/adapters/assayer-bridge/get-saved-run/assayer-bridge-get-saved-run-adapter.ts, packages/app/src/adapters/assayer-bridge/get-status/assayer-bridge-get-status-adapter.ts, packages/app/src/adapters/assayer-bridge/get-stubs/assayer-bridge-get-stubs-adapter.ts, packages/app/src/adapters/assayer-bridge/on-run-output/assayer-bridge-on-run-output-adapter.ts, packages/app/src/adapters/assayer-bridge/run-file/assayer-bridge-run-file-adapter.ts

## core
- support __dirname: 6 files -> packages/core/src/adapters/fs/find-up/fs-find-up-adapter.test.ts, packages/core/test/harnesses/example-resolution.harness.ts, packages/core/test/harnesses/run-unit.harness.ts, packages/core/test/harnesses/specimen-catalogue.ts, packages/core/test/harnesses/stub-graph.harness.ts, packages/core/test/harnesses/syntax-traits.ts
- support console: 1 files -> packages/core/src/brokers/run/console-find/run-console-find-broker.proxy.ts
- support module: 2 files -> packages/core/jest.config.js, packages/core/src/transformers/undriven-projection/undriven-projection-transformer.test.ts
- support process: 2 files -> packages/core/src/adapters/jest/interpret-case/jest-interpret-case-adapter.test.ts, packages/core/test/harnesses/run-unit.harness.ts
- support require: 1 files -> packages/core/jest.config.js
- prod __dirname: 1 files -> packages/core/src/brokers/run/paths/run-paths-broker.ts
- prod exports: 2 files -> packages/core/harness-registrar.js, packages/core/probe-transformer.js
- prod globalThis: 1 files -> packages/core/probe-runtime.js
- prod module: 1 files -> packages/core/src/transformers/undriven-projection/undriven-projection-transformer.ts
- prod require: 3 files -> packages/core/harness-registrar.js, packages/core/probe-runtime.js, packages/core/probe-transformer.js
- adapter location: 3 files -> packages/core/src/adapters/ts-morph/read-external-signature/read-signature-type-layer-adapter.ts, packages/core/src/adapters/ts-morph/read-harness-value-types/read-harness-value-type-layer-adapter.ts, packages/core/src/adapters/ts-morph/walk-file/read-type-fact-layer-adapter.ts

## shared
- support module: 1 files -> packages/shared/jest.config.js
- support require: 1 files -> packages/shared/jest.config.js

## eslint-rules
- support __dirname: 2 files -> eslint-rules/jest.config.js, eslint-rules/no-nullish-coalescing-on-arrange-value/no-nullish-coalescing-on-arrange-value-rule.test.js
- support module: 1 files -> eslint-rules/jest.config.js
- support require: 1 files -> eslint-rules/no-nullish-coalescing-on-arrange-value/no-nullish-coalescing-on-arrange-value-rule.test.js
- prod module: 2 files -> eslint-rules/index.js, eslint-rules/no-nullish-coalescing-on-arrange-value/no-nullish-coalescing-on-arrange-value-rule.js
- prod require: 1 files -> eslint-rules/index.js

## scripts
- prod __dirname: 1 files -> scripts/jest-global-setup.js
- prod module: 1 files -> scripts/jest-global-setup.js
- prod process: 1 files -> scripts/jest-global-setup.js
- prod require: 1 files -> scripts/jest-global-setup.js

## smoke-repo
- support __dirname: 118 files
- support module: 1 files -> smoke-repo/packages/syntax-repository/jest.config.js
- support require: 1 files -> smoke-repo/packages/syntax-repository/jest.config.js
- prod console: 8 files -> smoke-repo/packages/syntax-repository/src/happy-path/if-else/pure-statement/pure-statement.ts, smoke-repo/packages/syntax-repository/src/happy-path/node-global/nested-console/nested-console.ts, smoke-repo/packages/syntax-repository/src/happy-path/node-global/uses-console/uses-console.ts, smoke-repo/packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.ts, smoke-repo/packages/syntax-repository/src/sad-path/env-object/multi-read/multi-read.ts, smoke-repo/packages/syntax-repository/src/sad-path/undriven/opaque-module/opaque-module.ts, smoke-repo/packages/syntax-repository/src/sad-path/unreachable/const-array-branch/const-array-branch.ts, smoke-repo/packages/syntax-repository/src/sad-path/unreachable/welded-const/welded-const.ts
- prod process: 5 files -> smoke-repo/packages/syntax-repository/src/happy-path/function/iife/iife.ts, smoke-repo/packages/syntax-repository/src/happy-path/if-else/pure-statement/pure-statement.ts, smoke-repo/packages/syntax-repository/src/happy-path/node-global/uses-process/uses-process.ts, smoke-repo/packages/syntax-repository/src/happy-path/switch/pure-statement/pure-statement.ts, smoke-repo/packages/syntax-repository/src/sad-path/env-object/multi-read/multi-read.ts

# APPENDIX D. Spawn-like calls

- desktop: packages/desktop/src/adapters/node-child-process/exec/node-child-process-exec-adapter.ts (adapter) spawn(command)
- desktop: packages/desktop/src/adapters/node-child-process/spawn/node-child-process-spawn-adapter.ts (adapter) spawn(command)
- cli: packages/cli/test/harnesses/assayer-cli.harness.ts (harness) spawn(process.execPath)
- cli: packages/cli/test/harnesses/assayer-compile.harness.ts (harness) spawn(process.execPath)
- cli: packages/cli/test/harnesses/assayer-compile.harness.ts (harness) spawn('')
- cli: packages/cli/test/harnesses/assayer-compile.harness.ts (harness) spawn('')
- cli: packages/cli/test/harnesses/assayer-compile.harness.ts (harness) spawn('')
- cli: packages/cli/test/harnesses/assayer-compile.harness.ts (harness) spawn('')
- cli: packages/cli/test/harnesses/assayer-compile.harness.ts (harness) spawn('')
- app: packages/app/test/e2e-global-build.ts (test) execSync('')
- app: packages/app/test/harnesses/smoke-cache.harness.ts (harness) spawn(process.execPath)
- core: packages/core/src/transformers/json-parse-error-source-position/json-parse-error-source-position-transformer.ts (prod) exec(message)
- core: packages/core/src/adapters/git/exec/git-exec-adapter.ts (adapter) execFile('')
- scripts: scripts/jest-global-setup.js (prod) execFileSync(process.execPath)

# APPENDIX E. Test-side counts per package (regex count of occurrences, src+test files)

- desktop: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 22, 'registerModuleMock': 3, 'as never': 1, 'as unknown as': 0}
- hydration-recipes: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 0, 'registerModuleMock': 0, 'as never': 0, 'as unknown as': 0}
- cli: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 19, 'registerModuleMock': 0, 'as never': 0, 'as unknown as': 0}
- app: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 0, 'registerModuleMock': 0, 'as never': 5, 'as unknown as': 0}
- core: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 40, 'registerModuleMock': 0, 'as never': 7, 'as unknown as': 1}
- shared: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 0, 'registerModuleMock': 0, 'as never': 24, 'as unknown as': 0}
- eslint-rules: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 0, 'registerModuleMock': 0, 'as never': 0, 'as unknown as': 0}
- scripts: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 0, 'registerModuleMock': 0, 'as never': 0, 'as unknown as': 0}
- smoke-repo: {'jest.mock': 0, 'jest.spyOn': 0, 'registerMock': 0, 'registerModuleMock': 0, 'as never': 0, 'as unknown as': 0}

# APPENDIX F. File counts by kind

- desktop: {'prod': 33, 'config': 1, 'test': 31, 'adapter-test': 14, 'adapter-proxy': 14, 'adapter': 14, 'proxy': 13, 'stub': 6}
- hydration-recipes: {'config': 1, 'prod': 6, 'test': 5, 'proxy': 2}
- cli: {'config': 1, 'harness': 2, 'prod': 39, 'test': 39, 'adapter-proxy': 6, 'adapter-test': 6, 'adapter': 6, 'proxy': 11, 'stub': 10}
- app: {'config': 3, 'test': 68, 'harness': 7, 'prod': 59, 'adapter-proxy': 14, 'adapter': 14, 'adapter-test': 14, 'proxy': 25, 'stub': 10}
- core: {'prod': 210, 'config': 1, 'harness': 10, 'test': 207, 'proxy': 57, 'adapter': 76, 'adapter-test': 76, 'adapter-proxy': 76, 'stub': 41}
- shared: {'config': 1, 'prod': 92, 'test': 90, 'stub': 87}
- eslint-rules: {'config': 1, 'prod': 3, 'test': 1}
- scripts: {'prod': 2}
- smoke-repo: {'config': 1, 'test': 117, 'prod': 117, 'harness': 3}
