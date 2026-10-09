/**
 * PURPOSE: Checks the object a syntax or shim file exports and returns the parts of a loaded syntax
 * that come from that object, not from the file's syntax tree. Syntax-shape calls it first, because
 * the object arrives typed `unknown` from the sandbox that evaluated the file.
 *
 * USAGE:
 * readDeclaredLayerTransformer({ declared: gtSyntax, file: 'gt.syntax.ts', origin: 'syntax' });
 * // Returns { description, code, anchors } or throws a DeclarationError naming the bad property
 */
import { DeclarationError } from '../../errors/declaration/declaration-error';
import type { LoadedSyntax } from '../../contracts/loaded-syntax/loaded-syntax-contract';

export const readDeclaredLayerTransformer = ({
  declared,
  file,
  origin,
}: {
  declared: unknown;
  file: string;
  origin: 'shim' | 'syntax';
}): Pick<LoadedSyntax, 'anchors' | 'builtin' | 'code' | 'description' | 'form' | 'range'> => {
  if (typeof declared !== 'object' || declared === null) {
    throw new DeclarationError({
      file,
      message: 'the export is not an object. Export the result of calling the kit function for this declaration.',
    });
  }
  const fields = new Map(Object.entries(declared));
  const description: unknown = fields.get('description');
  const code: unknown = fields.get('code');
  const declaredAnchors: unknown = fields.get('anchors');
  const anchors = declaredAnchors === undefined ? {} : declaredAnchors;

  if (typeof description !== 'string') {
    throw new DeclarationError({ file, message: 'its `description` must be a string. Add a one-line description.' });
  }
  if (typeof code !== 'function') {
    throw new DeclarationError({ file, message: 'its `code` must be a function. Write it as an arrow function.' });
  }
  if (typeof anchors !== 'object' || anchors === null || Array.isArray(anchors)) {
    throw new DeclarationError({
      file,
      message: 'its `anchors` must be an object that maps a hole name to a value. Write anchors as an object.',
    });
  }
  const base = {
    description,
    code: (...holes: readonly unknown[]): unknown => Reflect.apply(code, undefined, holes),
    anchors: Object.fromEntries(Object.entries(anchors)),
  };
  if (origin === 'syntax') {
    return base;
  }

  const form: unknown = fields.get('form');
  const builtin: unknown = fields.get('builtin');
  const range: unknown = fields.get('range');
  const pin: unknown = fields.get('pin');
  const formFields = new Map(typeof form === 'object' && form !== null ? Object.entries(form) : []);
  const formKind = (['call', 'getter', 'method'] as const).find((candidate) => candidate === formFields.get('kind'));
  const formName: unknown = formFields.get('name');

  if (formKind === undefined || typeof formName !== 'string') {
    throw new DeclarationError({
      file,
      message:
        "its `form` must be { kind, name }, where kind is 'call', 'getter' or 'method' and name is a string. Fix the form.",
    });
  }
  if (typeof builtin !== 'string') {
    throw new DeclarationError({
      file,
      message: 'its `builtin` must be a string that names the builtin the shim stands for. Add the builtin.',
    });
  }
  if (pin === 'range' && range === undefined) {
    throw new DeclarationError({
      file,
      message: "pin 'range' needs a range to pick values from. Add a range, or use a pin function.",
    });
  }
  if (pin !== undefined && pin !== 'range' && typeof pin !== 'function') {
    throw new DeclarationError({
      file,
      message: "its `pin` must be 'range' or a function. Fix the pin.",
    });
  }
  const shimBase = { ...base, builtin, form: { kind: formKind, name: formName } };
  if (range === undefined) {
    return shimBase;
  }

  const rangeFields = new Map(typeof range === 'object' && range !== null ? Object.entries(range) : []);
  const min: unknown = rangeFields.get('min');
  const max: unknown = rangeFields.get('max');
  const maxExclusive: unknown = rangeFields.get('maxExclusive');
  const whole: unknown = rangeFields.get('whole');
  if (
    typeof min !== 'number' ||
    typeof max !== 'number' ||
    typeof maxExclusive !== 'boolean' ||
    typeof whole !== 'boolean'
  ) {
    throw new DeclarationError({
      file,
      message:
        'its `range` must be { min, max, maxExclusive, whole }, where min and max are numbers and the other two are booleans. Fix the range.',
    });
  }

  return { ...shimBase, range: { min, max, maxExclusive, whole } };
};
