/**
 * PURPOSE: Answers the ONE question the fill seam refuses on — is there a value OF THE RIGHT SHAPE for
 *   this declared type? Asked with a TYPE alone it answers whether one can be CONSTRUCTED; asked with a
 *   candidate `value` as well it answers whether that candidate IS one. Same rule read at two arities,
 *   in one place, so a stub value handed to a property and a fill built for it can never disagree about
 *   what the type admits.
 *
 *   A scalar, a literal, a union with at least one fillable member, an array whose element is fillable,
 *   and an object every one of whose properties is fillable all answer yes to the type question. A
 *   CALLABLE and an opaque UNKNOWN answer no: there is no value in the arrange vocabulary that is a
 *   function, and an unknown type carries only its text. A parameter this refuses is UNFILLABLE, and
 *   `fill-param` declines to invent one rather than handing the code a placeholder it will call,
 *   dereference or measure.
 *
 *   A CANDIDATE is a scalar, so it fits only a type that HAS scalar values: its runtime kind must match
 *   `string`/`number`/`boolean`, it must BE a `literal`'s value, or some union member must admit it. No
 *   scalar is an array or an object, so those refuse a candidate however fillable they are — which is
 *   what keeps a string demand out of a `string[]` property.
 *
 *   An object with NO properties is fillable, as `{}`. What lands there is `interface Empty {}` and
 *   `Record<string, number>` (an index signature is invisible to the descriptor — a known limit of the
 *   reader, and `{}` still satisfies the declared type).
 *
 *   A TRUNCATED object is the one property-less shape that is refused, and the descriptor's `truncated`
 *   mark is what tells the two apart. The reader stops at the second `Tree` in
 *   `interface Tree { label: string; next: Tree }` and emits a property-less `Tree` — an empty list that
 *   is where the READ ended, not what the type declares, so `{}` would be handed to code that requires
 *   `label`. That same mark is what terminates this recursion, so it needs no seen-set of its own.
 *
 *   An ARRAY of a truncated element is fillable even so, and that is the whole difference between
 *   `interface Tree { label: string; next: Tree }` and `interface TreeNode { label: string; children:
 *   TreeNode[] }`. The EMPTY cardinality terminates a self-reference: `[]` is a complete value of
 *   `TreeNode[]` whatever the reader learned about the element, so `{ label: 'abc123', children: [] }`
 *   is a complete `TreeNode`, while no value of `Tree` exists at all. An element refused for any OTHER
 *   reason still refuses the array — a callback list has no element to hold and the empty array is not
 *   offered as a way around a type nothing can be built for.
 *
 *   Recursion, not iteration, and it reads only the descriptor — no ts-morph, no source text.
 *
 * USAGE:
 * isTypeFillableGuard({ type: { kind: 'array', element: { kind: 'number' } } });    // true
 * isTypeFillableGuard({ type: { kind: 'callable', text: '(m: string) => void' } }); // false
 * isTypeFillableGuard({ type: { kind: 'array', element: { kind: 'string' } }, value: 'abc123' }); // false
 */
import type { RepresentativeValue, TypeDescriptor } from '@assayer/shared/contracts';

export const isTypeFillableGuard = ({
  type,
  value,
}: {
  type?: TypeDescriptor;
  value?: RepresentativeValue;
}): boolean => {
  if (type === undefined) {
    return false;
  }

  switch (type.kind) {
    case 'string':
      return value === undefined || typeof value === 'string';
    case 'number':
      return value === undefined || typeof value === 'number';
    case 'boolean':
      return value === undefined || typeof value === 'boolean';
    case 'literal':
      return value === undefined || value === type.value;
    // SOME member is enough: a value of one member is a value of the union, so `string | Map<K,V>`
    // fills as a string rather than being refused for the half nothing can build — and a candidate any
    // one member admits is a value of the union too.
    case 'union':
      return type.members.some((member) =>
        isTypeFillableGuard({ type: member, ...(value === undefined ? {} : { value }) }),
      );
    // The TRUNCATED element is the self-reference rung: `[]` terminates it and is a complete value of
    // the array. No scalar is an array, so a candidate is refused here however fillable the type is.
    case 'array':
      return (
        value === undefined &&
        ((type.element.kind === 'object' && type.element.truncated === true) ||
          isTypeFillableGuard({ type: type.element }))
      );
    // EVERY REQUIRED property, and `[].every()` is what makes the property-less shape fillable as `{}`.
    // One unfillable required property makes the whole object unfillable — a `Sink` whose `write` is a
    // callable cannot be built, and half an object is a wrong input, not a partial one. An OPTIONAL
    // property is owed nothing, exactly as an optional PARAMETER is: `{ label: 'abc123' }` is a complete
    // `interface TreeNode { label: string; child?: TreeNode }`, so a shape whose only unbuildable member
    // is one the declaration says may be absent is built rather than refused. A TRUNCATED shape never
    // reaches that test: its property list is the reader's stopping point, so `{}` says nothing about
    // what the type requires. No scalar is an object either, so a candidate is refused.
    case 'object':
      return (
        value === undefined &&
        type.truncated !== true &&
        type.properties.every((property) => property.optional === true || isTypeFillableGuard({ type: property.type }))
      );
    // No value in the arrange vocabulary is a function, and an opaque type carries only its text.
    // Both are NAMED rather than left to the default, so a descriptor kind added later fails the
    // exhaustiveness check and forces a decision; the default shares their answer because refusing is
    // the safe one — a new shape arrives as a refusal to fix, never a placeholder that runs wrong.
    case 'callable':
    case 'unknown':
    default:
      return false;
  }
};
