import { electronDesktopBootAdapterProxy } from '../../../adapters/electron/desktop-boot/electron-desktop-boot-adapter.proxy';
import { statusResolveBrokerProxy } from '../../../brokers/status/resolve/status-resolve-broker.proxy';
import { compiledTreeResolveBrokerProxy } from '../../../brokers/compiled-tree/resolve/compiled-tree-resolve-broker.proxy';
import { compiledFileResolveBrokerProxy } from '../../../brokers/compiled-file/resolve/compiled-file-resolve-broker.proxy';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

export const DesktopMainBootResponderProxy = (): {
  handledChannels: () => unknown[];
  invokeCompiledFileHandler: (params: { relPath?: unknown }) => Promise<unknown>;
} => {
  const bootProxy = electronDesktopBootAdapterProxy();
  statusResolveBrokerProxy();
  // Bare-invoked (never wired for setup): our tests validate/reject relPath before the
  // compiled-tree/compiled-file brokers would ever run — see enforce-proxy-child-creation.
  compiledTreeResolveBrokerProxy();
  compiledFileResolveBrokerProxy();

  return {
    handledChannels: (): unknown[] => bootProxy.handledChannels(),
    invokeCompiledFileHandler: async ({ relPath }: { relPath?: unknown }): Promise<unknown> =>
      bootProxy.invokeHandler({ channel: desktopBridgeStatics.channels.compiledFile, arg: relPath }),
  };
};
