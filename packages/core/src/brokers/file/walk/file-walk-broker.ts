/**
 * PURPOSE: Walks one source file on disk under the compiler options of the tsconfig that owns it. Reach for this,
 *   not `walkFileTransformer` directly, whenever the file's absolute path is known: the owner lookup is what makes
 *   a file read against its own `lib`, `target` and strict flags. `relPath` still names the file inside the walk,
 *   so coverage IDs never depend on where the repo sits on disk.
 *
 * USAGE:
 * fileWalkBroker({ source: 'export const n = 1;', relPath: 'src/n.ts', absPath: '/repo/src/n.ts' });
 * // Returns the WalkFileResult walkFileTransformer gives under /repo's owning tsconfig
 */
import type { WalkFileResult } from '../../../contracts/walk-file-result/walk-file-result-contract';
import { walkFileTransformer } from '../../../transformers/walk-file/walk-file-transformer';
import { tsconfigOwnerBroker } from '../../tsconfig/owner/tsconfig-owner-broker';

export const fileWalkBroker = ({
  source,
  relPath,
  absPath,
}: {
  source: string;
  relPath: string;
  absPath: string;
}): WalkFileResult =>
  walkFileTransformer({ source, relPath, compilerOptions: tsconfigOwnerBroker({ absPath }).options });
