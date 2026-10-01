/**
 * PURPOSE: Exposes the preload bridge in the renderer — hands the preload adapter the bridge key
 *   and every channel from statics.
 *
 * USAGE:
 * DesktopPreloadExposeResponder();
 * // Exposes window.assayerBridge; returns { success: true }
 */

import { desktopBridgeExposeBroker } from '../../../brokers/desktop-bridge/expose/desktop-bridge-expose-broker';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

export const DesktopPreloadExposeResponder = (): void =>
  desktopBridgeExposeBroker({
    bridgeKey: desktopBridgeStatics.bridge.key,
    statusChannel: desktopBridgeStatics.channels.status,
    compiledTreeChannel: desktopBridgeStatics.channels.compiledTree,
    compiledFileChannel: desktopBridgeStatics.channels.compiledFile,
    stubsChannel: desktopBridgeStatics.channels.stubs,
    runChannel: desktopBridgeStatics.channels.run,
    savedRunChannel: desktopBridgeStatics.channels.savedRun,
    savedConsoleChannel: desktopBridgeStatics.channels.savedConsole,
    runOutputChannel: desktopBridgeStatics.channels.runOutput,
  });
