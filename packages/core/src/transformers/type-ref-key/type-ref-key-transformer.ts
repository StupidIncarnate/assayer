/**
 * PURPOSE: The KEY one type REFERENCE is resolved under — the reference's declared RENDERING, which is
 *   the one string the read half (`collect-type-refs`), the resolver and the write half
 *   (`substitute-type-refs`) can all compute without talking to each other.
 *
 *   It is the rendering rather than the bare NAME because a name is not the whole reference:
 *   `Box<string>` and `Box<number>` are one name and two different demands, so a name-keyed resolution
 *   would answer one of them with the other's shape. The rendering is the checker's canonical one, so
 *   respacing or requoting a signature keys identically.
 *
 *   A descriptor that is not an opaque reference is not resolved by anything and has no key, so it
 *   answers `undefined` rather than a string that could collide with a real one. Every caller gates on
 *   the reference before asking, so that arm is the type system holding them to it.
 *
 * USAGE:
 * typeRefKeyTransformer({ type: { kind: 'unknown', text: 'Box<string>', typeRef: 'Box' } });
 * // Returns 'Box<string>'
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

export const typeRefKeyTransformer = ({ type }: { type: TypeDescriptor }): string | undefined =>
  type.kind === 'unknown' ? type.text : undefined;
