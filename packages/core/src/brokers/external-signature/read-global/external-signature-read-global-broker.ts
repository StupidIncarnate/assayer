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
import type { ExternalSignature, TypeDescriptor } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { externalSignatureReadGlobalDeclarationBroker } from '../read-global-declaration/external-signature-read-global-declaration-broker';
import { ensureDir, pathExists, rename, writeFile } from '#gateway/node/fs__promises';

type GlobalReference =
  | { kind: 'global'; name: string; member?: string; called: boolean }
  | { kind: 'builtin'; specifier: string; importedName: string; called: boolean };

type GlobalSignatureResult =
  | { usable: true; result: 'signature'; signature: ExternalSignature }
  | { usable: true; result: 'type'; type: TypeDescriptor }
  | { usable: false };

export const externalSignatureReadGlobalBroker = async ({
  tsConfigFilePath,
  reference,
  cacheDir,
}: {
  tsConfigFilePath: string;
  reference: GlobalReference;
  cacheDir: string;
}): Promise<GlobalSignatureResult> => {
  const read = externalSignatureReadGlobalDeclarationBroker({ tsConfigFilePath, reference });

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

  const cacheKey = contentHashTransformer({ content: `${referenceKey}\n${String(read.declText)}` });
  const dir = `${cacheDir}/global-signatures`;
  const cachePath = `${dir}/${String(cacheKey)}.json`;

  const payload =
    read.result === 'signature' ? { result: 'signature', signature: read.signature } : { result: 'type', type: read.type };

  if (!(await pathExists(cachePath))) {
    await ensureDir(dir);
    const tmpPath = `${cachePath}.tmp`;
    await writeFile(tmpPath, JSON.stringify(payload));
    await rename(tmpPath, cachePath);
  }

  return read.result === 'signature'
    ? { usable: true, result: 'signature', signature: read.signature }
    : { usable: true, result: 'type', type: read.type };
};
