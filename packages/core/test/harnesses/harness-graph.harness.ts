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
import { mkdtempSync, ensureDirSync, writeFileSync, readFileSync, realpathSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';

import { compiledFileBlobContract, fileAnalysisContract, harnessIndexContract } from '@assayer/shared/contracts';
import type { ContentHash, FileAnalysis, HarnessIndex } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../src/transformers/content-hash/content-hash-transformer';
import { walkFileTransformer } from '../../src/transformers/walk-file/walk-file-transformer';
import { compileProcessFileBroker } from '../../src/brokers/compile/process-file/compile-process-file-broker';
import { compileResolveGraphBroker } from '../../src/brokers/compile/resolve-graph/compile-resolve-graph-broker';
import { compileHarnessGraphBroker } from '../../src/brokers/compile/harness-graph/compile-harness-graph-broker';
import { harnessRealizeBroker } from '../../src/brokers/harness/realize/harness-realize-broker';

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
  stitchOnce: (params: { harness: string }) => Promise<{ written: HarnessIndex; errorMessages: string[] }>;
  stitchTwice: (params: { first: string; second: string }) => Promise<{ first: HarnessIndex; second: HarnessIndex }>;
  compileTwice: (params: { source: string; first: string; second: string }) => Promise<{
    first: { index: HarnessIndex; blob: 'compiled' | 'reused'; contentHash: ContentHash; analysis: FileAnalysis };
    second: { index: HarnessIndex; blob: 'compiled' | 'reused'; contentHash: ContentHash; analysis: FileAnalysis };
  }>;
} => {
  const dirs: string[] = [];

  const blobsDirOf = ({ dir }: { dir: string }): string =>
    join(dir, '.assayer', 'cache', 'blobs');

  const seed = ({ source }: { source: string }): string => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'assayer-harness-')));
    dirs.push(dir);
    writeFileSync(join(dir, 'tsconfig.json'), NODE_TSCONFIG);
    ensureDirSync(join(dir, 'src'));
    writeFileSync(join(dir, SOURCE_REL), source);

    return dir;
  };

  // One compile PASS: write the harness, put the source through the content-hash cache, resolve the
  // graph, stitch the harness index, and read that index back off disk. The cache's own `reused` flag is
  // carried out rather than inferred, so a caller never has to guess whether the source was re-parsed.
  const stitch = async (params: {
    dir: string;
    source: string;
    harness: string;
  }): Promise<{
    written: HarnessIndex;
    errorMessages: string[];
    blob: 'compiled' | 'reused';
    contentHash: ContentHash;
  }> => {
    const dir = params.dir;
    writeFileSync(join(dir, HARNESS_REL), params.harness);

    const blobsDir = blobsDirOf({ dir: params.dir });
    const processed = await compileProcessFileBroker({ relPath: SOURCE_REL, content: params.source, blobsDir });
    const contentHash = contentHashTransformer({ content: params.source });

    const files = [{ relPath: SOURCE_REL, contentHash }];
    const resolved = await compileResolveGraphBroker({ root: dir, blobsDir, files });

    const result = await compileHarnessGraphBroker({
      configDir: dir,
      namespace: NAMESPACE,
      blobsDir,
      resolvedIndex: resolved.index,
      files,
      harnesses: [{ relPath: HARNESS_REL, content: params.harness }],
    });

    const written = harnessIndexContract.parse(
      JSON.parse(readFileSync(join(dir, '.assayer', 'cache', 'harness', `${NAMESPACE}.json`))),
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
    dir: string;
    contentHash: ContentHash;
  }): FileAnalysis => {
    const blob = compiledFileBlobContract.parse(
      JSON.parse(readFileSync(join(blobsDirOf({ dir }), `${String(contentHash)}.json`))),
    );
    const walked = walkFileTransformer({
      source: readFileSync(join(dir, SOURCE_REL)),
      relPath: SOURCE_REL,
    });

    return harnessRealizeBroker({
      analysis: fileAnalysisContract.parse(blob.analysis),
      root: dir,
      relPath: SOURCE_REL,
      walked,
    });
  };

  return {
    afterEach: (): void => {
      dirs.forEach((dir) => {
        rmSync(dir, { recursive: true, force: true });
      });
      dirs.length = 0;
    },

    stitchOnce: async ({
      harness,
    }: {
      harness: string;
    }): Promise<{ written: HarnessIndex; errorMessages: string[] }> => {
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
