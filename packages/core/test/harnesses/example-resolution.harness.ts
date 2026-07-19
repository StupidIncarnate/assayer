/**
 * PURPOSE: Drives the REAL cross-file stitch over the ACTUAL committed cross-file example specimens —
 *   the `import-local/`, `npm-package/`, and `node-builtin/` folders the catalogue analyses single-file.
 *   Where the catalogue proves each import's SHAPE, this proves each import RESOLVES: it copies the real
 *   specimen bytes into a fresh temp repo (with a vendored fixture package under node_modules so the bare
 *   specifier resolves offline), compiles each into its content-keyed blob, and runs the resolver —
 *   asserting the sibling call resolves LOCAL, the vendored import a PACKAGE, and the node builtin a
 *   BUILTIN. A colocated broken variant imports a specifier that resolves to nothing, so the same stitch
 *   raises its exact build error. Owns all node:fs / node:os / node:path and removes each temp dir after
 *   the test (auto-wired by the harness transformer).
 *
 * USAGE:
 * const stitch = exampleResolutionHarness();
 * const result = await stitch.resolveExamples();  // the real committed example specimens
 * const broken = await stitch.resolveBroken();    // an import that resolves to nothing
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';

import { RelPathStub } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../src/adapters/crypto/sha256/crypto-sha256-adapter';
import { compileProcessFileBroker } from '../../src/brokers/compile/process-file/compile-process-file-broker';
import { compileResolveGraphBroker } from '../../src/brokers/compile/resolve-graph/compile-resolve-graph-broker';
import { FilePathStub } from '../../src/contracts/file-path/file-path.stub';

const SMOKE_REPO = resolve(__dirname, '..', '..', '..', '..', 'smoke-repo');
const CATALOGUE = 'packages/syntax-repository/src';

const NODE_TSCONFIG = '{ "compilerOptions": { "moduleResolution": "node", "esModuleInterop": true } }';
const VENDORED_PKG_JSON = '{ "name": "vendored-fixture", "version": "1.0.0", "types": "index.d.ts" }';
const VENDORED_DTS = 'export declare const greet: () => string;\n';
const BROKEN_SRC = "import { gone } from './missing';\n\nexport const value = gone();\n";

// A minimal `@types/node` so the second (node_modules-aware) reader project types the ambient globals
// and the `node:path` builtin offline and deterministically. `console` is typed by the host lib the
// second project already loads, so it needs no declaration here.
const NODE_TYPES_PKG_JSON = '{ "name": "@types/node", "version": "1.0.0", "types": "index.d.ts" }';
const NODE_TYPES_DTS =
  'interface ProcessEnv { [key: string]: string | undefined; }\n' +
  'declare var process: { env: ProcessEnv; cwd(): string };\n' +
  "declare module 'node:path' {\n  export function join(...paths: string[]): string;\n}\n";

const USES_CONSOLE = `${CATALOGUE}/node-global/uses-console.ts`;
const USES_PROCESS = `${CATALOGUE}/node-global/uses-process.ts`;
const CALLS_JOIN = `${CATALOGUE}/node-builtin/calls-join.ts`;

// The committed example specimens, resolved as one set exactly as a compile would resolve them: the
// imported definition, the sibling that calls it, the vendored-package call, and the node-builtin value.
const GREETING = `${CATALOGUE}/import-local/greeting.ts`;
const USES_GREETING = `${CATALOGUE}/import-local/uses-greeting.ts`;
const USES_PACKAGE = `${CATALOGUE}/npm-package/uses-package.ts`;
const USES_BUILTIN = `${CATALOGUE}/node-builtin/uses-builtin.ts`;

type ResolveResult = Awaited<ReturnType<typeof compileResolveGraphBroker>>;

export const exampleResolutionHarness = (): {
  afterEach: () => void;
  resolveExamples: () => Promise<ResolveResult>;
  resolveBroken: () => Promise<ResolveResult>;
  resolveNodeExamples: () => Promise<ResolveResult>;
} => {
  const dirs: ReturnType<typeof FilePathStub>[] = [];

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => {
        rmSync(String(dir), { recursive: true, force: true });
      });
      dirs.length = 0;
    },

    resolveNodeExamples: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-node-example-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'node_modules', '@types', 'node'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'package.json'), NODE_TYPES_PKG_JSON);
      writeFileSync(join(dir, 'node_modules', '@types', 'node', 'index.d.ts'), NODE_TYPES_DTS);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      const cacheDir = join(dir, '.assayer', 'cache');

      const files = await Promise.all(
        [USES_CONSOLE, USES_PROCESS, CALLS_JOIN].map(async (relPath) => {
          const content = readFileSync(join(SMOKE_REPO, relPath), 'utf8');
          mkdirSync(join(dir, dirname(relPath)), { recursive: true });
          writeFileSync(join(dir, relPath), content);
          await compileProcessFileBroker({ relPath, content, blobsDir });
          return { relPath: RelPathStub({ value: relPath }), contentHash: cryptoSha256Adapter({ content }) };
        }),
      );

      return compileResolveGraphBroker({ root: dir, blobsDir, cacheDir, files });
    },

    resolveExamples: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-example-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'node_modules', 'vendored-fixture'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', 'vendored-fixture', 'package.json'), VENDORED_PKG_JSON);
      writeFileSync(join(dir, 'node_modules', 'vendored-fixture', 'index.d.ts'), VENDORED_DTS);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');

      const files = await Promise.all(
        [GREETING, USES_GREETING, USES_PACKAGE, USES_BUILTIN].map(async (relPath) => {
          const content = readFileSync(join(SMOKE_REPO, relPath), 'utf8');
          mkdirSync(join(dir, dirname(relPath)), { recursive: true });
          writeFileSync(join(dir, relPath), content);
          await compileProcessFileBroker({ relPath, content, blobsDir });
          return { relPath: RelPathStub({ value: relPath }), contentHash: cryptoSha256Adapter({ content }) };
        }),
      );

      return compileResolveGraphBroker({ root: dir, blobsDir, files });
    },

    resolveBroken: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-example-broken-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      const relPath = `${CATALOGUE}/import-local/broken.ts`;
      mkdirSync(join(dir, dirname(relPath)), { recursive: true });
      writeFileSync(join(dir, relPath), BROKEN_SRC);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath, content: BROKEN_SRC, blobsDir });

      return compileResolveGraphBroker({
        root: dir,
        blobsDir,
        files: [{ relPath: RelPathStub({ value: relPath }), contentHash: cryptoSha256Adapter({ content: BROKEN_SRC }) }],
      });
    },
  };
};
