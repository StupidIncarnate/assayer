export const processStdoutIsTtyAdapterProxy = (): {
  enableTty: () => void;
  disableTty: () => void;
} => {
  return {
    enableTty: (): void => {
      process.stdout.isTTY = true;
    },
    disableTty: (): void => {
      process.stdout.isTTY = false;
    },
  };
};
