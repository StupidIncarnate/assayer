import { electronProxy } from '#gateway/npm/electron/electron.proxy';

// Electron's default export is the binary path STRING in a Node context.
export const desktopResolveBinaryBrokerProxy = (): {
  setupBinaryPath: (params: { path: string }) => void;
  setupInsideElectron: () => void;
} => {
  const electronGateway = electronProxy();

  return {
    setupBinaryPath: ({ path }: { path: string }): void => {
      electronGateway.executablePathIs({ path });
    },
    setupInsideElectron: (): void => {
      electronGateway.runningInsideElectron();
    },
  };
};
