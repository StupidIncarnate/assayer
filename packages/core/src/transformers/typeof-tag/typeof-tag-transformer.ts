/**
 * PURPOSE: Reads the runtime TAG the `typeof` operator produces for a value of a structural type —
 *   `'string'`, `'number'`, `'boolean'`, `'object'`, `'function'` — off the type descriptor's own KIND,
 *   never off source text. A `literal`'s tag comes from its own extracted VALUE, so a `null` literal
 *   reads `'object'`, the same wart the real `typeof` operator has.
 *
 *   `undefined` means this transformer cannot pin the tag down: a `union` has no single tag of its own
 *   (read each of its members one at a time instead, which is what `typeofDomainTransformer` does), and
 *   an `unknown` type is one the analyzer never resolved, so its runtime shape is genuinely not known.
 *
 * USAGE:
 * typeofTagTransformer({ type: { kind: 'string' } });
 * // Returns 'string'
 * typeofTagTransformer({ type: { kind: 'literal', value: null } });
 * // Returns 'object' — typeof null === 'object'
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

export type TypeofTag = 'string' | 'number' | 'boolean' | 'object' | 'function';

export const typeofTagTransformer = ({ type }: { type: TypeDescriptor }): TypeofTag | undefined => {
  switch (type.kind) {
    // A template literal type is still, at runtime, a plain string.
    case 'string':
    case 'template':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'literal':
      return type.value === null
        ? 'object'
        : typeof type.value === 'string'
          ? 'string'
          : typeof type.value === 'number'
            ? 'number'
            : 'boolean';
    // A tuple and an array are both real arrays at runtime, and `typeof` does not distinguish an
    // array from a plain object.
    case 'array':
    case 'tuple':
    case 'object':
      return 'object';
    case 'callable':
      return 'function';
    // A union has no tag of its own — its MEMBERS do. An unknown type is one this analyzer never
    // resolved, so its runtime shape is genuinely not known.
    case 'union':
    case 'unknown':
    default:
      return undefined;
  }
};
