import { runConsoleFindBrokerProxy } from '@assayer/core/brokers/run/console-find/run-console-find-broker.proxy';
import { runFindBrokerProxy } from '@assayer/core/brokers/run/find/run-find-broker.proxy';

import { desktopBootBrokerProxy } from '../../../brokers/desktop/boot/desktop-boot-broker.proxy';
import { statusResolveBrokerProxy } from '../../../brokers/status/resolve/status-resolve-broker.proxy';
import { compiledTreeResolveBrokerProxy } from '../../../brokers/compiled-tree/resolve/compiled-tree-resolve-broker.proxy';
import { compiledFileResolveBrokerProxy } from '../../../brokers/compiled-file/resolve/compiled-file-resolve-broker.proxy';
import { stubIndexResolveBrokerProxy } from '../../../brokers/stub-index/resolve/stub-index-resolve-broker.proxy';
import { repoSourceRootBrokerProxy } from '../../../brokers/repo/source-root/repo-source-root-broker.proxy';
import { runExecuteBrokerProxy } from '../../../brokers/run/execute/run-execute-broker.proxy';

export const DesktopMainBootResponderProxy = (): {
  setupBoot: () => void;
  handledChannels: () => readonly string[];
  invokeHandler: (params: { channel: string; relPath?: unknown }) => Promise<unknown>;
} => {
  const bootProxy = desktopBootBrokerProxy();
  statusResolveBrokerProxy();
  // Bare-invoked (never wired for setup): our tests validate/reject relPath before the
  // compiled-tree/compiled-file/run brokers would ever run — see enforce-proxy-child-creation.
  compiledTreeResolveBrokerProxy();
  compiledFileResolveBrokerProxy();
  stubIndexResolveBrokerProxy();
  repoSourceRootBrokerProxy();
  runExecuteBrokerProxy();
  runFindBrokerProxy();
  runConsoleFindBrokerProxy();

  return {
    setupBoot: (): void => {
      bootProxy.setupBoot({ dev: false, headless: false });
    },
    handledChannels: (): readonly string[] => bootProxy.handledChannels(),
    invokeHandler: async ({
      channel,
      relPath,
    }: {
      channel: string;
      relPath?: unknown;
    }): Promise<unknown> => bootProxy.invokeHandler({ channel, arg: relPath }),
  };
};
