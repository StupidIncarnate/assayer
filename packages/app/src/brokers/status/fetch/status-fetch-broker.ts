/**
 * PURPOSE: Fetches the assayer status view via the preload bridge adapter. Atomic broker — the
 *   single seam the status binding subscribes to.
 *
 * USAGE:
 * await statusFetchBroker();
 * // Returns the StatusView from the desktop main process
 */
import { assayerBridgeGetStatusAdapter } from '../../../adapters/assayer-bridge/get-status/assayer-bridge-get-status-adapter';
import type { StatusView } from '../../../contracts/status-view/status-view-contract';

export const statusFetchBroker = async (): Promise<StatusView> => assayerBridgeGetStatusAdapter();
