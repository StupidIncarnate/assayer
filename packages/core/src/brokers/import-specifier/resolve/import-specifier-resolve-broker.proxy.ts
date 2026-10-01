import { resolveModuleFileProxy } from '#gateway/npm/typescript/resolve-module-file/resolve-module-file.proxy';

export const importSpecifierResolveBrokerProxy = (): {
  // Each resolve is staged by the specifier the caller asks for, plus the containing file when the
  // caller knows it. A specifier no scenario staged reaches an unstaged call, which throws.
  resolvesTo: (params: { specifier: string; containingFile?: string; fileName: string }) => void;
  resolvesToOnce: (params: { specifier: string; containingFile?: string; fileName: string }) => void;
  resolvesToNothing: (params: { specifier: string; containingFile?: string }) => void;
  resolvesToNothingOnce: (params: { specifier: string; containingFile?: string }) => void;
} => {
  const resolveGateway = resolveModuleFileProxy();

  return {
    resolvesTo: ({ specifier, containingFile, fileName }): void => {
      resolveGateway.resolves({
        specifier,
        ...(containingFile === undefined ? {} : { containingFile }),
        resolvedFileName: fileName,
      });
    },
    resolvesToOnce: ({ specifier, containingFile, fileName }): void => {
      resolveGateway.resolvesOnce({
        specifier,
        ...(containingFile === undefined ? {} : { containingFile }),
        resolvedFileName: fileName,
      });
    },
    resolvesToNothing: ({ specifier, containingFile }): void => {
      resolveGateway.resolvesNothing({ specifier, ...(containingFile === undefined ? {} : { containingFile }) });
    },
    resolvesToNothingOnce: ({ specifier, containingFile }): void => {
      resolveGateway.resolvesNothingOnce({ specifier, ...(containingFile === undefined ? {} : { containingFile }) });
    },
  };
};
