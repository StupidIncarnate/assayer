/**
 * PURPOSE: Exposes the preload bridge in the renderer — hands the preload adapter the bridge key
 *   and the status, compiled-tree, and compiled-file channels from statics.
 *
 * USAGE:
 * DesktopPreloadExposeResponder();
 * // Exposes window.assayerBridge; returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { electronPreloadBridgeAdapter } from '../../../adapters/electron/preload-bridge/electron-preload-bridge-adapter';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

export const DesktopPreloadExposeResponder = (): AdapterResult =>
  electronPreloadBridgeAdapter({
    bridgeKey: desktopBridgeStatics.bridge.key,
    statusChannel: desktopBridgeStatics.channels.status,
    compiledTreeChannel: desktopBridgeStatics.channels.compiledTree,
    compiledFileChannel: desktopBridgeStatics.channels.compiledFile,
  });
