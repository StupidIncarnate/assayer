/**
 * PURPOSE: Resolves one entry to something the interpreter can DRIVE, per its ACCESS — the step that
 *   makes a derived case runnable rather than merely described.
 *
 *   Reading `subject[name]` for everything is what a runner does when access is not modelled, and it
 *   is wrong for every shape but one: a default export lives under `default`, a method is not on the
 *   module at all — it is on an INSTANCE — and a module scope is not a property of anything. Guessing
 *   yields `undefined`, which then reads as "the analyzer found a function that isn't there" rather
 *   than "nobody said how to reach it".
 *
 *   A method is constructed PER CASE, not once: a case must not observe state a previous case left
 *   behind. Construction only happens for a class the projection already judged constructable, so
 *   the zero-argument call is a checked assumption rather than a hope.
 *
 *   The instance method is BOUND, because the interpreter applies it with no receiver; an unbound
 *   method loses `this` and throws on the first field it touches.
 *
 *   A `module` scope resolves to `requireFresh` — the thunk that re-imports the module under whatever
 *   the case has arranged. There is nothing else it COULD be: a module scope's body runs exactly
 *   once per load, so the only way to run it again, with different inputs, is to load it again. That
 *   makes every access kind the same shape to the interpreter — something to apply — which is why it
 *   needs no idea that a module is special.
 *
 * USAGE:
 * jestResolveEntryAdapter({ subject, name: 'classify', access: { kind: 'method', className: 'Classifier', constructable: true }, requireFresh });
 * // Returns the bound method, or undefined when the module does not carry it
 */
import type { EntryAccess } from '@assayer/shared/contracts';

export const jestResolveEntryAdapter = ({
  subject,
  name,
  access,
  requireFresh,
}: {
  subject: Record<PropertyKey, unknown>;
  name: string;
  access: EntryAccess;
  requireFresh?: () => unknown;
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

  if (access.kind === 'module') {
    return requireFresh;
  }

  return undefined;
};
