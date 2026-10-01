import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const packageJsonReadBrokerProxy = (): Record<PropertyKey, never> => {
  const handle = registerMock({ fn: readFile });

  handle.calledWith([]).resolves(JSON.stringify({ version: '1.0.0' }));

  return {};
};
