import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';

export const compileProgressRenderBrokerProxy = (): {
  getWrites: () => string[];
  enableTty: () => void;
} => {
  const stdoutGateway = stdoutProxy();

  return {
    getWrites: (): string[] => stdoutGateway.getWrites().map((chunk) => String(chunk)),
    enableTty: (): void => {
      stdoutGateway.setupIsTty({ value: true });
    },
  };
};
