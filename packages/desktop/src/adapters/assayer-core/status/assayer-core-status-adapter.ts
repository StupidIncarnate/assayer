/**
 * PURPOSE: Adapter boundary to the @assayer/core status seam — lets the IPC responder reach
 *   core's status broker without a direct cross-package import.
 *
 * USAGE:
 * assayerCoreStatusAdapter();
 * // Returns the core StatusResult { version, message }
 */
import { statusGetBroker } from '@assayer/core/brokers';
import type { StatusResult } from '@assayer/core/contracts';

export const assayerCoreStatusAdapter = (): StatusResult => statusGetBroker();
