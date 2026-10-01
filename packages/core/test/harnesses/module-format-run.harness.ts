/**
 * PURPOSE: Drives the REAL execution engine — analyze, assemble, the wrapped Jest in its worker, saved
 *   artifact — against three small consumer repos that differ only in module system: a CommonJS repo,
 *   a CommonJS repo on `node16` whose relative imports carry a `.js` suffix, and an ESM repo on
 *   `nodenext` with `"type": "module"`. Unlike `run-unit.harness.ts`, it needs no specimen: each
 *   fixture is the smallest repo that shows its module system, so the test proves the runner reads the
 *   module format off the consumer's own config and runs the code that way.
 *
 *   The fixtures are written as files when a test asks for one, under the repo's gitignored `tmp/`,
 *   rather than committed under core. Core's own tsconfig and lint cover everything under core, and an
 *   ESM fixture is not valid there: it uses `import.meta` and top-level `await`, which a CommonJS
 *   compile refuses. Inside the repo, the nested Jest still resolves `ts-jest` from the repo's own
 *   `node_modules`, exactly as a consumer's install does.
 *
 *   The cache dir is emptied between tests, never renamed, for the reason `run-unit.harness.ts` gives:
 *   its path reaches the runner's Jest config, and one config per format means one compiler. The pid
 *   keeps both paths unique across parallel Jest workers.
 *
 * USAGE:
 * const engine = moduleFormatRunHarness();
 * const result = await engine.run({ fixture: 'esm', relPath: 'src/grade.ts', runId: 'r1' });
 */
import { ensureDirSync, existsSync, readFileSync, rmSync, writeFileSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { dirname, join, resolve } from '#gateway/node/path';
import { pid } from '#gateway/node/process';

import type { RunResult } from '@assayer/shared/contracts';

import { runUnitBroker } from '../../src/brokers/run/unit/run-unit-broker';

const CORE_ROOT = resolve(__dirname, '..', '..');
const FIXTURES_ROOT = resolve(CORE_ROOT, '..', '..', 'tmp', `module-format-fixtures-${String(pid)}`);
const CACHE_DIR = join(tmpdir(), `assayer-module-format-${String(pid)}`);

const LABEL = "export const label = (value: number): string => 'score ' + String(value);\n";

// A module scope driven by the environment: each case writes LEVEL and loads the module again. In an
// ESM run that load is an import, so this is what proves the interpreter awaits a module entry's load.
const LEVEL =
  "const level = Number(process.env.LEVEL);\n\nif (level > 5) {\n  console.log('high');\n} else {\n  console.log('low');\n}\n";

const GRADE_BODY =
  'export function grade(score: number): string {\n  if (score > 5) {\n    return label(score * 2);\n  }\n\n  return label(score);\n}\n';

// Everything here only runs as an ES module: `import.meta`, top-level `await`, a package that ships
// only ESM, and a `.js` specifier naming a `.ts` file.
const GRADE_ESM =
  "// @ts-expect-error esm-only ships no types\nimport { twice } from 'esm-only';\nimport { label } from './label.js';\n\n" +
  'export const origin: string = import.meta.url;\nexport const ready: boolean = await Promise.resolve(true);\n\n' +
  'export function grade(score: number): string {\n  if (score > 5) {\n    return label(twice(score));\n  }\n\n  return label(score);\n}\n';

const COMPILER_OPTIONS = { target: 'ES2022', isolatedModules: true, strict: true, noEmit: true };

const FIXTURES = {
  commonjs: {
    'package.json': JSON.stringify({ name: 'fixture-commonjs', private: true }),
    'tsconfig.json': JSON.stringify({ compilerOptions: { ...COMPILER_OPTIONS, module: 'commonjs', moduleResolution: 'node' } }),
    'src/label.ts': LABEL,
    'src/grade.ts': `import { label } from './label';\n\n${GRADE_BODY}`,
    'src/level.ts': LEVEL,
  },
  'commonjs-node16': {
    'package.json': JSON.stringify({ name: 'fixture-commonjs-node16', private: true }),
    'tsconfig.json': JSON.stringify({ compilerOptions: { ...COMPILER_OPTIONS, module: 'node16', moduleResolution: 'node16' } }),
    'src/label.ts': LABEL,
    // The `.js` suffix names `label.ts`, which only TypeScript's own resolution knows.
    'src/grade.ts': `import { label } from './label.js';\n\n${GRADE_BODY}`,
  },
  esm: {
    'package.json': JSON.stringify({ name: 'fixture-esm', private: true, type: 'module' }),
    'tsconfig.json': JSON.stringify({ compilerOptions: { ...COMPILER_OPTIONS, module: 'nodenext', moduleResolution: 'nodenext' } }),
    'node_modules/esm-only/package.json': JSON.stringify({ name: 'esm-only', type: 'module', exports: './index.js' }),
    'node_modules/esm-only/index.js': 'export const twice = (n) => n * 2;\n',
    'src/label.ts': LABEL,
    'src/grade.ts': GRADE_ESM,
    'src/level.ts': LEVEL,
  },
} as const;

export const moduleFormatRunHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  run: (params: { fixture: keyof typeof FIXTURES; relPath: string; runId: string }) => Promise<RunResult>;
  shimFiles: (params: { runId: string }) => string[];
} => ({
  beforeEach: (): void => {
    rmSync(CACHE_DIR, { recursive: true, force: true });
    ensureDirSync(CACHE_DIR);
  },
  afterEach: (): void => {
    rmSync(CACHE_DIR, { recursive: true, force: true });
    rmSync(FIXTURES_ROOT, { recursive: true, force: true });
  },
  run: async ({ fixture, relPath, runId }): Promise<RunResult> => {
    const repoRoot = join(FIXTURES_ROOT, fixture);
    Object.entries(FIXTURES[fixture]).forEach(([file, content]) => {
      ensureDirSync(dirname(join(repoRoot, file)));
      writeFileSync(join(repoRoot, file), content);
    });
    const absPath = join(repoRoot, relPath);

    return runUnitBroker({
      cacheDir: CACHE_DIR,
      coreRoot: CORE_ROOT,
      repoRoot,
      relPath,
      absPath,
      source: readFileSync(absPath),
      runId,
      analyzerContentHash: 'harness-pinned-hash',
    });
  },
  // Which generated test file the run wrote, named by its extension: `.cjs` for a CommonJS run, `.mjs`
  // for an ESM run.
  shimFiles: ({ runId }): string[] =>
    ['assayer.test.cjs', 'assayer.test.mjs'].filter((file) => existsSync(join(CACHE_DIR, 'runs', runId, file))),
});
