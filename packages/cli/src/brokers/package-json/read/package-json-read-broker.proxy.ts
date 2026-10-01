import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { join } from '#gateway/node/path';

export const packageJsonReadBrokerProxy = (): {
  packageJsonHasVersion: (params: { version: string }) => void;
} => {
  const readFileGateway = readFileProxy();

  return {
    packageJsonHasVersion: ({ version }: { version: string }): void => {
      readFileGateway.returns({
        path: join(__dirname, '../../../../package.json'),
        contents: JSON.stringify({ version }),
      });
    },
  };
};
