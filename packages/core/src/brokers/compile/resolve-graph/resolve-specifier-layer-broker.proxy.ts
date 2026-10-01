import { importSpecifierResolveBrokerProxy } from '../../import-specifier/resolve/import-specifier-resolve-broker.proxy';

export const resolveSpecifierLayerBrokerProxy = (): {
  // Each resolve is staged by the specifier the caller asks for. Following a re-export barrel resolves
  // more than one specifier in one run (the barrel, then the name it forwards to), so each specifier
  // answers only the call that names it. A specifier no scenario staged reaches an unstaged call, which
  // throws.
  resolvesLocal: ({ specifier, fileName }: { specifier: string; fileName: string }) => void;
  resolvesLocalOnce: ({ specifier, fileName }: { specifier: string; fileName: string }) => void;
  resolvesUnresolved: ({ specifier }: { specifier: string }) => void;
} => {
  // The path `relative` call runs REAL (deterministic path math). The module resolver runs REAL too,
  // over the typescript gateway's resolver, which its proxy stages per specifier.
  const resolveProxy = importSpecifierResolveBrokerProxy();

  return {
    resolvesLocal: ({ specifier, fileName }: { specifier: string; fileName: string }): void => {
      resolveProxy.resolvesTo({ specifier, fileName });
    },
    resolvesLocalOnce: ({ specifier, fileName }: { specifier: string; fileName: string }): void => {
      resolveProxy.resolvesToOnce({ specifier, fileName });
    },
    resolvesUnresolved: ({ specifier }: { specifier: string }): void => {
      resolveProxy.resolvesToNothing({ specifier });
    },
  };
};
