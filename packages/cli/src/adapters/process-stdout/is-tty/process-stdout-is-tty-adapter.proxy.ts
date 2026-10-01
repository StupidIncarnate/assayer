import { stdout } from '#gateway/node/process';

export const processStdoutIsTtyAdapterProxy = (): {
  enableTty: () => void;
  disableTty: () => void;
} => {
  return {
    enableTty: (): void => {
      stdout.isTTY = true;
    },
    disableTty: (): void => {
      stdout.isTTY = false;
    },
  };
};
