/**
 * PURPOSE: Reads one ambient-external reference's declared type (an ambient global like `console.log`
 *   or `process.env`, or a CALLED node builtin import like `join` from `node:path`), cached by the
 *   RESOLVING `.d.ts` byte content plus the reference path so the derived payload is persisted for reuse
 *   by every user and across runs. It resolves through the second node_modules-aware project, hashes the
 *   `.d.ts` the type came from (keyed with the reference path, since one `.d.ts` declares many names),
 *   and writes the payload to `.assayer/cache/global-signatures/<hash>.json` once (skipping the write
 *   when it already exists). A reference `@types/node` cannot type ships no usable types — not cached,
 *   since there is no payload to reuse.
 *
 * USAGE:
 * await externalSignatureReadGlobalBroker({ tsConfigFilePath, reference: { kind: 'global', name: 'process', member: 'env', called: false }, cacheDir });
 * // Returns { usable: true, result: 'signature', signature } | { usable: true, result: 'type', type } | { usable: false }
 */
import type { ExternalSignature, ModuleSpecifier, SymbolName, TypeDescriptor } from '@assayer/shared/contracts';

import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { tsMorphReadGlobalSignatureAdapter } from '../../../adapters/ts-morph/read-global-signature/ts-morph-read-global-signature-adapter';

type GlobalReference =
  | { kind: 'global'; name: SymbolName; member?: SymbolName; called: boolean }
  | { kind: 'builtin'; specifier: ModuleSpecifier; importedName: SymbolName; called: boolean };

type GlobalSignatureResult =
  | { usable: true; result: 'signature'; signature: ExternalSignature }
  | { usable: true; result: 'type'; type: TypeDescriptor }
  | { usable: false };

export const externalSignatureReadGlobalBroker = async ({
  tsConfigFilePath,
  reference,
  cacheDir,
}: {
  tsConfigFilePath: FilePath;
  reference: GlobalReference;
  cacheDir: string;
}): Promise<GlobalSignatureResult> => {
  const read = tsMorphReadGlobalSignatureAdapter({ tsConfigFilePath, reference });

  if (!read.usable) {
    return { usable: false };
  }

  // The reference path distinguishes many names declared in one `.d.ts`; the `.d.ts` bytes (carried out
  // of ts-morph, since a `lib.*.d.ts` has no readable on-disk path) make the key move only when the
  // declared type does.
  const referenceKey =
    reference.kind === 'builtin'
      ? `b:${String(reference.specifier)} ${String(reference.importedName)} ${String(reference.called)}`
      : `g:${String(reference.name)}.${reference.member === undefined ? '' : String(reference.member)}.${String(reference.called)}`;

  const cacheKey = cryptoSha256Adapter({ content: `${referenceKey}\n${String(read.declText)}` });
  const dir = `${cacheDir}/global-signatures`;
  const cachePath = `${dir}/${String(cacheKey)}.json`;

  const payload =
    read.result === 'signature' ? { result: 'signature', signature: read.signature } : { result: 'type', type: read.type };

  if (!(await fsExistsAdapter({ path: cachePath }))) {
    await fsMkdirAdapter({ path: dir });
    const tmpPath = `${cachePath}.tmp`;
    await fsWriteFileAdapter({ path: tmpPath, content: JSON.stringify(payload) });
    await fsRenameAdapter({ from: tmpPath, to: cachePath });
  }

  return read.result === 'signature'
    ? { usable: true, result: 'signature', signature: read.signature }
    : { usable: true, result: 'type', type: read.type };
};
