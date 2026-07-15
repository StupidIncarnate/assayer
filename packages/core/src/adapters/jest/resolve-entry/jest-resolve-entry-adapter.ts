/**
 * PURPOSE: Resolves one entry to a callable against the required module, per its ACCESS — the step
 *   that makes a derived case drivable rather than merely described.
 *
 *   Reading `subject[name]` for everything is what a runner does when access is not modelled, and it
 *   is wrong for every shape but one: a default export lives under `default`, and a method is not on
 *   the module at all — it is on an INSTANCE. Guessing yields `undefined`, which then reads as "the
 *   analyzer found a function that isn't there" rather than "nobody said how to reach it".
 *
 *   A method is constructed PER CASE, not once: a case must not observe state a previous case left
 *   behind. Construction only happens for a class the projection already judged constructable, so
 *   the zero-argument call is a checked assumption rather than a hope.
 *
 *   The instance method is BOUND, because the interpreter applies it with no receiver; an unbound
 *   method loses `this` and throws on the first field it touches.
 *
 * USAGE:
 * jestResolveEntryAdapter({ subject, name: 'classify', access: { kind: 'method', className: 'Classifier', constructable: true } });
 * // Returns the bound method, or undefined when the module does not carry it
 */
import type { EntryAccess } from '@assayer/shared/contracts';

export const jestResolveEntryAdapter = ({
  subject,
  name,
  access,
}: {
  subject: Record<PropertyKey, unknown>;
  name: string;
  access: EntryAccess;
}): unknown => {
  if (access.kind === 'named') {
    return subject[name];
  }

  if (access.kind === 'default') {
    const exported = subject.default;

    // Under CJS interop a default export can land as the module itself rather than under `default`.
    return typeof exported === 'function' ? exported : undefined;
  }

  if (access.kind === 'method') {
    const owner = subject[access.className];

    if (typeof owner !== 'function') {
      return undefined;
    }

    const instance = Reflect.construct(owner, []) as Record<PropertyKey, unknown>;
    const method = instance[name];

    return typeof method === 'function' ? method.bind(instance) : undefined;
  }

  return undefined;
};
