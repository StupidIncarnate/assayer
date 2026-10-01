import { readFile } from 'fs/promises';
import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const packageJsonReadBrokerProxy = (): Record<PropertyKey, never> => {
  const handle = registerMock({ fn: readFile });

  const packageJsonPath = join(__dirname, '../../../../package.json');

  handle.calledWith([packageJsonPath, 'utf8']).resolves(JSON.stringify({ version: '1.0.0' }));

  return {};
};
