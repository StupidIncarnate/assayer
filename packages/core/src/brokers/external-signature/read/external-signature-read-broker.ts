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
import { externalSignatureContract } from '@assayer/shared/contracts';
import type { ExternalSignature, SymbolName } from '@assayer/shared/contracts';

import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { tsMorphReadExternalSignatureAdapter } from '../../../adapters/ts-morph/read-external-signature/ts-morph-read-external-signature-adapter';

export const externalSignatureReadBroker = async ({
  tsConfigFilePath,
  dtsPath,
  exportName,
  cacheDir,
}: {
  tsConfigFilePath: FilePath;
  dtsPath: FilePath;
  exportName: SymbolName;
  cacheDir: string;
}): Promise<{ usable: true; signature: ExternalSignature } | { usable: false }> => {
  const dtsContent = String(await fsReadFileAdapter({ path: String(dtsPath) }));
  const declHash = cryptoSha256Adapter({ content: `${String(exportName)}\n${dtsContent}` });
  const dir = `${cacheDir}/external-signatures`;
  const cachePath = `${dir}/${String(declHash)}.json`;

  if (await fsExistsAdapter({ path: cachePath })) {
    const cached = String(await fsReadFileAdapter({ path: cachePath }));

    return { usable: true, signature: externalSignatureContract.parse(JSON.parse(cached) as unknown) };
  }

  const read = tsMorphReadExternalSignatureAdapter({ tsConfigFilePath, dtsPath, exportName });

  if (!read.usable) {
    return { usable: false };
  }

  await fsMkdirAdapter({ path: dir });
  const tmpPath = `${cachePath}.tmp`;
  await fsWriteFileAdapter({ path: tmpPath, content: JSON.stringify(read.signature) });
  await fsRenameAdapter({ from: tmpPath, to: cachePath });

  return { usable: true, signature: read.signature };
};
