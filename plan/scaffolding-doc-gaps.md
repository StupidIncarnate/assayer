# Scaffolding: documentation / tooling gaps (patch these later)

Genuine gaps I hit standing up the monorepo that are NOT just "I didn't follow
the standard." Each is a candidate for a fix in the dungeonmaster docs/tooling.
(Things that turned out to be "wrap it in an adapter" — the standard working as
intended — have been removed; the adapter pattern is the answer there, not a gap.)

## 1. Cross-package public API convention is undocumented
No MCP tool documents how a package exposes its surface to OTHER packages or how
cross-package imports resolve. I had to reverse-engineer it from codex:
- Package-**root** barrel files per folder type (`contracts.ts`, `brokers.ts`,
  `testing.ts`) that `export *` from `./src/<foldertype>/…`. They sit OUTSIDE
  `src/`, matched by tsconfig `include: ["*.ts"]`, so they're exempt from the
  colocation rule (no `.test.ts` needed). A `src/index.ts` barrel is NOT exempt.
- `package.json` `exports` maps each subpath (`"./contracts"`) to
  `{ source, require/import, types }`.
- `moduleResolution: "node"` (node10) resolves the root `contracts.ts` SOURCE for
  typecheck; Node honors the `exports` map to `dist/…` at runtime.
**Suggest:** document this in `get-architecture` (or a "packaging" topic).

## 2. No published base tsconfig to extend
The exact `compilerOptions` the toolchain expects live only in codex
(`packages/eslint-plugin/configs/tsconfig.json`): `strict, noUnusedLocals,
noUnusedParameters, noImplicitReturns, noFallthroughCasesInSwitch,
allowUnreachableCode:false, exactOptionalPropertyTypes, noUncheckedIndexedAccess`,
plus per-package shape (`composite`, `rootDir:"./"`, `include:["src/**/*","*.ts"]`).
**Suggest:** ship a base tsconfig consumers can `extends`, documented in `get-architecture`.

## 3. `npm run ward` is not self-contained in a fresh repo
The CLAUDE snippet says to always use `npm run ward`, but a fresh repo has no
`ward` script and `@dungeonmaster/ward` may not be installed. I had to add
`"ward": "dungeonmaster-ward"` (+ `lint`/`typecheck`/`test`) mirroring codex.
**Suggest:** `assayer init` / the standards should scaffold the ward scripts and
state that `@dungeonmaster/ward` must be present.

## 4. `@dungeonmaster/*` are undeclared global links that a workspace install prunes
The tooling packages were present via GLOBAL `npm link`s to the sibling
`codex-of-consentient-craft` repo but NOT declared in `package.json`. Converting
to npm workspaces + `npm install` PRUNED them all, breaking eslint + the
pre-edit/pre-bash hooks + the MCP server. Recovery: recreate the symlinks
directly (`ln -sfn <codex>/packages/<p> node_modules/@dungeonmaster/<p>`), and any
later `npm install`/`npm link` re-prunes them.
**Suggest:** declare the tooling as real `file:`/`link:` deps, or have `assayer
init` wire them so installs don't prune.

## 5. ESLint version floor is not declared
The eslint-plugin references the `preserve-caught-error` rule (ESLint ≥ 9.36),
but declares no peer floor, so `eslint@9.30.1` crashed lint with
`Could not find "preserve-caught-error" in plugin "@"`. Had to bump to `^9.36.0`.
**Suggest:** the plugin should declare an `eslint` peer-range with a P1-grade
mismatch error (per the plan's own version-compatibility rule).

## 6. Cross-package import scope — ✅ RESOLVED by the user
The `enforce-import-dependencies` rule originally only treated `@dungeonmaster/*`
as quasi-local; a first-party `@assayer/shared` was blocked. The user generalized
it to first-party scopes. Note the (correct) consequence now baked into the repo:
`@assayer/<pkg>/brokers` reads as a quasi-local `brokers/` import, so cross-package
broker calls go in **responders/brokers** (which may import `brokers/`), never in
adapters (adapters may not import `brokers/`).

## 7. `get-folder-detail('responders')` shows `.tsx` examples the rule rejects
The responder folder-config `fileSuffix` is `-responder.ts` ONLY — a `.tsx`
responder is rejected even under `framework: monorepo` — yet
`get-folder-detail('responders')` documents frontend-page examples named
`user-profile-responder.tsx` (returning JSX). So a page responder can't use JSX
directly. This is the STANDARD (a responder produces its widget element through a
`react/create-element` adapter, keeping the `.ts` responder JSX-free), but the
documented examples contradict the enforcement.
**Suggest:** fix the folder-detail examples to `.ts` + create-element adapter, or
add a react-framework responder variant that permits `.tsx`.

## 8. No Electron framework profile / adapter set
dungeonmaster has no Electron support, so the whole main-process surface
(`app.whenReady`, `BrowserWindow`, `ipcMain.handle`, `contextBridge`,
`ipcRenderer`) has to be hand-wrapped as local adapters, orchestrated
startup → flow → responder, with only a thin bin entry left. Two rough edges:
- **`registerModuleMock`'s factory is typed `() => Record<PropertyKey, unknown>`**,
  but Electron's Node-context module export is a raw PATH STRING; mocking it needs
  `() => ({ __esModule: true, default: '/usr/bin/electron' })`.
- **`process.cwd()` is whitelisted only for `start-install.ts`** — a CLI entry's
  cwd seed must go through a cwd adapter (e.g. `@dungeonmaster/shared/adapters`'
  `processCwdAdapter`), not raw `process.cwd()`.
**Suggest:** ship an Electron framework profile (adapters + a folder-config that
lets a main/preload entry orchestrate the lifecycle), make the `process.cwd()`
entry whitelist configurable, and relax `registerModuleMock` typing for
string-exporting modules.

---
**Net:** the 5-package monorepo (shared/core/cli/desktop/app) is ward-green and
builds; the frictions above were absorbed with adapters + declared config, not by
disabling rules.
