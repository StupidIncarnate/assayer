/**
 * PURPOSE: Handles a variable statement (`const x = …`, `let y = …`) — records ONE value use per
 *   declaration whose initializer REFERENCES an existing binding, as a loose fact (claimed by the
 *   enclosing scope, exactly like a call) and descends every child so nested scopes, branches, and
 *   calls hiding in an initializer are still found (D22). A value use is a data flow that is not a
 *   call, so it rides its OWN channel — never `calls`, which the follow-calls machinery reads as real
 *   invocations.
 *
 *   The use is a LINK, never a copy: an initializer that is a bare identifier resolves by SYMBOL
 *   exactly as `read-callee` does — an IMPORT (specifier + imported name), a same-file LOCAL function,
 *   or, when the name is one the hermetic walk cannot type (`process`, `console`), an ambient GLOBAL.
 *   An initializer that is a property access off an ambient root (`process.env`) records the global
 *   with its member. Anything else — a literal, a call, a reference to a local const — moves no
 *   tracked binding and records nothing; the children still descend so a function or branch inside the
 *   initializer is never dropped.
 *
 * USAGE:
 * handleVariableLayerAdapter({ node: variableStatement, context });
 * // Returns a HandlerResult with the value uses it found and the child descents
 */
import { Node } from 'ts-morph';
import type { VariableStatement } from 'ts-morph';

import { symbolNameContract } from '@assayer/shared/contracts';
import type { SymbolName } from '@assayer/shared/contracts';

import type { WalkContext } from '../../../contracts/walk-context/walk-context-contract';
import { valueUseContract } from '../../../contracts/value-use/value-use-contract';
import type { ValueUse } from '../../../contracts/value-use/value-use-contract';
import { handlerResultLayerAdapter } from './handler-result-layer-adapter';
import { readAmbientRootLayerAdapter } from './read-ambient-root-layer-adapter';
import { readCalleeLayerAdapter } from './read-callee-layer-adapter';

export const handleVariableLayerAdapter = ({
  node,
  context,
}: {
  node: VariableStatement;
  context: WalkContext;
}): ReturnType<typeof handlerResultLayerAdapter> => {
  const valueUses = node
    .getDeclarationList()
    .getDeclarations()
    .flatMap((declaration): ValueUse[] => {
      const initializer = declaration.getInitializer();

      if (initializer === undefined) {
        return [];
      }

      // `const e = process.env` — a member access whose ROOT is an ambient global the walk cannot type.
      if (Node.isPropertyAccessExpression(initializer)) {
        const root = initializer.getExpression();
        return readAmbientRootLayerAdapter({ node: root })
          ? [valueUseContract.parse({ target: 'global', name: root.getText(), member: initializer.getName() })]
          : [];
      }

      if (!Node.isIdentifier(initializer)) {
        return [];
      }

      // A bare identifier resolves by symbol exactly as a callee does — reuse the same resolution so an
      // import binding used as a value classifies identically to one that is called.
      const link = readCalleeLayerAdapter({ callee: initializer });

      if (link.target === 'import') {
        return [valueUseContract.parse({ target: 'import', specifier: link.specifier, importedName: link.importedName })];
      }

      if (link.target === 'local') {
        return [valueUseContract.parse({ target: 'local', name: link.name, startLine: link.startLine })];
      }

      // Not a same-file binding the checker can name — the last shape left is an ambient global used
      // as a bare value (`const p = process`).
      return readAmbientRootLayerAdapter({ node: initializer })
        ? [valueUseContract.parse({ target: 'global', name: initializer.getText() })]
        : [];
    });

  // An EXPORTED top-level `const`/`let` names the module's public surface. Its declared binding names
  // are recorded — a loose fact the module scope claims — so a projection can LABEL the module entry by
  // its single export instead of the internal `*module*`. An identifier's text IS its name (§5.1); a
  // binding pattern contributes none, and a several-binding or unexported statement is left to fall
  // back to the file basename downstream.
  const exportedBindings: SymbolName[] = node.hasExportKeyword()
    ? node
        .getDeclarationList()
        .getDeclarations()
        .flatMap((declaration): SymbolName[] => {
          const nameNode = declaration.getNameNode();
          return Node.isIdentifier(nameNode) ? [symbolNameContract.parse(nameNode.getText())] : [];
        })
    : [];

  return handlerResultLayerAdapter({
    valueUses,
    exportedBindings,
    descents: node.forEachChildAsArray().map((child) => ({ node: child, context })),
  });
};
