/**
 * PURPOSE: Drives the REAL stub stitch over committed object specimens exactly as a compile would run
 *   it — copies the specimen bytes into a fresh temp repo, compiles each into its content-keyed blob,
 *   resolves the graph, then runs the stub stitch and returns its derived index.
 *
 *   `stubBranchLocal` proves the SAME-FILE case: `branch-local` declares `Config` and reads
 *   `config.mode` in one file (imports nothing, so an empty resolved index), and the branched VALUE is
 *   still collected as a demand on `Config` spliced onto its full property list. `stubCrossFileShape`
 *   proves the CROSS-FILE union: `Config` is declared in `types.ts` and branched on by two importing
 *   readers, so the stitch inverts the resolved index and unions each reader's per-property demand onto
 *   the one definition-keyed stub, listing both readers. `stubMultiRead` proves the ENV-as-object case:
 *   `multi-read` reads `process.env.CODE` (a switch discriminant) and `process.env.MODE` (a bare
 *   compare), which the stitch folds into per-property env stubs with guessed values — a CONTROLLED
 *   fixture (this one file only) so the assertion is independent of the whole-namespace aggregation.
 *
 *   Owns all node:fs / node:os / node:path and removes each temp dir after the test (auto-wired by the
 *   harness transformer).
 *
 * USAGE:
 * const stitch = stubGraphHarness();
 * const result = await stitch.stubBranchLocal();     // { index: StubIndex } — same-file
 * const crossFile = await stitch.stubCrossFileShape(); // { index: StubIndex } — cross-file union
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';

import { RelPathStub } from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../src/adapters/crypto/sha256/crypto-sha256-adapter';
import { compileProcessFileBroker } from '../../src/brokers/compile/process-file/compile-process-file-broker';
import { compileResolveGraphBroker } from '../../src/brokers/compile/resolve-graph/compile-resolve-graph-broker';
import { compileStubGraphBroker } from '../../src/brokers/compile/stub-graph/compile-stub-graph-broker';
import { FilePathStub } from '../../src/contracts/file-path/file-path.stub';

const SMOKE_REPO = resolve(__dirname, '..', '..', '..', '..', 'smoke-repo');
const CATALOGUE = 'packages/syntax-repository/src';
const NODE_TSCONFIG = '{ "compilerOptions": { "moduleResolution": "node", "esModuleInterop": true } }';

export const BRANCH_LOCAL_REL = `${CATALOGUE}/happy-path/object/branch-local/branch-local.ts`;
export const MULTI_READ_REL = `${CATALOGUE}/sad-path/env-object/multi-read/multi-read.ts`;

const CROSS_FILE_SHAPE_DIR = `${CATALOGUE}/happy-path/object/cross-file-shape`;
export const CROSS_FILE_SHAPE_TYPES_REL = `${CROSS_FILE_SHAPE_DIR}/types.ts`;
const CROSS_FILE_SHAPE_ROOT_REL = `${CROSS_FILE_SHAPE_DIR}/cross-file-shape.ts`;
const CROSS_FILE_SHAPE_READER_B_REL = `${CROSS_FILE_SHAPE_DIR}/reader-b.ts`;
export const CROSS_FILE_SHAPE_READERS = [CROSS_FILE_SHAPE_ROOT_REL, CROSS_FILE_SHAPE_READER_B_REL];

type StubResult = Awaited<ReturnType<typeof compileStubGraphBroker>>;

export const stubGraphHarness = (): {
  afterEach: () => void;
  stubBranchLocal: () => Promise<StubResult>;
  stubCrossFileShape: () => Promise<StubResult>;
  stubMultiRead: () => Promise<StubResult>;
} => {
  const dirs: ReturnType<typeof FilePathStub>[] = [];

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => {
        rmSync(String(dir), { recursive: true, force: true });
      });
      dirs.length = 0;
    },

    stubBranchLocal: async (): Promise<StubResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-stub-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);

      const content = readFileSync(join(SMOKE_REPO, BRANCH_LOCAL_REL), 'utf8');
      mkdirSync(join(dir, dirname(BRANCH_LOCAL_REL)), { recursive: true });
      writeFileSync(join(dir, BRANCH_LOCAL_REL), content);

      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: BRANCH_LOCAL_REL, content, blobsDir });

      const files = [{ relPath: RelPathStub({ value: BRANCH_LOCAL_REL }), contentHash: cryptoSha256Adapter({ content }) }];
      const resolved = await compileResolveGraphBroker({ root: dir, blobsDir, files });

      return compileStubGraphBroker({ configDir: dir, namespace: 'main', blobsDir, resolvedIndex: resolved.index, files });
    },

    stubMultiRead: async (): Promise<StubResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-stub-env-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);

      const content = readFileSync(join(SMOKE_REPO, MULTI_READ_REL), 'utf8');
      mkdirSync(join(dir, dirname(MULTI_READ_REL)), { recursive: true });
      writeFileSync(join(dir, MULTI_READ_REL), content);

      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');
      await compileProcessFileBroker({ relPath: MULTI_READ_REL, content, blobsDir });

      const files = [{ relPath: RelPathStub({ value: MULTI_READ_REL }), contentHash: cryptoSha256Adapter({ content }) }];
      const resolved = await compileResolveGraphBroker({ root: dir, blobsDir, files });

      return compileStubGraphBroker({ configDir: dir, namespace: 'main', blobsDir, resolvedIndex: resolved.index, files });
    },

    stubCrossFileShape: async (): Promise<StubResult> => {
      const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-stub-xf-')));
      dirs.push(FilePathStub({ value: dir }));
      writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
      const blobsDir = join(dir, '.assayer', 'cache', 'blobs');

      const files = await Promise.all(
        [CROSS_FILE_SHAPE_ROOT_REL, CROSS_FILE_SHAPE_READER_B_REL, CROSS_FILE_SHAPE_TYPES_REL].map(async (relPath) => {
          const content = readFileSync(join(SMOKE_REPO, relPath), 'utf8');
          mkdirSync(join(dir, dirname(relPath)), { recursive: true });
          writeFileSync(join(dir, relPath), content);
          await compileProcessFileBroker({ relPath, content, blobsDir });
          return { relPath: RelPathStub({ value: relPath }), contentHash: cryptoSha256Adapter({ content }) };
        }),
      );

      const resolved = await compileResolveGraphBroker({ root: dir, blobsDir, files });

      return compileStubGraphBroker({ configDir: dir, namespace: 'main', blobsDir, resolvedIndex: resolved.index, files });
    },
  };
};
