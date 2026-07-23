/**
 * PURPOSE: Fetches the merged stub view via the preload bridge adapter. Atomic broker — the single
 *   seam the stub-index binding subscribes to.
 *
 * USAGE:
 * await stubIndexFetchBroker();
 * // Returns the StubView from the desktop main process
 */
import { assayerBridgeGetStubsAdapter } from '../../../adapters/assayer-bridge/get-stubs/assayer-bridge-get-stubs-adapter';
import type { StubView } from '@assayer/shared/contracts';

export const stubIndexFetchBroker = async (): Promise<StubView> => assayerBridgeGetStubsAdapter();
