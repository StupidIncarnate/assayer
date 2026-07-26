/**
 * PURPOSE: Drives the REAL harness stitch over REAL temp repos exactly as a compile would run it —
 *   writes a source file and its colocated `<basename>.harness.ts` to disk, compiles the source into its
 *   content-keyed blob, resolves the graph, then runs the harness stitch and reads the index BACK OFF
 *   DISK, so what is asserted is the file a later run would load rather than the value in memory.
 *
 *   `stitchOnce` proves the whole path for one harness. `stitchTwice` proves the rebuild key: it runs the
 *   same repo twice with the SOURCE untouched and only the HARNESS edited, which is the one edit neither
 *   the layout hash nor the tsconfig hash can see.
 *
 *   `compileTwice` is the same two passes read as a CACHE question, and it returns the three independent
 *   pieces of evidence a harness-only edit owes: what the content-hash cache did with the source (the
 *   `reused` flag `compileProcessFileBroker` itself returns), the harness index that landed on disk, and
 *   the case set a consumer derives from the reused blob through the harness overlay. Nothing here is
 *   timed — every claim is a hash or a flag the code produced.
 *
 *   Owns all node:fs / node:os / node:path and removes each temp dir after the test (auto-wired by the
 *   harness transformer).
 *
 * USAGE:
 * const stitch = harnessGraphHarness();
 * const once = await stitch.stitchOnce({ harness: source });
 * const both = await stitch.stitchTwice({ first: sourceA, second: sourceB });
 * const passes = await stitch.compileTwice({ source: TWO_CALLBACK_SOURCE, first: harnessA, second: harnessB });
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { compiledFileBlobContract, fileAnalysisContract, harnessIndexContract, RelPathStub } from '@assayer/shared/contracts';
import type { ContentHash, FileAnalysis, HarnessIndex } from '@assayer/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { cryptoSha256Adapter } from '../../src/adapters/crypto/sha256/crypto-sha256-adapter';
import { tsMorphWalkFileAdapter } from '../../src/adapters/ts-morph/walk-file/ts-morph-walk-file-adapter';
import { compileProcessFileBroker } from '../../src/brokers/compile/process-file/compile-process-file-broker';
import { compileResolveGraphBroker } from '../../src/brokers/compile/resolve-graph/compile-resolve-graph-broker';
import { compileHarnessGraphBroker } from '../../src/brokers/compile/harness-graph/compile-harness-graph-broker';
import { harnessRealizeBroker } from '../../src/brokers/harness/realize/harness-realize-broker';
import { FileContentsStub } from '../../src/contracts/file-contents/file-contents.stub';
import { FilePathStub } from '../../src/contracts/file-path/file-path.stub';

const NODE_TSCONFIG = '{ "compilerOptions": { "moduleResolution": "node", "esModuleInterop": true } }';
const NAMESPACE = 'main';

const SOURCE_REL = 'src/audit.ts';
const HARNESS_REL = 'src/audit.harness.ts';

export const AUDIT_SOURCE = [
  'export const audit = (report: (message: string) => string, size: number): string => {',
  '  if (size > 3) {',
  "    return report('big');",
  '  }',
  '',
  "  return report('small');",
  '};',
  '',
].join('\n');

// Two refused callables beside one steerable scalar, so a harness can pay HALF the debt. That is what
// makes a harness-only edit move the derived case set: declaring `log` alone leaves the entry uncallable
// (no case, the invoice re-worded to name `sink`), and declaring both turns it into the sound pair.
export const TWO_CALLBACK_SOURCE = [
  'export const audit = (size: number, log: (message: string) => string, sink: (line: string) => string): string => {',
  '  if (size > 3) {',
  "    return sink(log('big'));",
  '  }',
  '',
  "  return sink(log('small'));",
  '};',
  '',
].join('\n');

export const harnessGraphHarness = (): {
  afterEach: () => void;
  stitchOnce: (params: { harness: string }) => Promise<{ written: HarnessIndex; errorMessages: ErrorMessage[] }>;
  stitchTwice: (params: { first: string; second: string }) => Promise<{ first: HarnessIndex; second: HarnessIndex }>;
  compileTwice: (params: { source: string; first: string; second: string }) => Promise<{
    first: { index: HarnessIndex; blob: 'compiled' | 'reused'; contentHash: ContentHash; analysis: FileAnalysis };
    second: { index: HarnessIndex; blob: 'compiled' | 'reused'; contentHash: ContentHash; analysis: FileAnalysis };
  }>;
} => {
  const dirs: ReturnType<typeof FilePathStub>[] = [];

  const blobsDirOf = ({ dir }: { dir: ReturnType<typeof FilePathStub> }): ReturnType<typeof FilePathStub> =>
    FilePathStub({ value: join(String(dir), '.assayer', 'cache', 'blobs') });

  const seed = ({ source }: { source: string }): ReturnType<typeof FilePathStub> => {
    const dir = FilePathStub({ value: realpathSync(mkdtempSync(join(tmpdir(), 'assayer-harness-'))) });
    dirs.push(dir);
    writeFileSync(join(String(dir), 'tsconfig.json'), NODE_TSCONFIG);
    mkdirSync(join(String(dir), 'src'), { recursive: true });
    writeFileSync(join(String(dir), SOURCE_REL), source);

    return dir;
  };

  // One compile PASS: write the harness, put the source through the content-hash cache, resolve the
  // graph, stitch the harness index, and read that index back off disk. The cache's own `reused` flag is
  // carried out rather than inferred, so a caller never has to guess whether the source was re-parsed.
  const stitch = async (params: {
    dir: ReturnType<typeof FilePathStub>;
    source: string;
    harness: string;
  }): Promise<{
    written: HarnessIndex;
    errorMessages: ErrorMessage[];
    blob: 'compiled' | 'reused';
    contentHash: ContentHash;
  }> => {
    const dir = String(params.dir);
    writeFileSync(join(dir, HARNESS_REL), params.harness);

    const blobsDir = String(blobsDirOf({ dir: params.dir }));
    const processed = await compileProcessFileBroker({ relPath: SOURCE_REL, content: params.source, blobsDir });
    const contentHash = cryptoSha256Adapter({ content: params.source });

    const files = [{ relPath: RelPathStub({ value: SOURCE_REL }), contentHash }];
    const resolved = await compileResolveGraphBroker({ root: dir, blobsDir, files });

    const result = await compileHarnessGraphBroker({
      configDir: dir,
      namespace: NAMESPACE,
      blobsDir,
      resolvedIndex: resolved.index,
      files,
      harnesses: [{ relPath: RelPathStub({ value: HARNESS_REL }), content: FileContentsStub({ value: params.harness }) }],
    });

    const written = harnessIndexContract.parse(
      JSON.parse(readFileSync(join(dir, '.assayer', 'cache', 'harness', `${NAMESPACE}.json`), 'utf8')),
    );

    return {
      written,
      errorMessages: result.errors.map((error) => error.message),
      blob: processed.reused ? 'reused' : 'compiled',
      contentHash,
    };
  };

  // What a CONSUMER sees: the blob the compile left on disk, read back and put through the harness
  // overlay exactly as a run or the desktop does. Reading the blob rather than re-analysing is the point
  // — it is the same bytes the cache reused, so any change in the case set came from the harness alone.
  // `walked` is the one exception: a raw PARSE, never a second `FileAnalysis`, so the funnel/through-caller
  // axis the overlay needs is available without deriving a competing analysis to read from.
  const consume = ({
    dir,
    contentHash,
  }: {
    dir: ReturnType<typeof FilePathStub>;
    contentHash: ContentHash;
  }): FileAnalysis => {
    const blob = compiledFileBlobContract.parse(
      JSON.parse(readFileSync(join(String(blobsDirOf({ dir })), `${String(contentHash)}.json`), 'utf8')),
    );
    const walked = tsMorphWalkFileAdapter({
      source: readFileSync(join(String(dir), SOURCE_REL), 'utf8'),
      relPath: SOURCE_REL,
    });

    return harnessRealizeBroker({
      analysis: fileAnalysisContract.parse(blob.analysis),
      root: String(dir),
      relPath: SOURCE_REL,
      walked,
    });
  };

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => {
        rmSync(String(dir), { recursive: true, force: true });
      });
      dirs.length = 0;
    },

    stitchOnce: async ({
      harness,
    }: {
      harness: string;
    }): Promise<{ written: HarnessIndex; errorMessages: ErrorMessage[] }> => {
      const pass = await stitch({ dir: seed({ source: AUDIT_SOURCE }), source: AUDIT_SOURCE, harness });

      return { written: pass.written, errorMessages: pass.errorMessages };
    },

    stitchTwice: async ({
      first,
      second,
    }: {
      first: string;
      second: string;
    }): Promise<{ first: HarnessIndex; second: HarnessIndex }> => {
      const dir = seed({ source: AUDIT_SOURCE });
      const firstRun = await stitch({ dir, source: AUDIT_SOURCE, harness: first });
      const secondRun = await stitch({ dir, source: AUDIT_SOURCE, harness: second });

      return { first: firstRun.written, second: secondRun.written };
    },

    compileTwice: async ({
      source,
      first,
      second,
    }: {
      source: string;
      first: string;
      second: string;
    }): Promise<{
      first: { index: HarnessIndex; blob: 'compiled' | 'reused'; contentHash: ContentHash; analysis: FileAnalysis };
      second: { index: HarnessIndex; blob: 'compiled' | 'reused'; contentHash: ContentHash; analysis: FileAnalysis };
    }> => {
      const dir = seed({ source });
      const firstPass = await stitch({ dir, source, harness: first });
      const firstAnalysis = consume({ dir, contentHash: firstPass.contentHash });
      const secondPass = await stitch({ dir, source, harness: second });
      const secondAnalysis = consume({ dir, contentHash: secondPass.contentHash });

      return {
        first: {
          index: firstPass.written,
          blob: firstPass.blob,
          contentHash: firstPass.contentHash,
          analysis: firstAnalysis,
        },
        second: {
          index: secondPass.written,
          blob: secondPass.blob,
          contentHash: secondPass.contentHash,
          analysis: secondAnalysis,
        },
      };
    },
  };
};
