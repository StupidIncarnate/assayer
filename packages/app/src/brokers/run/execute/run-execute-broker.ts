/**
 * PURPOSE: Runs one file's derived cases via the preload bridge adapter. Atomic broker — the seam a
 *   Run button calls.
 *
 * USAGE:
 * await runExecuteBroker({ relPath });
 * // Returns the RunResult the CLI just produced and saved
 */
import { assayerBridgeRunFileAdapter } from '../../../adapters/assayer-bridge/run-file/assayer-bridge-run-file-adapter';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

export const runExecuteBroker = async ({ relPath }: { relPath: RelPath }): Promise<RunResult> =>
  assayerBridgeRunFileAdapter({ relPath });
