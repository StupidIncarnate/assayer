import { tsconfigReadBrokerProxy } from '../../tsconfig/read/tsconfig-read-broker.proxy';
import { resolveSiblingCalleeBrokerProxy } from '../../resolve-sibling/callee/resolve-sibling-callee-broker.proxy';

export const composeCrossFilePredicatesBrokerProxy = (): {
  // `specifier` is optional — only needed when a test composes more than one imported guard, so each
  // resolve can be matched to the import it actually answers instead of call order.
  setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier?: string }) => void;
  resolvesTo: ({ fileName }: { fileName: string }) => void;
} => {
  // The tsconfig read runs REAL; the sibling resolve is staged, since resolving a specifier against a
  // real filesystem is exactly what a unit test cannot do — the caller says where a specifier lands and
  // what its source is instead.
  tsconfigReadBrokerProxy();
  const sibling = resolveSiblingCalleeBrokerProxy();

  return {
    // The sibling both RESOLVES to `fileName` and READS back `source` — the pair a composable branch
    // needs.
    setupSibling: ({ fileName, source, specifier }: { fileName: string; source: string; specifier?: string }): void => {
      sibling.resolvesToSibling({ fileName, source, ...(specifier === undefined ? {} : { specifier }) });
    },
    // Resolution lands somewhere but its source is never read — a node_modules / outside-root file the
    // compose skips as non-local.
    resolvesTo: ({ fileName }: { fileName: string }): void => {
      sibling.resolvesToOutside({ fileName });
    },
  };
};
