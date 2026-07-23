/**
 * PURPOSE: The stub stitch — turns finished per-file records into the derived stub index without
 *   re-parsing. A TWIN of compileResolveGraphBroker: it loads every already-compiled blob back from the
 *   content-keyed blob store by lookup, then for every object type a blob declares it splices per-property
 *   value demands onto the type's FULL property list and records which files read it. Keyed on the SAME
 *   `layoutHash` + `tsconfigHash` as the resolved index it is handed (never re-resolved, never
 *   re-hashed), so the two derived indexes rebuild together. It writes `.assayer/cache/stubs/<namespace>.json`
 *   atomically via stubIndexWriteBroker and returns the index.
 *
 *   Which read facts feed each type — and which files read it — is decided in gatherTypeReadsTransformer,
 *   the one seam that INVERTS the resolved index: every reader's per-property demands are UNIONED onto the
 *   type's canonical definition, so a type declared in one file and branched on in several is one stub
 *   keyed on its definition, listing every reader. The per-property value math stays put downstream.
 *
 *   `envStubs` are the env twin: `process.env` is an object, so gatherEnvReadsTransformer folds every
 *   file's `process.env.<X>` reads into one stub per property keyed `process.env#<PROP>`, its `values`
 *   the branch literals guessed plus a representative for anything else (`guessed: true`), its `readers`
 *   the files that read it. This aggregates across the WHOLE namespace, so a property read in several
 *   files is one stub listing them all.
 *
 *   Alongside the index it returns the per-guard `guards` — every object-member branch condition
 *   (`gatherPropertyGuardsTransformer`) — so the committed overlay can be reconciled against what each
 *   corrected value must satisfy: a correction no guard admits is a pre-run contradiction. Guards are
 *   gathered from the SAME blobs, never persisted.
 *
 * USAGE:
 * await compileStubGraphBroker({ configDir: '/repo', namespace: 'feature-x',
 *   blobsDir: '/repo/.assayer/cache/blobs', resolvedIndex, files: [{ relPath, contentHash }] });
 * // Writes '/repo/.assayer/cache/stubs/feature-x.json' and returns { index: StubIndex, guards: PropertyGuard[] }
 */
import {
  compiledFileBlobContract,
  envStubContract,
  objectStubContract,
  relPathContract,
  stubIndexContract,
  stubKeyContract,
} from '@assayer/shared/contracts';
import type { ContentHash, RelPath, ResolvedIndex, StubIndex } from '@assayer/shared/contracts';

import type { PropertyGuard } from '../../../contracts/property-guard/property-guard-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { collectPropertyDemandsTransformer } from '../../../transformers/collect-property-demands/collect-property-demands-transformer';
import { envGuessedValuesTransformer } from '../../../transformers/env-guessed-values/env-guessed-values-transformer';
import { gatherEnvReadsTransformer } from '../../../transformers/gather-env-reads/gather-env-reads-transformer';
import { gatherPropertyGuardsTransformer } from '../../../transformers/gather-property-guards/gather-property-guards-transformer';
import { gatherTypeReadsTransformer } from '../../../transformers/gather-type-reads/gather-type-reads-transformer';
import { stubIndexWriteBroker } from '../../stub-index/write/stub-index-write-broker';

export const compileStubGraphBroker = async ({
  configDir,
  namespace,
  blobsDir,
  resolvedIndex,
  files,
}: {
  configDir: string;
  namespace: string;
  blobsDir: string;
  resolvedIndex: ResolvedIndex;
  files: readonly { relPath: RelPath; contentHash: ContentHash }[];
}): Promise<{ index: StubIndex; guards: PropertyGuard[] }> => {
  const blobs = await Promise.all(
    files.map(async (file) => {
      const raw = await fsReadFileAdapter({ path: `${blobsDir}/${String(file.contentHash)}.json` });
      return compiledFileBlobContract.parse(JSON.parse(String(raw)));
    }),
  );

  const objectStubs = gatherTypeReadsTransformer({ blobs, resolvedIndex })
    .map((group) => {
      const properties = collectPropertyDemandsTransformer({ declaredType: group.declaredType, leaves: group.leaves });
      const readers = [...new Set(group.readers.map((reader) => String(reader)))]
        .sort((a, b) => (a < b ? -1 : 1))
        .map((reader) => relPathContract.parse(reader));

      return objectStubContract.parse({
        key: stubKeyContract.parse(`${String(group.definitionRelPath)}#${String(group.typeName)}`),
        definitionRelPath: group.definitionRelPath,
        typeName: group.typeName,
        properties,
        readers,
      });
    })
    .sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1));

  const envStubs = gatherEnvReadsTransformer({ blobs })
    .map((group) =>
      envStubContract.parse({
        key: stubKeyContract.parse(`process.env#${String(group.property)}`),
        property: group.property,
        values: envGuessedValuesTransformer({ literals: group.literals }),
        guessed: true,
        readers: group.readers,
      }),
    )
    .sort((a, b) => (String(a.key) < String(b.key) ? -1 : 1));

  const index = stubIndexContract.parse({
    layoutHash: resolvedIndex.layoutHash,
    tsconfigHash: resolvedIndex.tsconfigHash,
    objectStubs,
    envStubs,
  });

  await stubIndexWriteBroker({ configDir, namespace, index });

  return { index, guards: gatherPropertyGuardsTransformer({ blobs, resolvedIndex }) };
};
