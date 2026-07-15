/**
 * PURPOSE: Reports whether a statement ALWAYS exits the scope — every path through it returns or
 *   throws, so nothing after it can run. It RECURSES rather than scanning for descendant returns,
 *   which matters: a `return` inside a nested callback is not the enclosing scope's return, and a
 *   scan cannot tell the difference.
 *
 *   This is the STRICT question, and it is deliberately not the same as "are this statement's exits
 *   already accounted for" (see `read-accounted`). An `if` with an else whose arms merely fall
 *   through does NOT always exit — code after it runs on both arms — so treating the two questions
 *   as one silently guards that code by an arm it does not depend on.
 *
 * USAGE:
 * readTerminalLayerAdapter({ node: block.getStatements().at(-1) });
 * // Returns true only when nothing after this statement can possibly run
 */
import { Node } from 'ts-morph';

export const readTerminalLayerAdapter = ({ node }: { node: Node | undefined }): boolean => {
  if (node === undefined) {
    return false;
  }

  if (Node.isReturnStatement(node) || Node.isThrowStatement(node)) {
    return true;
  }

  if (Node.isBlock(node)) {
    return readTerminalLayerAdapter({ node: node.getStatements().at(-1) });
  }

  if (Node.isIfStatement(node)) {
    const elseStatement = node.getElseStatement();
    return (
      elseStatement !== undefined &&
      readTerminalLayerAdapter({ node: node.getThenStatement() }) &&
      readTerminalLayerAdapter({ node: elseStatement })
    );
  }

  if (Node.isSwitchStatement(node)) {
    const clauses = node.getClauses();
    return (
      clauses.some((clause) => Node.isDefaultClause(clause)) &&
      clauses.every((clause) => readTerminalLayerAdapter({ node: clause.getStatements().at(-1) }))
    );
  }

  return false;
};
