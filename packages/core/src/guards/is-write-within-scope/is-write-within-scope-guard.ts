/**
 * PURPOSE: Answers whether a write statement reaches its declaring scope by climbing only through
 *   containers the walk follows (a block, an `if`). A write that crosses a loop, a `switch` clause, a
 *   `try` or another function on the way up is not within scope.
 *
 * USAGE:
 * isWriteWithinScopeGuard({ node: statement.getParent(), scope: declaringScope });
 * // Returns true when every container between the node and the scope is a block or an `if`
 */
import type { Node as TsNode } from "#gateway/npm/ts-morph";

import { isFollowedWriteContainerGuard } from "../is-followed-write-container/is-followed-write-container-guard";

export const isWriteWithinScopeGuard = ({
  node,
  scope,
}: {
  node?: TsNode | undefined;
  scope?: TsNode | undefined;
}): boolean => {
  if (node === undefined) {
    return false;
  }

  if (node === scope) {
    return true;
  }

  return (
    isFollowedWriteContainerGuard({ node }) &&
    isWriteWithinScopeGuard({ node: node.getParent(), scope })
  );
};
