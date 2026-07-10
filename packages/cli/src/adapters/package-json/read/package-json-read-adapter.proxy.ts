import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const packageJsonReadAdapterProxy = (): Record<PropertyKey, never> => {
  const handle = registerMock({ fn: readFile });

  handle.mockResolvedValue(JSON.stringify({ version: '1.0.0' }));

  return {};
};
