/**
 * PURPOSE: Resolves WHAT a call targets, as a LINK — never a copy. A call to a function DECLARED in
 *   this same file resolves to a `local` link carrying the callee's name and start line, which
 *   together match the scope record the walk opened for it. A call to an IMPORTED name resolves to an
 *   `import` link carrying the module specifier its source is imported from plus the IMPORTED name —
 *   the source name for a named or aliased import (never the local alias), `'default'` for a default
 *   import — for a later stitch pass to resolve to a definition site. A `const`/`let` bound to an arrow
 *   or function expression is a local link too: same file, same resolved symbol, keyed on the
 *   INITIALIZER's line, which is where the walk opened that callee's scope. Anything the single-file
 *   parse cannot decide — a method or computed callee, a namespace member (`ns.foo()`) — stays
 *   `unresolved`.
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
 * readCalleeLayerTransformer({ callee: callExpression.getExpression() });
 * // Returns { target: 'local', name: 'inner', startLine: 2 },
 * //         { target: 'import', specifier: './other', importedName: 'foo' }, or { target: 'unresolved' }
 */
import { Node } from '#gateway/npm/ts-morph';


import type { CalleeLink } from '../../contracts/call-site/call-site-contract';
import { calleeLinkContract } from '../../contracts/call-site/call-site-contract';

const IMPORT_DEFAULT_NAME = 'default';

export const readCalleeLayerTransformer = ({ callee }: { callee: Node }): CalleeLink => {
  if (!Node.isIdentifier(callee)) {
    return { target: 'unresolved' };
  }

  const [declaration, ...rest] = callee.getSymbol()?.getDeclarations() ?? [];

  if (declaration === undefined || rest.length > 0) {
    return { target: 'unresolved' };
  }

  if (Node.isImportSpecifier(declaration)) {
    return calleeLinkContract.parse({
      target: 'import',
      specifier: declaration.getImportDeclaration().getModuleSpecifierValue(),
      importedName: declaration.getName(),
    });
  }

  const importParent = declaration.getParent();

  if (Node.isImportClause(declaration) && Node.isImportDeclaration(importParent)) {
    return calleeLinkContract.parse({
      target: 'import',
      specifier: importParent.getModuleSpecifierValue(),
      importedName: IMPORT_DEFAULT_NAME,
    });
  }

  // A `const`/`let` bound to an arrow or function expression declares a function exactly as a
  // `FunctionDeclaration` does — the same resolved SYMBOL, one node further down — and it is the
  // dominant function style in modern TypeScript. Both are read off the declaration's KIND, never its
  // spelling. The walk opens the callee's scope on the INITIALIZER, so the link's line is read there
  // rather than off the binding: a binding whose arrow starts on the next line would otherwise name a
  // line no scope record carries.
  const initializer = Node.isVariableDeclaration(declaration) ? declaration.getInitializer() : undefined;
  const definition = Node.isFunctionDeclaration(declaration)
    ? { name: declaration.getName(), node: declaration }
    : Node.isVariableDeclaration(declaration) &&
        initializer !== undefined &&
        (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))
      ? { name: declaration.getName(), node: initializer }
      : undefined;

  if (definition?.name === undefined || declaration.getSourceFile() !== callee.getSourceFile()) {
    return { target: 'unresolved' };
  }

  return calleeLinkContract.parse({
    target: 'local',
    name: definition.name,
    startLine: definition.node.getStartLineNumber(),
  });
};
