import { resolvePackageRootProxy } from '#gateway/node/module/resolve-package-root/resolve-package-root.proxy';

// Nothing is staged: the lookup reads the real installed `typescript` package, which is not the code under test.
export const typescriptLibLocateBrokerProxy = (): Record<PropertyKey, never> => {
  resolvePackageRootProxy();

  return {};
};
