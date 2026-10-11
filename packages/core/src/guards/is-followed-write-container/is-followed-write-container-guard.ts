/**
 * PURPOSE: Answers whether a node is one of the two containers the walk follows a write through: a block,
 *   or an `if` statement. A write that climbs out through any other container (a loop, a `switch`
 *   clause, a `try`) is one the walk does not follow.
 *
 * USAGE:
 * isFollowedWriteContainerGuard({ node });
 * // Returns true for a block or an `if` statement
 */
import { Node } from "#gateway/npm/ts-morph";
import type { Node as TsNode } from "#gateway/npm/ts-morph";

export const isFollowedWriteContainerGuard = ({
  node,
}: {
  node?: TsNode | undefined;
}): boolean =>
  node !== undefined && (Node.isBlock(node) || Node.isIfStatement(node));
