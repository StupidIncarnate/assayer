/**
 * PURPOSE: Decomposes a property-access operand (`config.mode`, `a.b.c`) into its ROOT node — the
 *   leftmost expression the chain reads off — and the ordered `.member` chain from that root outward.
 *   `config.mode` yields `{ root: <config>, path: ['mode'] }`; `a.b.c` yields `{ root: <a>, path:
 *   ['b','c'] }`. A non-property-access node is its own root with an empty chain.
 *
 *   The member NAMES come from `getName()` on each access — the accessed identifier's name, which
 *   carries no formatting freedom (§5.1) — so the chain is spelling-invariant and safe for identity.
 *   `read-condition` reads the root's own name and declared type-reference off the returned root; this
 *   layer owns only the structural walk down the chain.
 *
 * USAGE:
 * readPropertyPathLayerAdapter({ node: propertyAccessExpression });
 * // Returns { root, path: ['mode'] } — path left-to-right from the root outward
 */
import { Node } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

export interface PropertyPathReadout {
  root: Node;
  path: SymbolName[];
}

export const readPropertyPathLayerAdapter = ({ node }: { node: Node }): PropertyPathReadout => {
  if (Node.isPropertyAccessExpression(node)) {
    const inner = readPropertyPathLayerAdapter({ node: node.getExpression() });

    return { root: inner.root, path: [...inner.path, symbolNameContract.parse(node.getName())] };
  }

  return { root: node, path: [] };
};
