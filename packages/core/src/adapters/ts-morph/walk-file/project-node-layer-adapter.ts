/**
 * PURPOSE: Projects ANY node into its structural token stream — the coverage IDENTITY. Recurses the
 *   node's REAL children: each contributes its KIND, except identifiers (their symbol name) and
 *   string/number literals (their VALUE); a parenthesized expression collapses to what it wraps.
 *
 *   It walks with `forEachChild`, not `getDescendants`, and that is load-bearing rather than
 *   incidental. `getDescendants` yields punctuation and syntax lists, which makes the projection
 *   SPELLING-sensitive: `(n) => n` and `n => n` are the same logic but differ by an OpenParenToken,
 *   so they would key differently. `forEachChild` yields only real nodes — operator tokens included,
 *   because those ARE the logic — so quote style, spacing, reindent and optional parens all erase,
 *   and an ID moves only when the logic moves (see CLAUDE.md).
 *
 *   Kind-agnostic by construction, which is why it serves every identity the walk needs: an `if`
 *   condition, a `switch` discriminant, and the fallback name of an anonymous function all key on
 *   the same grammar rather than three hand-rolled ones.
 *
 * USAGE:
 * projectNodeLayerAdapter({ node: ifStatement.getExpression() });
 * // Returns 'BinaryExpression,id:name,EqualsEqualsEqualsToken,str:blah' (branded AstProjection)
 */
import { Node } from 'ts-morph';

import { representativeValueContract } from '@assayer/shared/contracts';

import { astProjectionContract } from '../../../contracts/ast-projection/ast-projection-contract';
import type { AstProjection } from '../../../contracts/ast-projection/ast-projection-contract';
import { literalTokenTransformer } from '../../../transformers/literal-token/literal-token-transformer';

export const projectNodeLayerAdapter = ({ node }: { node: Node }): AstProjection => {
  if (Node.isParenthesizedExpression(node)) {
    return projectNodeLayerAdapter({ node: node.getExpression() });
  }

  const self = Node.isIdentifier(node)
    ? `id:${node.getText()}`
    : Node.isStringLiteral(node) || Node.isNumericLiteral(node)
      ? literalTokenTransformer({ value: representativeValueContract.parse(node.getLiteralValue()) })
      : node.getKindName();

  const children = node.forEachChildAsArray().map((child) => projectNodeLayerAdapter({ node: child }));

  return astProjectionContract.parse([self, ...children].join(','));
};
