/**
 * PURPOSE: Drives the REAL cross-file stitch against REAL temp repos — writes a tsconfig, source
 *   files, and vendored node_modules packages to a fresh temp dir per scenario; compiles each source
 *   into its real content-keyed blob; then runs compileResolveGraphBroker with real TypeScript module
 *   resolution. Owns all node:fs / node:os / node:path so a colocated .integration.test.ts asserts on
 *   what actually resolved without touching builtins itself. The temp dirs are removed after each test
 *   (auto-wired by the harness transformer).
 *
 * USAGE:
 * const stitch = resolveGraphHarness();
 * const result = await stitch.resolveMixedRepo();   // local + builtin + package imports
 * const barrel = await stitch.resolveBarrelRepo();  // an import chased through a re-export barrel
 * const broken = await stitch.resolveBrokenRepo();  // an import that resolves to nothing
 */
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { RelPathStub } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../src/adapters/crypto/sha256/crypto-sha256-adapter';
import { compileProcessFileBroker } from '../../src/brokers/compile/process-file/compile-process-file-broker';
import { compileResolveGraphBroker } from '../../src/brokers/compile/resolve-graph/compile-resolve-graph-broker';
import { FilePathStub } from '../../src/contracts/file-path/file-path.stub';

const NODE_TSCONFIG = '{ "compilerOptions": { "moduleResolution": "node", "esModuleInterop": true } }';
const VENDORED_PKG_JSON = '{ "name": "vendored-pkg", "version": "1.0.0", "types": "index.d.ts" }';
const VENDORED_DTS = 'export declare const greet: () => string;\n';

const FOO_SRC = 'export const foo = (): number => 1;\n';
const CALLER_SRC = [
  "import { foo } from '../b/foo';",
  "import { readFile } from 'node:fs';",
  "import { greet } from 'vendored-pkg';",
  'foo();',
  'greet();',
  "readFile('x', () => undefined);",
  '',
].join('\n');
const BARREL_SRC = "export { foo } from '../b/foo';\n";
const USER_SRC = "import { foo } from '../barrel';\nfoo();\n";
const BROKEN_SRC = "import { gone } from './missing';\ngone();\n";
const DYNAMIC_SRC = 'declare const name: string;\nimport(name);\n';

type ResolveResult = Awaited<ReturnType<typeof compileResolveGraphBroker>>;

export const resolveGraphHarness = (): {
  afterEach: () => void;
  resolveMixedRepo: () => Promise<ResolveResult>;
  resolveTypedRepo: () => Promise<ResolveResult>;
  resolveBarrelRepo: () => Promise<ResolveResult>;
  resolveBrokenRepo: () => Promise<ResolveResult>;
  resolveDynamicRepo: () => Promise<ResolveResult>;
} => {
  const dirs: ReturnType<typeof FilePathStub>[] = [];

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => { rmSync(String(dir), { recursive: true, force: true }); });
      dirs.length = 0;
    },

    resolveMixedRepo: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-stitch-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'node_modules', 'vendored-pkg'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', 'vendored-pkg', 'package.json'), VENDORED_PKG_JSON);
      writeFileSync(join(dir, 'node_modules', 'vendored-pkg', 'index.d.ts'), VENDORED_DTS);
      mkdirSync(join(dir, 'src', 'a'), { recursive: true });
      mkdirSync(join(dir, 'src', 'b'), { recursive: true });
      writeFileSync(join(dir, 'src', 'b', 'foo.ts'), FOO_SRC);
      writeFileSync(join(dir, 'src', 'a', 'caller.ts'), CALLER_SRC);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: 'src/b/foo.ts', content: FOO_SRC, blobsDir });
      await compileProcessFileBroker({ relPath: 'src/a/caller.ts', content: CALLER_SRC, blobsDir });

      return compileResolveGraphBroker({
        root: dir,
        blobsDir,
        files: [
          { relPath: RelPathStub({ value: 'src/b/foo.ts' }), contentHash: cryptoSha256Adapter({ content: FOO_SRC }) },
          { relPath: RelPathStub({ value: 'src/a/caller.ts' }), contentHash: cryptoSha256Adapter({ content: CALLER_SRC }) },
        ],
      });
    },

    resolveTypedRepo: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-typed-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'node_modules', 'vendored-pkg'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', 'vendored-pkg', 'package.json'), VENDORED_PKG_JSON);
      writeFileSync(join(dir, 'node_modules', 'vendored-pkg', 'index.d.ts'), VENDORED_DTS);
      mkdirSync(join(dir, 'src', 'a'), { recursive: true });
      mkdirSync(join(dir, 'src', 'b'), { recursive: true });
      writeFileSync(join(dir, 'src', 'b', 'foo.ts'), FOO_SRC);
      writeFileSync(join(dir, 'src', 'a', 'caller.ts'), CALLER_SRC);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: 'src/b/foo.ts', content: FOO_SRC, blobsDir });
      await compileProcessFileBroker({ relPath: 'src/a/caller.ts', content: CALLER_SRC, blobsDir });

      return compileResolveGraphBroker({
        root: dir,
        blobsDir,
        cacheDir: join(dir, '.assayer', 'cache'),
        files: [
          { relPath: RelPathStub({ value: 'src/b/foo.ts' }), contentHash: cryptoSha256Adapter({ content: FOO_SRC }) },
          { relPath: RelPathStub({ value: 'src/a/caller.ts' }), contentHash: cryptoSha256Adapter({ content: CALLER_SRC }) },
        ],
      });
    },

    resolveBarrelRepo: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-barrel-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'src', 'b'), { recursive: true });
      mkdirSync(join(dir, 'src', 'barrel'), { recursive: true });
      mkdirSync(join(dir, 'src', 'c'), { recursive: true });
      writeFileSync(join(dir, 'src', 'b', 'foo.ts'), FOO_SRC);
      writeFileSync(join(dir, 'src', 'barrel', 'index.ts'), BARREL_SRC);
      writeFileSync(join(dir, 'src', 'c', 'user.ts'), USER_SRC);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: 'src/b/foo.ts', content: FOO_SRC, blobsDir });
      await compileProcessFileBroker({ relPath: 'src/barrel/index.ts', content: BARREL_SRC, blobsDir });
      await compileProcessFileBroker({ relPath: 'src/c/user.ts', content: USER_SRC, blobsDir });

      return compileResolveGraphBroker({
        root: dir,
        blobsDir,
        files: [
          { relPath: RelPathStub({ value: 'src/b/foo.ts' }), contentHash: cryptoSha256Adapter({ content: FOO_SRC }) },
          { relPath: RelPathStub({ value: 'src/barrel/index.ts' }), contentHash: cryptoSha256Adapter({ content: BARREL_SRC }) },
          { relPath: RelPathStub({ value: 'src/c/user.ts' }), contentHash: cryptoSha256Adapter({ content: USER_SRC }) },
        ],
      });
    },

    resolveBrokenRepo: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-broken-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'broken.ts'), BROKEN_SRC);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: 'src/broken.ts', content: BROKEN_SRC, blobsDir });

      return compileResolveGraphBroker({
        root: dir,
        blobsDir,
        files: [{ relPath: RelPathStub({ value: 'src/broken.ts' }), contentHash: cryptoSha256Adapter({ content: BROKEN_SRC }) }],
      });
    },

    resolveDynamicRepo: async (): Promise<ResolveResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-dynamic-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'dynamic.ts'), DYNAMIC_SRC);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: 'src/dynamic.ts', content: DYNAMIC_SRC, blobsDir });

      return compileResolveGraphBroker({
        root: dir,
        blobsDir,
        files: [{ relPath: RelPathStub({ value: 'src/dynamic.ts' }), contentHash: cryptoSha256Adapter({ content: DYNAMIC_SRC }) }],
      });
    },
  };
};
