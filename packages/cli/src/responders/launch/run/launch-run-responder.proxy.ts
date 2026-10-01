import { desktopLaunchBrokerProxy } from '@assayer/desktop/brokers/desktop/launch/desktop-launch-broker.proxy';

export const LaunchRunResponderProxy = (): {
  launchSpawns: (params: { repoPath: string }) => void;
} => {
  const launchProxy = desktopLaunchBrokerProxy();

  return {
    launchSpawns: ({ repoPath }: { repoPath: string }): void => {
      launchProxy.launchSpawns({ repoPath });
    },
  };
};
