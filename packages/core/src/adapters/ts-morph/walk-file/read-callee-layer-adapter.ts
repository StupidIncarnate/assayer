/**
 * PURPOSE: Resolves WHAT a call targets, as a LINK — never a copy. A call to a function DECLARED in
 *   this same file resolves to a `local` link carrying the callee's name and start line, which
 *   together match the scope record the walk opened for it. A call to an IMPORTED name resolves to an
 *   `import` link carrying the module specifier its source is imported from plus the IMPORTED name —
 *   the source name for a named or aliased import (never the local alias), `'default'` for a default
 *   import — for a later stitch pass to resolve to a definition site. Anything the single-file parse
 *   cannot decide — a method or computed callee, a namespace member (`ns.foo()`), an arrow bound to a
 *   const — stays `unresolved`.
 *
 *   The import binding's declaration (the `ImportSpecifier`/`ImportClause`) exists in this file even
 *   when the module itself does not resolve — the import statement declares the local binding symbol
 *   independent of module resolution — so the checker answers here without loading the other file.
 *
 *   It resolves by SYMBOL, the sanctioned move (see read-env-operand): a callee's declaration is a
 *   sibling subtree, not an ancestor, so there is no walk context holding it and none to reconstruct.
 *   Asking the checker for the identifier's declaration is the only question with an answer.
 *
 * USAGE:
 * readCalleeLayerAdapter({ callee: callExpression.getExpression() });
 * // Returns { target: 'local', name: 'inner', startLine: 2 },
 * //         { target: 'import', specifier: './other', importedName: 'foo' }, or { target: 'unresolved' }
 */
import { Node } from 'ts-morph';

import { lineNumberContract, moduleSpecifierContract, symbolNameContract } from '@assayer/shared/contracts';

import type { CalleeLink } from '../../../contracts/call-site/call-site-contract';

const IMPORT_DEFAULT_NAME = 'default';

export const readCalleeLayerAdapter = ({ callee }: { callee: Node }): CalleeLink => {
  if (!Node.isIdentifier(callee)) {
    return { target: 'unresolved' };
  }

  const [declaration, ...rest] = callee.getSymbol()?.getDeclarations() ?? [];

  if (declaration === undefined || rest.length > 0) {
    return { target: 'unresolved' };
  }

  if (Node.isImportSpecifier(declaration)) {
    return {
      target: 'import',
      specifier: moduleSpecifierContract.parse(declaration.getImportDeclaration().getModuleSpecifierValue()),
      importedName: symbolNameContract.parse(declaration.getName()),
    };
  }

  const importParent = declaration.getParent();

  if (Node.isImportClause(declaration) && Node.isImportDeclaration(importParent)) {
    return {
      target: 'import',
      specifier: moduleSpecifierContract.parse(importParent.getModuleSpecifierValue()),
      importedName: symbolNameContract.parse(IMPORT_DEFAULT_NAME),
    };
  }

  const name = Node.isFunctionDeclaration(declaration) ? declaration.getName() : undefined;

  if (name === undefined || declaration.getSourceFile() !== callee.getSourceFile()) {
    return { target: 'unresolved' };
  }

  return {
    target: 'local',
    name: symbolNameContract.parse(name),
    startLine: lineNumberContract.parse(declaration.getStartLineNumber()),
  };
};
