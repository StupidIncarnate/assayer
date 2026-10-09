/**
 * PURPOSE: Turns the arrange bindings the case set carries for a class's constructor into the
 *   positional arguments `new` receives. Reach for this over reading `binding.value` directly because
 *   an array binding that stands for a REST parameter spreads across the tail slots instead of arriving
 *   as one nested argument.
 *
 *   Only bindings whose value is plain data belong here: a param, an object or an array. An env or a
 *   harness binding contributes no argument. The case-set projection never puts one in, so a harness
 *   value is never silently dropped from a construction.
 *
 * USAGE:
 * constructArgsTransformer({ construct: [{ kind: 'param', param: 'url', value: 'abc123' }] });
 * // Returns ['abc123']
 */
import type { ArrangeBinding } from '@assayer/shared/contracts';

export const constructArgsTransformer = ({ construct }: { construct?: readonly ArrangeBinding[] | undefined }): unknown[] =>
  (construct ?? []).flatMap((binding): unknown[] => {
    if (binding.kind === 'env' || binding.kind === 'harness') {
      return [];
    }

    return binding.kind === 'array' && binding.rest === true ? binding.value : [binding.value];
  });
