/**
 * PURPOSE: Reads one external callable's declared signature, cached by the `.d.ts` byte content so it
 *   is derived at most once and reused by every importer. It hashes the resolved `.d.ts` bytes (keyed
 *   with the export name, since one `.d.ts` declares many exports) and, if a signature is already
 *   cached at `.assayer/cache/external-signatures/<declHash>.json`, returns it WITHOUT touching
 *   ts-morph; otherwise it reads the signature through the second node_modules-aware project, writes
 *   the cache atomically (tmp + rename), and returns it. An export that names no callable ships no
 *   usable types — not cached, since there is no signature to reuse.
 *
 * USAGE:
 * await externalSignatureReadBroker({ tsConfigFilePath, dtsPath, exportName, cacheDir: '/repo/.assayer/cache' });
 * // Returns { usable: true, signature: { params, returnType } } or { usable: false }
 */
import { externalSignatureReadResultContract } from '../../../contracts/external-signature-read-result/external-signature-read-result-contract';
import type { ExternalSignatureReadResult } from '../../../contracts/external-signature-read-result/external-signature-read-result-contract';
import { externalSignatureContract } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { externalSignatureReadDeclarationBroker } from '../read-declaration/external-signature-read-declaration-broker';
import { ensureDir, pathExists, readFile, rename, writeFile } from '#gateway/node/fs__promises';

export const externalSignatureReadBroker = async ({
  tsConfigFilePath,
  dtsPath,
  exportName,
  cacheDir,
}: {
  tsConfigFilePath: string;
  dtsPath: string;
  exportName: string;
  cacheDir: string;
}): Promise<ExternalSignatureReadResult> => {
  const dtsContent = (await readFile(dtsPath));
  const declHash = contentHashTransformer({ content: `${exportName}\n${dtsContent}` });
  const dir = `${cacheDir}/external-signatures`;
  const cachePath = `${dir}/${declHash}.json`;

  if (await pathExists(cachePath)) {
    const cached = (await readFile(cachePath));

    return externalSignatureReadResultContract.parse({ usable: true, signature: externalSignatureContract.parse(JSON.parse(cached) as unknown) });
  }

  const read = externalSignatureReadDeclarationBroker({ tsConfigFilePath, dtsPath, exportName });

  if (!read.usable) {
    return externalSignatureReadResultContract.parse({ usable: false });
  }

  await ensureDir(dir);
  const tmpPath = `${cachePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(read.signature));
  await rename(tmpPath, cachePath);

  return externalSignatureReadResultContract.parse({ usable: true, signature: read.signature });
};
