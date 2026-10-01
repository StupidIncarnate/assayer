/**
 * PURPOSE: Answers whether a SUPPLIED type descriptor is a value of a DECLARED one — a pure structural
 *   comparison between two `TypeDescriptor`s, never a value. This is the harness half of the
 *   derived-arrange-vs-declared-type invariant: a harness supplies an expression whose STATIC type is
 *   read off its own AST (a callback is `[Function]` at runtime, so only the declaration can answer
 *   this), and that supplied type is reconciled here against the parameter's declared type — the same
 *   descriptor `entry.params[].type` already carries.
 *
 *   Kind-for-kind: a scalar declared type admits only its own kind, a `literal` only its exact value, an
 *   `array` only a supplied `array` whose element is compatible (recursed), a `tuple` only a supplied
 *   `tuple` of the exact same length whose every position is compatible with the SAME position
 *   (checked pairwise, never against one shared element type), an `object` only a supplied `object`
 *   whose every REQUIRED property is present and compatible (an OPTIONAL declared property may be
 *   absent from the supplied shape too), and a `template` only a supplied `string` or another
 *   `template` — the declared PATTERN is not re-checked here any more than a declared `string` checks a
 *   supplied string's content. A declared `union` admits a supplied type compatible with ANY of its
 *   members; a SUPPLIED union (a ternary's inferred type, `string | number`) is admitted only
 *   when EVERY one of its members is compatible — a value that might be any of several shapes must
 *   satisfy the declared type whichever it turns out to be.
 *
 *   `undefined` reads as the opaque `unknown` kind (`read-type-fact` has no dedicated flavor for it, so
 *   it falls to the same catch-all a `Map<string, number>` does) and needs no special rule here: it is
 *   compatible with nothing except a declared `unknown` — the same clause that lets an opaque type
 *   through — so it fails unless the declared type itself admits it.
 *
 *   A supplied `literal` still satisfies a declared scalar of the matching runtime kind. The checker
 *   reports a harness's own literal expression at its PRECISE literal type rather than its base type —
 *   `{ level: 'a' }`'s `level` reads as the literal `'a'`, never widened to `string`, even one property
 *   deeper than the object literal's own top level — so a declared `string` has to admit a supplied
 *   `'a'` on sight, not only a supplied `string`.
 *
 *   A declared `unknown` (an opaque import, `Map<string, number>`, or a genuinely unreadable shape) is
 *   ALWAYS compatible. Assayer never saw a real shape to check against, and refusing a harness value
 *   against a type it cannot itself construct would be inventing a fact it does not have — the same
 *   reason `is-type-fillable` never builds one either.
 *
 *   `callable` is a KNOWN LIMIT: the descriptor carries only the checker's rendered TEXT
 *   (`(m: string) => void`), never a structural signature, so two callables are compatible whenever both
 *   sides are callable-shaped — this closes `undefined`, a primitive, or a composite standing in for a
 *   callback, but not a wrong ARITY or a mismatched parameter/return type. Widening `TypeDescriptor`'s
 *   `callable` to carry one would let this go further; until then this is a real, named boundary rather
 *   than a silent one.
 *
 *   Neither argument is a value, so there is no ts-morph, no source text, and no execution — a pure read
 *   of two already-serialized descriptors (P4-clean).
 *
 * USAGE:
 * isTypeCompatibleGuard({ declared: { kind: 'callable', text: '(m: string) => void' }, supplied: { kind: 'unknown', text: 'undefined' } });
 * // false — `undefined` is not a value of a declared callable
 * isTypeCompatibleGuard({ declared: { kind: 'array', element: { kind: 'number' } }, supplied: { kind: 'array', element: { kind: 'string' } } });
 * // false — the element kinds disagree
 */
import type { TypeDescriptor } from '@assayer/shared/contracts';

export const isTypeCompatibleGuard = ({
  declared,
  supplied,
}: {
  declared?: TypeDescriptor;
  supplied?: TypeDescriptor;
}): boolean => {
  if (declared === undefined || supplied === undefined) {
    return false;
  }

  // Assayer never read a real shape for an opaque declared type, so it has nothing to contradict a
  // harness value with — the same reason `is-type-fillable` never builds one either.
  if (declared.kind === 'unknown') {
    return true;
  }

  // A SUPPLIED union — a ternary's inferred type, `string | number` — is compatible only when EVERY
  // member is: the value might be any of them, and each one has to satisfy the declared type.
  if (supplied.kind === 'union') {
    return supplied.members.every((member) => isTypeCompatibleGuard({ declared, supplied: member }));
  }

  // A DECLARED union admits a supplied type compatible with ANY of its members — a value of one member
  // is a value of the union, the same rule `is-type-fillable`'s union arm states.
  if (declared.kind === 'union') {
    return declared.members.some((member) => isTypeCompatibleGuard({ declared: member, supplied }));
  }

  // A supplied STRING (or another TEMPLATE) satisfies a declared template literal type — the declared
  // PATTERN is not re-checked here, the same latitude a declared `string` gives a supplied string's
  // content. Checked before the kind-equality gate below, because `template` never supplies-and-declares
  // the same literal `kind` a plain string does.
  if (declared.kind === 'template' && (supplied.kind === 'string' || supplied.kind === 'template')) {
    return true;
  }

  // A supplied LITERAL still satisfies a declared scalar of the matching runtime kind — see the PURPOSE
  // doc for why the checker hands back literal precision here rather than the widened base type.
  if (supplied.kind === 'literal' && declared.kind !== 'literal') {
    if (declared.kind === 'string') {
      return typeof supplied.value === 'string';
    }
    if (declared.kind === 'number') {
      return typeof supplied.value === 'number';
    }
    if (declared.kind === 'boolean') {
      return typeof supplied.value === 'boolean';
    }
    return false;
  }

  if (declared.kind !== supplied.kind) {
    return false;
  }

  switch (declared.kind) {
    case 'string':
    case 'number':
    case 'boolean':
      // The kind match above is the whole answer for a scalar primitive.
      return true;
    case 'literal':
      // Only the EXACT value satisfies a literal type — a same-kind primitive that is not the one
      // permitted value is still a mismatch.
      return supplied.kind === 'literal' && supplied.value === declared.value;
    // Unreachable in practice: the pre-check above already returns for every supplied kind a declared
    // `template` admits (`string` or another `template`), so anything reaching here already failed the
    // kind-equality gate. Named for exhaustiveness, the same reason `default` below answers `false`.
    case 'template':
      return true;
    case 'array':
      return supplied.kind === 'array' && isTypeCompatibleGuard({ declared: declared.element, supplied: supplied.element });
    // Fixed-length and HETEROGENEOUS: the supplied tuple must match the declared LENGTH exactly, and
    // each position is checked against that SAME position, never against one shared element type.
    case 'tuple':
      return (
        supplied.kind === 'tuple' &&
        declared.elements.length === supplied.elements.length &&
        declared.elements.every((element, index) => {
          const suppliedElement = supplied.elements[index];

          return suppliedElement !== undefined && isTypeCompatibleGuard({ declared: element, supplied: suppliedElement });
        })
      );
    case 'object':
      return (
        supplied.kind === 'object' &&
        declared.truncated !== true &&
        declared.properties.every((property) => {
          const match = supplied.properties.find((candidate) => candidate.name === property.name);

          return match === undefined
            ? property.optional === true
            : isTypeCompatibleGuard({ declared: property.type, supplied: match.type });
        })
      );
    // See the PURPOSE doc — a known limit, not a silent one: both sides being callable-shaped is the
    // whole check `TypeDescriptor.callable`'s text-only rendering supports.
    case 'callable':
      return supplied.kind === 'callable';
    default:
      return false;
  }
};
