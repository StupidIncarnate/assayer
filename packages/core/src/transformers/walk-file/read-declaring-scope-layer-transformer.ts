/**
 * PURPOSE: Finds the scope a declaration belongs to: the nearest function-like node above it, or the
 *   source file when it sits at module level. A write that climbs out through any OTHER function-like
 *   node is a closure's write.
 *
 * USAGE:
 * readDeclaringScopeLayerTransformer({ node: declaration.getParent() });
 * // Returns the function (or source file) the declaration sits in
 */
import { Node } from "#gateway/npm/ts-morph";
import type { Node as TsNode } from "#gateway/npm/ts-morph";

export const readDeclaringScopeLayerTransformer = ({
  node,
}: {
  node: TsNode | undefined;
}): TsNode | undefined =>
  node === undefined ||
  Node.isSourceFile(node) ||
  Node.isFunctionLikeDeclaration(node)
    ? node
    : readDeclaringScopeLayerTransformer({ node: node.getParent() });
