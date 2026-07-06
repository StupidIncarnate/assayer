import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

// Electron's module export is the binary path STRING in a Node context. Expose it as an
// esModule default so `import electron from 'electron'` resolves to the string.
registerModuleMock({
  module: 'electron',
  factory: () => ({ __esModule: true, default: '/usr/bin/electron' }),
});

export const electronBinaryPathAdapterProxy = (): Record<PropertyKey, never> => ({});
