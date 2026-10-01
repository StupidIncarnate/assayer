import { desktopLaunchBrokerProxy } from '@assayer/desktop/testing';

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
