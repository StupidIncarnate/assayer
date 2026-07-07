/**
 * PURPOSE: Produces the assayer core status payload (version + readiness message) that the
 *   CLI prints and the desktop IPC bridge returns to the renderer. The single core seam
 *   both front-ends call; grows into real analyzer status reporting later.
 *
 * USAGE:
 * statusGetBroker();
 * // Returns a validated StatusResult, e.g. { version: '1.0.0', message: 'Assayer core online' }
 */
import { statusResultContract } from '@assayer/shared/contracts';
import type { StatusResult } from '@assayer/shared/contracts';

import { assayerVersionStatics } from '../../../statics/assayer-version/assayer-version-statics';

export const statusGetBroker = (): StatusResult =>
  statusResultContract.parse({
    version: assayerVersionStatics.release.version,
    message: 'Assayer core online',
  });
