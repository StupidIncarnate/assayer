import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFileMapBrokerProxy = (): {
  // `specifier` is the import path the host source spells (e.g. './band-reading'), so each resolve
  // answers only the import that named it.
  setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  // The tsconfig search starts at `root` and finds nothing, so the compiler options are empty.
  noTsconfigAt: ({ root }: { root: string }) => void;
} => {
  // The reaches + funnel transformers are pure and run REAL. The tsconfig read and the sibling resolve
  // are staged, since each reads the real filesystem, which a unit test cannot do. The caller says where
  // the specifier lands, what the sibling's source is, and that no tsconfig sits at the root.
  const tsconfigProxy = tsconfigReadBrokerProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
    },
    noTsconfigAt: ({ root }: { root: string }): void => {
      tsconfigProxy.noTsconfigAt({ searchPath: root });
    },
  };
};
