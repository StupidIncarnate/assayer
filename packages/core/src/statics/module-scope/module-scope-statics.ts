/**
 * PURPOSE: The name of a file's MODULE scope — the synthetic entry that owns logic living at a
 *   file's top level rather than inside any function. It is bracketed so it cannot collide with a
 *   real TypeScript identifier, and it is the root segment of every scope path in a file, which is
 *   what lets bare top-level code, a function, and a class method all be the same kind of thing to
 *   the walk.
 *
 * USAGE:
 * moduleScopeStatics.name;
 * // Returns '*module*'
 */
export const moduleScopeStatics = {
  name: '*module*',
  returnTypeText: 'void',
} as const;
