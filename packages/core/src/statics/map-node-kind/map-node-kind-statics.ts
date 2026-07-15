/**
 * PURPOSE: Pairs a parsed AST node KIND with the explorer map's branch-construct vocabulary. It is
 *   the one place that decides which syntax the map surfaces, keyed on the parser's own kind names
 *   so no source text is involved. Kinds absent from here are simply not map nodes — a
 *   `MethodDeclaration` is walked and analysed but has never been drawn on the map, and this is
 *   where that would change.
 *
 * USAGE:
 * mapNodeKindStatics.pairs.find((pair) => pair.syntaxKind === 'IfStatement')?.mapKind;
 * // Returns 'if'; an unmapped kind finds nothing
 */
export const mapNodeKindStatics = {
  pairs: [
    { syntaxKind: 'FunctionDeclaration', mapKind: 'function' },
    { syntaxKind: 'IfStatement', mapKind: 'if' },
    { syntaxKind: 'ConditionalExpression', mapKind: 'ternary' },
    { syntaxKind: 'SwitchStatement', mapKind: 'switch' },
  ],
} as const;
