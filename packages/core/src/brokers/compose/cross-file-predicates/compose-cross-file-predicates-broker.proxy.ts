import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFilePredicatesBrokerProxy = (): {
  // `specifier` is the import path the caller source spells (e.g. './big'), so each resolve answers
  // only the import that named it.
  setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier: string }) => void;
  resolvesTo: ({ fileName, specifier }: { fileName: string; specifier: string }) => void;
} => {
  // The tsconfig read runs REAL; the sibling resolve is staged, since resolving a specifier against a
  // real filesystem is exactly what a unit test cannot do — the caller says where a specifier lands and
  // what its source is instead.
  tsconfigReadBrokerProxy();
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
  };
};
