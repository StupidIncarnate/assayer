/**
 * PURPOSE: Resolves WHAT a call targets, as a LINK — never a copy. A call to a function DECLARED in
 *   this same file resolves to a `local` link carrying the callee's name and start line, which
 *   together match the scope record the walk opened for it. Anything the single-file parse cannot see
 *   as a same-file function declaration — an imported name, a method or computed callee, an arrow
 *   bound to a const — is `unresolved`. Cross-file and package targets are a separate epic; the
 *   in-memory single-file project cannot resolve them (see core CLAUDE.md §5.10), so this never
 *   guesses one.
 *
 *   It resolves by SYMBOL, the sanctioned move (see read-env-operand): a callee's declaration is a
 *   sibling subtree, not an ancestor, so there is no walk context holding it and none to reconstruct.
 *   Asking the checker for the identifier's declaration is the only question with an answer.
 *
 * USAGE:
 * readCalleeLayerAdapter({ callee: callExpression.getExpression() });
 * // Returns { target: 'local', name: 'inner', startLine: 2 } or { target: 'unresolved' }
 */
import { Node } from 'ts-morph';

import { lineNumberContract, symbolNameContract } from '@assayer/shared/contracts';

import type { CalleeLink } from '../../../contracts/call-site/call-site-contract';

export const readCalleeLayerAdapter = ({ callee }: { callee: Node }): CalleeLink => {
  if (!Node.isIdentifier(callee)) {
    return { target: 'unresolved' };
  }

  const [declaration, ...rest] = callee.getSymbol()?.getDeclarations() ?? [];
  const name = Node.isFunctionDeclaration(declaration) ? declaration.getName() : undefined;

  if (
    declaration === undefined ||
    rest.length > 0 ||
    name === undefined ||
    declaration.getSourceFile() !== callee.getSourceFile()
  ) {
    return { target: 'unresolved' };
  }

  return {
    target: 'local',
    name: symbolNameContract.parse(name),
    startLine: lineNumberContract.parse(declaration.getStartLineNumber()),
  };
};
