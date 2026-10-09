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
 *   A named export carries the module property when a rename made it differ from the entry's own
 *   name (`export { runIt as go }`), for the same reason: `runIt` is not on the module.
 *
 *   A method is constructed PER CASE, not once: a case must not observe state a previous case left
 *   behind. The instance is built with the entry's `construct` arguments, which the case-set projection
 *   filled from the constructor's declared parameter types, so a class whose constructor needs
 *   arguments is built with them, and a class that needs none is built with none. A `static` method
 *   lives on the class itself, so it is read off the class and no instance is built.
 *
 *   A method is BOUND to the instance, or to the class for a static one, because the interpreter
 *   applies it with no receiver; an unbound method loses `this` and throws on the first field it
 *   touches.
 *
 *   A getter or a setter resolves to a function that reads or assigns the property when the case
 *   APPLIES it. Reading the property here would run the getter's body now, before the interpreter
 *   resets the probe, so its exit would be wiped from the trace the case is judged by. A setter takes
 *   the case's one argument as the value it assigns.
 *
 *   A `constructor` resolves to a function that constructs the class with the case's arguments, so
 *   the constructor body runs with the arranged values exactly as `new` runs it.
 *
 *   An `object-member` is read off the exported object (`subject[objectName][property]`) and bound to
 *   that object, the way an importer calling `api.run()` binds it. Its getter or setter is read or
 *   assigned on the object when the case applies it, for the same reason a class accessor is.
 *
 *   A `module` scope resolves to `requireFresh` — the thunk that loads the module again under whatever
 *   the case has arranged. There is nothing else it COULD be: a module scope's body runs exactly
 *   once per load, so the only way to run it again, with different inputs, is to load it again. That
 *   makes every access kind the same shape to the interpreter — something to apply. In a CommonJS run
 *   the thunk returns the module; in an ESM run it returns the import's promise, which the interpreter
 *   awaits.
 *
 *   A `through-caller` entry is a private driven through the reachable caller that reaches it, so it
 *   resolves to that CALLER — a named module property. The interpreter then applies it with the
 *   arrange derived in the caller's parameter space, and judges by the callee's OWN exit ids, which
 *   the flow reaches on the way through. The callee itself is never resolved: it has no module
 *   property to find.
 *
 * USAGE:
 * caseResolveEntryBroker({ subject, name: 'classify', access: { kind: 'method', className: 'Classifier', constructable: true }, requireFresh });
 * // Returns the bound method, or undefined when the module does not carry it
 */
import type { ArrangeBinding, EntryAccess } from '@assayer/shared/contracts';

import type { DrivableEntry } from '../../../contracts/drivable-entry/drivable-entry-contract';
import { constructArgsTransformer } from '../../../transformers/construct-args/construct-args-transformer';

export const caseResolveEntryBroker = ({
  subject,
  name,
  access,
  requireFresh,
  construct,
}: {
  subject: Record<PropertyKey, unknown>;
  name: string;
  access: EntryAccess;
  requireFresh?: () => unknown;
  construct?: readonly ArrangeBinding[] | undefined;
}): DrivableEntry | undefined => {
  // The module PROPERTY, which is the exported name when a rename put it under a different one. A
  // property that is not a function is no entry, so it resolves to undefined like a missing one.
  if (access.kind === 'named') {
    const exported = subject[access.exportedName === undefined ? name : String(access.exportedName)];

    return typeof exported === 'function' ? (exported as DrivableEntry) : undefined;
  }

  if (access.kind === 'default') {
    const exported = subject.default;

    // Under CJS interop a default export can land as the module itself rather than under `default`.
    return typeof exported === 'function' ? (exported as DrivableEntry) : undefined;
  }

  if (access.kind === 'method' || access.kind === 'constructor') {
    const owner = subject[access.className];

    if (typeof owner !== 'function') {
      return undefined;
    }

    if (access.kind === 'constructor') {
      return (...args: unknown[]): unknown => Reflect.construct(owner, args);
    }

    // A static member is a property of the class itself, which the module holds as a function.
    const target =
      access.static === true
        ? (subject[access.className] as Record<PropertyKey, unknown>)
        : (Reflect.construct(owner, constructArgsTransformer({ construct })) as Record<PropertyKey, unknown>);

    if (!(name in target)) {
      return undefined;
    }

    if (access.accessor === 'get') {
      return (): unknown => target[name];
    }

    if (access.accessor === 'set') {
      return (...args: unknown[]): unknown => {
        const [value] = args;
        target[name] = value;

        return undefined;
      };
    }

    const method = target[name];

    return typeof method === 'function' ? (method.bind(target) as DrivableEntry) : undefined;
  }

  if (access.kind === 'object-member') {
    const holder = subject[String(access.objectName)];
    const property = String(access.property);

    if (typeof holder !== 'object' || holder === null || !(property in holder)) {
      return undefined;
    }

    const target = holder as Record<PropertyKey, unknown>;

    if (access.accessor === 'get') {
      return (): unknown => target[property];
    }

    if (access.accessor === 'set') {
      return (...args: unknown[]): unknown => {
        const [value] = args;
        target[property] = value;

        return undefined;
      };
    }

    const member = target[property];

    return typeof member === 'function' ? (member.bind(target) as DrivableEntry) : undefined;
  }

  if (access.kind === 'module') {
    return requireFresh;
  }

  if (access.kind === 'through-caller') {
    const caller = subject[access.callerName];

    return typeof caller === 'function' ? (caller as DrivableEntry) : undefined;
  }

  return undefined;
};
