import { resolvePackageRootProxy } from '#gateway/node/module/resolve-package-root/resolve-package-root.proxy';

// Nothing is staged: the compiler host reads TypeScript's lib files and `@types/node` from the real disk.
// Those files are not the code under test, and a staged copy of them would hide a broken compiler setup.
export const specimensTypecheckBrokerProxy = (): Record<PropertyKey, never> => {
  resolvePackageRootProxy();

  return {};
};
