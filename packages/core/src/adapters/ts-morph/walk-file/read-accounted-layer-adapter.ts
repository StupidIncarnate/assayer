/**
 * PURPOSE: Reports whether a statement's ways OUT are already emitted as exits — the question a
 *   scope asks before adding a completion exit of its own, and an `if`/`switch` asks before adding
 *   one per arm. In TAIL position an `if` with an else is accounted for even when its arms merely
 *   fall through, because each arm gets a synthesized completion exit; the same holds for a `switch`
 *   with a default. Without that else or default, the unwritten path falls through and the scope
 *   still owes an exit.
 *
 *   It is deliberately SEPARATE from `read-terminal`, which asks the stricter "does this always
 *   exit". Conflating them is a real bug, not a nicety: `read-terminal` decides whether code AFTER a
 *   statement is guarded by one of its arms, and an `if` whose arms fall through does not guard what
 *   follows it at all — the code runs on both arms. One predicate cannot answer both.
 *
 * USAGE:
 * readAccountedLayerAdapter({ node: block.getStatements().at(-1) });
 * // Returns true when this statement's exits are already covered, so the scope owes none
 */
import { Node } from 'ts-morph';

import { readTerminalLayerAdapter } from './read-terminal-layer-adapter';

export const readAccountedLayerAdapter = ({ node }: { node: Node | undefined }): boolean => {
  if (node === undefined) {
    return false;
  }

  if (readTerminalLayerAdapter({ node })) {
    return true;
  }

  if (Node.isBlock(node)) {
    return readAccountedLayerAdapter({ node: node.getStatements().at(-1) });
  }

  if (Node.isIfStatement(node)) {
    return node.getElseStatement() !== undefined;
  }

  if (Node.isSwitchStatement(node)) {
    return node.getClauses().some((clause) => Node.isDefaultClause(clause));
  }

  return false;
};
