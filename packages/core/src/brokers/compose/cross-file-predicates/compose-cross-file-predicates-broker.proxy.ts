import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFilePredicatesBrokerProxy = (): {
  // `specifier` is the import path the caller source spells (e.g. './big'), so each resolve answers
  // only the import that named it.
  setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesTo: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
  // The tsconfig search starts at `root` and finds nothing, so the compiler options are empty.
  noTsconfigAt: ({ root }: { root: string }) => void;
} => {
  // The tsconfig read and the sibling resolve are staged, since each reads the real filesystem, which a
  // unit test cannot do. The caller says where a specifier lands, what its source is, and that no
  // tsconfig sits at the root.
  const tsconfigProxy = tsconfigReadBrokerProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a composable branch
    // needs.
    setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }): void => {
      sibling.resolvesToSibling({ fileName, source, specifier });
    },
    // Resolution lands somewhere but its source is never read — a node_modules / outside-root file the
    // compose skips as non-local.
    resolvesTo: ({ fileName, specifier }: { fileName: string; specifier: string }): void => {
      sibling.resolvesToOutside({ fileName, specifier });
    },
    noTsconfigAt: ({ root }: { root: string }): void => {
      tsconfigProxy.noTsconfigAt({ searchPath: root });
    },
  };
};
