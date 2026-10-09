/**
 * PURPOSE: The settings that decide which specimens the generator plans. Reach for this when a
 * planner needs to know which syntax is in focus, how deep nodes nest, and which provenances and
 * fills are switched on. The provenance table itself lives in provenanceStatics.
 *
 * USAGE:
 * matrixStatics.focus;
 * // Returns ['if', 'ternary']
 */
export const matrixStatics = {
  focus: ['if', 'ternary'],
  nesting: {
    depth: 1,
  },
  plainest: ['param', 'env', 'const'],
  // `boolean` is what lets an `if` or ternary take a comparison such as `value > 5` as its condition.
  typeArguments: ['number', 'boolean'],
  provenances: ['param', 'env', 'literal', 'const', 'external'],
  excludedFills: ['array-at', 'array-includes', 'math-random'],
} as const;
