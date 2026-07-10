/**
 * PURPOSE: Compiles a single source file into its cached blob — hashing the content, reusing an
 *   already-cached blob for that hash without touching ts-morph, and otherwise extracting the
 *   type-graph map and writing the blob atomically (tmp file + rename) so a crash mid-write never
 *   leaves a corrupt blob at its final path.
 *
 * USAGE:
 * await compileProcessFileBroker({
 *   relPath: 'src/index.ts',
 *   content: 'export function foo() { return 1; }',
 *   blobsDir: '/repo/.assayer/cache/blobs',
 * });
 * // Returns { reused: true, contentHash } when a blob already exists for that content hash,
 * // { reused: false, contentHash } after writing a freshly compiled blob, or
 * // { reused: false, error: { line, column, message } } when the source fails to parse
 */
import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { tsMorphExtractMapAdapter } from '../../../adapters/ts-morph/extract-map/ts-morph-extract-map-adapter';
import { compiledFileBlobContract, relPathContract } from '@assayer/shared/contracts';
import type { ContentHash } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import type { SourcePosition } from '../../../contracts/source-position/source-position-contract';

export const compileProcessFileBroker = async ({
  relPath,
  content,
  blobsDir,
}: {
  relPath: string;
  content: string;
  blobsDir: string;
}): Promise<
  | { reused: true; contentHash: ContentHash }
  | { reused: false; contentHash: ContentHash }
  | { reused: false; error: { message: ErrorMessage } & SourcePosition }
> => {
  const contentHash = cryptoSha256Adapter({ content });
  const blobPath = `${blobsDir}/${contentHash}.json`;

  if (await fsExistsAdapter({ path: blobPath })) {
    return { reused: true, contentHash };
  }

  const extracted = tsMorphExtractMapAdapter({ source: content });

  if (!extracted.success) {
    return {
      reused: false,
      error: {
        line: extracted.error.line,
        column: extracted.error.column,
        message: errorMessageContract.parse(String(extracted.error.message)),
      },
    };
  }

  const lines = content.split('\n').map((text, index) => ({
    n: index + 1,
    text,
    hash: cryptoSha256Adapter({ content: text }),
  }));

  const blob = compiledFileBlobContract.parse({
    relPath: relPathContract.parse(relPath),
    contentHash,
    nodes: extracted.nodes,
    lines,
  });

  await fsMkdirAdapter({ path: blobsDir });
  const tmpPath = `${blobPath}.tmp`;
  await fsWriteFileAdapter({ path: tmpPath, content: JSON.stringify(blob) });
  await fsRenameAdapter({ from: tmpPath, to: blobPath });

  return { reused: false, contentHash };
};
