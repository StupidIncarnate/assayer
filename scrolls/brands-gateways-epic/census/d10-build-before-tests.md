# D10: how dungeonmaster avoids "build before tests"

## 1. What dungeonmaster does (read in code)
Dungeonmaster has NO globalSetup build. Its one globalSetup (packages/testing/src/jest.setup-global.js, wired at jest.config.base.js:25) only sandboxes HOME.
Nothing that checks code builds first. Commit 183a97d55 ("jest reads the source a test's author just edited") is the fix for the same problem: a green suite that answered from the last build.

- In-process resolution: jest.config.base.js:13 sets testEnvironmentOptions.customExportConditions ['source','require','default']. Every package's exports map carries a "source" key pointing at a TS barrel.
- Jest's own node process: ward injects NODE_OPTIONS=--conditions=source into jest (packages/ward/src/brokers/check-run/unit/check-run-unit-broker.ts:207; integration broker :196; e2e broker :190). Only if sourceConditionSupportedBroker finds node_modules/@dungeonmaster/shared/statics.ts. Reason: ts-jest glue is loaded by plain Node, outside the jest environment (ward README.md:272-276).
- ts-jest glue loaded by plain Node: packages/testing/ts-jest/transformers.js:18 does require('tsx/cjs') so it can load .ts transformers.
- Children spawned by tests run source through tsx with the flag:
  mcp-server.harness.ts:104 (npx tsx --conditions=source), hook-runner.harness.ts:71-76 (node --conditions=source --import tsxLoaderUrl), cli-bin.harness.ts:154, hook-persistent-runner.harness.ts:119, adapter-census.harness.ts:47.
- The flag must not leak into compiled grandchildren: packages/testing/src/jest.setup.js:15-26 strips it from process.env.NODE_OPTIONS in the worker (Node parsed it at startup, so the worker keeps it). Measured breakage is recorded there.
- Ward builds nothing for lint/typecheck/unit/integration. The only build is e2e's bundleBuildBroker, into .ward/bundle/<sha-of-inputs>/ via .tmp-<pid> + atomic rename (ward README.md:350-354). That is a content-addressed, race-safe build that never touches dist.
- Stale dist is not detected by ward. Ward only checks manifest paths exist (workspace-manifest-entries-verify-broker.ts:1-9). Siegelense merely warns about a stale served build (commit 9d9271861).
- Tests that truly grade dist ("artifact tests", e.g. packages/ward/src/startup/start-ward.integration.test.ts:108-114) state "npm run build is its prerequisite" and nothing builds for them.
- Rule text: session-snippet-statics.ts:214-232 and root CLAUDE.md:146-155. Only one process builds, never a dispatched agent. Nothing that reads source needs a build.
- Not read: orchestrator integration tests, scripts/consumer-check internals. Consumer-check packs dist and requires build:clean (CLAUDE.md:152-153).

## 2. What works for assayer's shim
The assayer chain needs compiled output in exactly four places, all in packages/core:
- the shim: assemble-shim requires `${coreRoot}/dist/adapters` (run-unit-broker.ts:170);
- probe-runtime.js:14, probe-transformer.js:21, harness-registrar.js:20, each `require('./dist/...')`.

The nested Jest (jest-run-cli-adapter.ts) already transforms .ts through ts-jest, so it can load core source:
- `require(`${coreRoot}/adapters`)` resolves to core/adapters.ts (no adapters.js at package root). This is read from the file layout; whether Jest picks it is inference.
- The nested config needs customExportConditions ['source',...] so core source's `@assayer/shared` resolves to shared source. Without it the shim reads shared dist (inference from dungeonmaster's measured case).
- The three plain-JS files cannot use tsx/cjs in the published case.
- run-paths-broker.ts:31-33 already finds coreRoot by walking up from __dirname.

Mechanisms that do NOT transfer: spawn-with-tsx (assayer runs Jest in-process via runCLI, no child) and NODE_OPTIONS stripping (not needed in-process).

## 3. Recommendation
Rule: the shim loads the same tree the broker itself was loaded from. Broker under src means source; under dist means dist.
- Under assayer's own tests the broker runs from source, so nested Jest loads source (no build).
- A published or CLI run loads dist (production fidelity kept).
- That removes the "src and dist disagree silently" hazard the globalSetup exists for. They cannot disagree because there is one tree.

Pass the mode explicitly, not by env or existsSync:
- plain-JS files switch on a jest `globals` flag (setupFiles, registrar) or transform `options` (probe-transformer);
- keep config identical per file (core CLAUDE.md section 8 rule).

Add a NARROW source barrel (e.g. core/runtime.ts) with only interpret-case, resolve-entry, probe-runtime, probe-inject and assayerHarness. This avoids ts-jest compiling ts-morph code on every cold run (speed guess, not measured).

Files to change:
- /home/brutus-home/projects/assayer/jest.config.base.js (drop globalSetup, keep testTimeout)
- /home/brutus-home/projects/assayer/scripts/jest-global-setup.js (delete; copy-dist-package-json.mjs stays in `npm run build`)
- packages/core/src/brokers/run/paths/run-paths-broker.ts, run-each-layer-broker.ts, run-unit-broker.ts:170-171 (+ tests/proxies; assemble-shim test and run-unit-broker.test.ts hardcode /core/dist/adapters)
- packages/core/src/adapters/jest/run-cli/jest-run-cli-adapter.ts (+ test)
- packages/core/probe-runtime.js, probe-transformer.js, harness-registrar.js; new runtime barrel
- packages/core/CLAUDE.md section 8 ("Do not remove this step" paragraph) and the header comments in the shim and run-cli adapter. Rewrite as present-tense, per CLAUDE.md.

Minimum alternative (not recommended): keep dist, remove globalSetup, add an explicit single build step run by the coordinator only. This fixes concurrent builds but re-opens silent stale-dist passes.

## Risks and unknowns
- Byte-identical `test:syntax`: the result artifact is built from the same interpreter code, so output should match. Verify by hashing every specimen's run artifact before and after.
- Fact: smoke-repo/packages/syntax-repository/jest.config.js does not spread the base config. `test:syntax` therefore never ran globalSetup today and reads whatever dist exists. Source mode fixes that gap.
- Unverified: whether ts-jest's require of probe-transformer.js happens inside the outer Jest sandbox (in-process runCLI). Probe it before relying on it.
- Unverified: `#gateway/*` imports in core source resolve under nested Jest; needs a source condition in those packages' exports.
- Unverified: ward in assayer injects --conditions=source (needs node_modules/@dungeonmaster/shared/statics.ts via the file: link).
- Ts-jest diagnostics off in the nested run, so a broken package fails only its own tests, not every Jest run.
