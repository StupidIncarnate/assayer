/**
 * PURPOSE: Writes one leaf of a fill tree as an expression, and records what the leaf needs: a
 * parameter for a `param` leaf, a top-of-file declaration for a `const` or `env` leaf. A literal and an
 * external leaf are written inline and need nothing. The first leaf to use a hole name keeps that
 * name. A later leaf whose hole name is taken is named from its owner and hole, such as
 * `arrayLengthReceiver`. Reach for this from the node renderer, which owns the three maps.
 *
 * USAGE:
 * leafLayerTransformer({ leaf, names, params, decls });
 * // Returns the identifier `value` and adds `value` to params when the leaf's provenance is 'param'
 */
import ts from '#gateway/npm/typescript';

import type { FillTree } from '../../contracts/fill-tree/fill-tree-contract';
import { typeInfoTransformer } from '../type-info/type-info-transformer';
import { literalNodeLayerTransformer } from './literal-node-layer-transformer';
import { parseSnippetExpressionTransformer } from '../parse-snippet-expression/parse-snippet-expression-transformer';
import { parseSnippetTypeTransformer } from '../parse-snippet-type/parse-snippet-type-transformer';

export const leafLayerTransformer = ({
  leaf,
  names,
  params,
  decls,
}: {
  leaf: Extract<FillTree, { kind: 'leaf' }>;
  names: Map<FillTree, string>;
  params: Map<string, string>;
  decls: Map<string, string>;
}): ts.Expression => {
  if (leaf.provenance === 'random') {
    throw new Error(
      `The leaf ${leaf.owner}.${leaf.hole} has the provenance 'random', which the generator does not write yet. Remove 'random' from the matrix provenances.`,
    );
  }
  if (leaf.provenance === 'literal') {
    return literalNodeLayerTransformer({ value: leaf.value });
  }
  if (leaf.provenance === 'external') {
    return parseSnippetExpressionTransformer({ text: typeInfoTransformer({ typeText: leaf.type }).external });
  }

  const taken = new Set(names.values());
  const name =
    names.get(leaf) ??
    (taken.has(leaf.hole)
      ? `${leaf.owner}-${leaf.hole}`
          .split('-')
          .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
          .join('')
      : leaf.hole);
  names.set(leaf, name);

  const printer = ts.createPrinter({ removeComments: true });
  const emptyFile = ts.createSourceFile('declaration.ts', '', ts.ScriptTarget.ES2022, false);

  if (leaf.provenance === 'param') {
    params.set(name, leaf.type);
  }
  if (leaf.provenance === 'const') {
    const declaration = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            name,
            undefined,
            parseSnippetTypeTransformer({ text: leaf.type }),
            literalNodeLayerTransformer({ value: leaf.value }),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    decls.set(name, printer.printNode(ts.EmitHint.Unspecified, declaration, emptyFile));
  }
  if (leaf.provenance === 'env') {
    const declaration = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            name,
            undefined,
            undefined,
            parseSnippetExpressionTransformer({
              text: typeInfoTransformer({ typeText: leaf.type }).env,
              rename: { from: 'KEY', to: name.replace(/([a-z0-9])([A-Z])/gu, '$1_$2').toUpperCase() },
            }),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    decls.set(name, printer.printNode(ts.EmitHint.Unspecified, declaration, emptyFile));
  }

  return ts.factory.createIdentifier(name);
};
