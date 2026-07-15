/**
 * PURPOSE: The AST node kinds that are semantically LOAD-BEARING — control-flow constructs that
 *   partition execution and therefore change what must be tested. The walk records every node of a
 *   significant kind; if no handler claims one, it becomes a DARK SPOT rather than vanishing. This
 *   list is deliberately separate from the handler registry: "kinds that matter" and "kinds we can
 *   analyse" are different questions, and the gap between them is exactly what the map must admit
 *   to. Handling a kind means adding a handler, NOT removing it from here.
 *
 * USAGE:
 * significantSyntaxKindsStatics.kinds.includes('ForStatement');
 * // Returns true — a `for` loop partitions execution, so an unhandled one is a dark spot
 */
export const significantSyntaxKindsStatics = {
  kinds: [
    'ConditionalExpression',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'WhileStatement',
    'DoStatement',
    'TryStatement',
  ],
} as const;
