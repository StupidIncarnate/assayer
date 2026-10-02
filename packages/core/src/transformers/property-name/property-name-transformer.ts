/**
 * PURPOSE: Names one property of an object type the same way in every process. A property keyed by a symbol
 *   (`[Symbol.iterator]` on `Map`, or `[k]` for a `unique symbol` const) carries an internal name such as
 *   `__@iterator@70`, whose number is a symbol id from a counter the whole process shares, so the same source read
 *   twice gives two names. This returns the checker's own rendering for such a property, `[Symbol.iterator]`,
 *   which depends only on the declaration. Every other property keeps its plain name. Reach for this wherever a
 *   type reader enumerates object properties into data that is cached or hashed.
 *
 * USAGE:
 * propertyNameTransformer({ symbol: mapType.getProperties()[0] });
 * // Returns '[Symbol.iterator]' for Map's iterator member, or 'size' for a plain property
 */
import type { Symbol as MorphSymbol } from '#gateway/npm/ts-morph';

export const propertyNameTransformer = ({ symbol }: { symbol: MorphSymbol }): string => {
  if (!symbol.getEscapedName().startsWith('__@')) {
    return symbol.getName();
  }

  const [declaration] = symbol.getDeclarations();

  // A symbol-keyed property always has a declaration (its `[key]` member). Without one there is no checker to ask,
  // and the counter suffix is the only part that varies, so it is dropped.
  return declaration === undefined
    ? symbol.getEscapedName().replace(/@\d+$/u, '')
    : declaration.getProject().getTypeChecker().compilerObject.symbolToString(symbol.compilerSymbol);
};
