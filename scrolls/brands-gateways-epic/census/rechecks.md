# Rechecks (read-only research)

Transcript: ~/.claude/projects/-home-brutus-home-projects-assayer/35147971-fe42-4659-b2c4-b195a0a3f237.jsonl
Full hits: scratchpad/hits.txt

## 1. What the notes meant
- ipc-reply nesting: packages/desktop/src/contracts/ipc-reply/ipc-reply-contract.ts nested dungeonmaster's zod 3 `errorMessageContract` inside a zod 4 `z.object`. "puts dungeonmaster's zod 3 `errorMessageContract` inside a zod 4 object. This also causes desktop's 25 lint errors." Also surfaced as TS2742 "inferred type of 'ipcReplyContract' cannot be named without a reference to '../../../../../../codex-of-consentient-craft/node_modules/zod/index.cjs'".
- excessively deep: case-result.stub.ts TS2589 "Type instantiation is excessively deep and possibly infinite. (line 7)". Session: "Dungeonmaster's `StubArgument` type loops forever on the zod 4 brand type. I tried typing the key as a plain `string`, but the `ban-primitives` rule rejects that, so I backed it out."
- Brand changes: ward lint --fix under new dungeonmaster rules (`require-object-contract-brands`) "added brands to objects, renamed brands, stripped brands off enums, and changed types in two core files" (~95-120 files, ~120-173 `.brand<...>()` lines). Session DID revert it: "I restored those files to their committed versions" then re-ran codemod + 4 hand edits.

## 2. Status after 7c1bac6 (scoped typecheck, this session)
- shared: FAIL 52 errors, all TS2307 `Cannot find module '@dungeonmaster/shared/@types'` (every *.stub.ts line 1, incl. case-result.stub.ts). TS2589 is masked, not gone: the import it came from still exists in the file and fails to resolve.
- desktop: FAIL 50 (TS2307 26, TS7031 16, TS7006 8). ipc-reply-contract.ts line 21: `TS2307: Cannot find module '@dungeonmaster/shared/contracts'`. The file is unchanged, still imports errorMessageContract from there. Nesting problem untestable until import migrates.
- core FAIL 86 (TS2307 80, TS7006 6); cli FAIL 23 (TS2307 17, TS7006 6); app FAIL 9 (TS2305 8, TS2724 1); hydration-recipes PASS.
- Repo does not typecheck. Init did not migrate any existing assayer code.

## 3. Codemod (scratchpad/zod4-codemod.mjs, 75 lines, in session 35147971 scratchpad)
S1 bump "zod": "^3.x" -> "^4.6.5" in 5 package.json; S2 `z.ZodType<X, z.ZodTypeDef, unknown>` -> `z.ZodType<X>`; S3 rewrite asserted zod 3 error text to zod 4.6.5 wording (escaped-quote regex forms). Already applied; hard-coded to this repo root so only reusable by editing the path; idempotent-ish. Commit 22fc4e3 left open: typecheck fails due to dungeonmaster import-path moves; test suites not run; hand fixes (.prefault, unwrap removal) already committed; config error text changed (no received value).

## 4. Commit 7c1bac6 (869 files, +32444/-125)
- Added: packages/@gateway/{node 536, browser 251, npm 48, bin 5} files (npm has typescript, ts-jest, ts-morph, zod, react... wrappers); .agents/* (5), AGENTS.md; packages/hydration-recipes (17).
- Modified: .claude/settings.json, .claude/commands/dumpster-{create,hunt}.md, .dungeonmaster.json (e2e process + gateway:{}), .gitignore (worktrees/, .quest-plans/ ...), package.json (workspace packages/@gateway/*, postinstall `dungeonmaster gateway-sync`, @dungeonmaster/siegelense "*").
- No change to root eslint.config.js, tsconfigs, jest configs, or CLAUDE.md. `#gateway/*` imports maps live only in new packages' package.json (@assayer-monorepo/{npm,node,browser,bin}), none in app/cli/core/desktop/shared.
- hydration-recipes: private package `@assayer-monorepo/hydration-recipes`, an empty starter for `dungeonmaster siegelense recipes` (listing returns [], seed dispatch). Init artifact, not assayer functionality; it typechecks.

## 5. CLAUDE.md known defect vs gateway
- core/package.json still lists typescript, ts-jest as dependencies; no files/peerDependencies. Gateway npm package also lists typescript ^5.8.3 and ts-jest as dependencies (files:["dist"]), so the typescript-as-regular-dependency question now exists in two places. Gateway wrappers (src/typescript, src/ts-jest) will be where core imports typescript through once migrated; its dist-only `files` is a pattern core's pack fix could follow. Core's tarball problem is unchanged.
