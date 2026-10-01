import { registerMock } from '@dungeonmaster/testing/register-mock';

import { importSpecifierResolveBroker } from '../../import-specifier/resolve/import-specifier-resolve-broker';
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
  // The path `relative` call runs REAL (deterministic path math). The module resolver stays replaced:
  // it runs `ts.resolveModuleName` over `ts.sys`, which reads the real disk, and no gateway proxy can
  // stage `ts.sys`. The caller says where a specifier lands instead.
  importSpecifierResolveBrokerProxy();

  const resolveHandle = registerMock({ fn: importSpecifierResolveBroker });

  return {
    resolvesLocal: ({ specifier, fileName }: { specifier: string; fileName: string }): void => {
      resolveHandle
        .calledWith([{ specifier }])
        .returns({ resolved: true, fileName: fileName });
    },
    resolvesLocalOnce: ({ specifier, fileName }: { specifier: string; fileName: string }): void => {
      resolveHandle
        .onceFor([{ specifier }])
        .returns({ resolved: true, fileName: fileName });
    },
    resolvesUnresolved: ({ specifier }: { specifier: string }): void => {
      resolveHandle.calledWith([{ specifier }]).returns({ resolved: false });
    },
  };
};
