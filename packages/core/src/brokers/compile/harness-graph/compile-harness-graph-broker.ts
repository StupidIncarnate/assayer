/**
 * PURPOSE: The harness stitch — turns the classified harness files into the derived harness index, and
 *   reports every way one of them is wrong as a P1 build error. A TWIN of compileStubGraphBroker: it
 *   reads the already-finished blobs back from the content-keyed store by lookup (never re-parsing),
 *   loads each harness by RUNNING it, and records the sorted (entry, parameter) keys it declares.
 *
 *   It carries a hash the other two indexes cannot. `layoutHash` and `tsconfigHash` come from the
 *   resolved index it is handed, and a harness is in NEITHER — it is classified out of the analysed
 *   surface, so a harness-only edit leaves both unmoved. `harnessHash` digests the harness files' own
 *   paths and content, which is precisely what makes editing one rebuild this index.
 *
 *   Only KEYS are recorded. What a harness declares is a callback or an instance, which does not
 *   serialize and whose absence is what keeps this index deterministic; the run resolves the values by
 *   loading the same file again, so one registration answers both reads.
 *
 *   A harness that could not be READ — no source file at its basename, or a module body that threw — is
 *   reported and left OUT of the index: an entry for it would claim a debt was closed by a file Assayer
 *   never managed to read. A harness that loaded is recorded even when its keys are wrong, because the
 *   index is the inventory of what was declared and the errors are what says the declaration is wrong.
 *
 *   Validation also reads each key's SUPPLIED value at its STATIC type, off the harness's own AST —
 *   `harness-value-types-transformer`, a second, narrower read of the SAME source
 *   `typescript/load-harness` already loaded (a callback is `[Function]` after the sandbox runs, so only
 *   the declaration answers what it IS). That fact is transient — reconciled against the target's
 *   declared param type inside `harness-validate-transformer` and never written into the persisted
 *   index, since nothing downstream needs it back and every compile re-reads the harness's own current
 *   bytes anyway.
 *
 * USAGE:
 * await compileHarnessGraphBroker({ configDir: '/repo', namespace: 'feature-x',
 *   blobsDir: '/repo/.assayer/cache/blobs', resolvedIndex, files, harnesses });
 * // Writes '/repo/.assayer/cache/harness/feature-x.json' and returns { index, errors }
 */
import { compiledFileBlobContract, harnessIndexContract } from '@assayer/shared/contracts';
import type { ContentHash, HarnessIndex, ResolvedIndex } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { harnessValueTypesTransformer } from '../../../transformers/harness-value-types/harness-value-types-transformer';
import { harnessLoadBroker } from '../../harness/load/harness-load-broker';
import { harnessKeysTransformer } from '../../../transformers/harness-keys/harness-keys-transformer';
import { harnessTargetTransformer } from '../../../transformers/harness-target/harness-target-transformer';
import { harnessValidateTransformer } from '../../../transformers/harness-validate/harness-validate-transformer';
import { harnessIndexWriteBroker } from '../../harness-index/write/harness-index-write-broker';
import { readFile } from '#gateway/node/fs__promises';

const HARNESS_LINE = 1;
const HARNESS_COLUMN = 1;

export const compileHarnessGraphBroker = async ({
  configDir,
  namespace,
  blobsDir,
  resolvedIndex,
  files,
  harnesses,
}: {
  configDir: string;
  namespace: string;
  blobsDir: string;
  resolvedIndex: ResolvedIndex;
  files: readonly { relPath: string; contentHash: ContentHash }[];
  harnesses: readonly { relPath: string; content: string }[];
}): Promise<{
  index: HarnessIndex;
  errors: readonly { relPath: string; line: number; column: number; message: string }[];
}> => {
  const ordered = [...harnesses].sort((a, b) => (String(a.relPath) < String(b.relPath) ? -1 : 1));
  const sources = files.map((file) => file.relPath);

  // The harness files' OWN identity, hashed over path + content in path order — the third key, and the
  // only one a harness-only edit moves.
  const harnessHash = contentHashTransformer({
    content: ordered
      .map(
        (harness) =>
          `${String(harness.relPath)}\n${String(contentHashTransformer({ content: String(harness.content) }))}`,
      )
      .join('\n'),
  });

  const read = ordered.map((harness) => {
    const targetRelPath = harnessTargetTransformer({ relPath: harness.relPath, sources });

    if (targetRelPath === undefined) {
      return {
        recorded: [],
        errors: [
          {
            relPath: harness.relPath,
            message:
              `\`${String(harness.relPath)}\` supplies inputs for a file that is not in the analysed surface. A ` +
              'harness is COLOCATED with its source and carries the same basename — `src/audit.ts` is addressed ' +
              'by `src/audit.harness.ts`, always `.ts` even beside a `.tsx`. Move this file beside the source it ' +
              'declares inputs for, or delete it.',
          },
        ],
      };
    }

    const loaded = harnessLoadBroker({
      source: String(harness.content),
      fileName: String(harness.relPath),
    });

    if (!loaded.ok) {
      return {
        recorded: [],
        errors: [
          {
            relPath: harness.relPath,
            message:
              `\`${String(harness.relPath)}\` threw while Assayer read it: ${loaded.message}. Loading IS ` +
              'the read — the `assayerHarness` call is what registers a harness — so a module body that cannot ' +
              'run declares nothing at all. Keep the file to the `assayerHarness` call and the values it hands ' +
              'over.',
          },
        ],
      };
    }

    return {
      recorded: [
        {
          relPath: harness.relPath,
          targetRelPath,
          keys: harnessKeysTransformer({ declarations: loaded.declarations }),
          // The STATIC type of every supplied expression, read off the same source's AST — a SEPARATE,
          // narrower read from the eval-based load above, which only ever produces runtime VALUES.
          suppliedTypes: harnessValueTypesTransformer({
            source: String(harness.content),
            fileName: String(harness.relPath),
          }),
        },
      ],
      errors: [],
    };
  });

  const recorded = read.flatMap((entry) => entry.recorded);

  // Only the blobs a harness actually addresses are read back — the validation asks one question of one
  // file, so there is no reason to load the namespace.
  const hashByRelPath = new Map(files.map((file) => [String(file.relPath), file.contentHash]));
  const targets = [...new Set(recorded.map((harness) => String(harness.targetRelPath)))];
  const analysed = await Promise.all(
    targets.map(async (target) => {
      const raw = (await readFile(`${blobsDir}/${String(hashByRelPath.get(target))}.json`));

      return [target, compiledFileBlobContract.parse(JSON.parse(String(raw)))] as const;
    }),
  );
  const blobByRelPath = new Map(analysed);

  const index = harnessIndexContract.parse({
    layoutHash: resolvedIndex.layoutHash,
    tsconfigHash: resolvedIndex.tsconfigHash,
    harnessHash,
    harnesses: recorded,
  });

  await harnessIndexWriteBroker({ configDir, namespace, index });

  const readErrors = read.flatMap((entry) =>
    entry.errors.map((error) => ({
      relPath: error.relPath,
      line: HARNESS_LINE,
      column: HARNESS_COLUMN,
      message: error.message,
    })),
  );

  const keyErrors = recorded.flatMap((harness) =>
    harnessValidateTransformer({
      relPath: harness.relPath,
      targetRelPath: harness.targetRelPath,
      keys: harness.keys,
      entries: (blobByRelPath.get(String(harness.targetRelPath))?.analysis?.functions ?? []).map((fn) => fn.entry),
      declaringScopes: blobByRelPath.get(String(harness.targetRelPath))?.analysis?.declaringScopes ?? [],
      suppliedTypes: harness.suppliedTypes,
    }),
  );

  return {
    index,
    errors: [...readErrors, ...keyErrors].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)),
  };
};
