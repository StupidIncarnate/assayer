/**
 * PURPOSE: The type an environment-read operand holds after its steps run, read off the steps alone.
 *   The analyzer's own parse loads no Node types, so the checker types `process.env.X` as `any`, and
 *   every step built on it as `any` too. This transformer supplies the type Node itself declares
 *   instead: the raw read is a `string`, `Number(x)` is a `number`, a comparison is a `boolean`,
 *   `split` is a `string[]`, and `map` keeps an array whose elements the steps do not describe. A
 *   `default` keeps the type of what it falls back from.
 *
 *   A chain that can hold `undefined` through a `guard` (`x === undefined ? undefined : Number(x)`) is
 *   the union of `undefined` and what the later steps build, with `undefined` spelled the way the
 *   checker spells it, so the operand reads exactly as a declared `number | undefined` does.
 *
 *   A command-line read built from the same steps is typed the same way. Its `root` matters only for
 *   `process.argv.slice(<index>)`, which starts as a `string[]` and never holds `undefined`.
 *
 *   The raw read is a `string` rather than `string | undefined`. Its unset state is still an input a
 *   case can arrange: the domain's `null` point stands for it (`env-encode`), and only a predicate that
 *   tests for it (`=== undefined`, the `??` operand's nullish test) ever names that point.
 *
 * USAGE:
 * envStepsTypeTransformer({ steps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }] });
 * // Returns { kind: 'array', element: { kind: 'string' } }
 */
import { typeDescriptorContract } from '@assayer/shared/contracts';
import type { EnvStep, TypeDescriptor } from '@assayer/shared/contracts';

import type { ExternalOperandReadout } from '../../contracts/external-operand-readout/external-operand-readout-contract';
import { isEnvStepsNullableGuard } from '../../guards/is-env-steps-nullable/is-env-steps-nullable-guard';

export const envStepsTypeTransformer = ({
  steps,
  root,
}: {
  steps: readonly EnvStep[];
  root?: ExternalOperandReadout['root'];
}): TypeDescriptor => {
  const isTail = root?.kind === 'argv' && root.shape === 'tail';
  const built = steps.reduce<TypeDescriptor>((type, step) => {
    switch (step.kind) {
      case 'number':
        return typeDescriptorContract.parse({ kind: 'number' });
      case 'equals':
        return typeDescriptorContract.parse({ kind: 'boolean' });
      case 'split':
        return typeDescriptorContract.parse({ kind: 'array', element: { kind: 'string' } });
      case 'map':
        return typeDescriptorContract.parse({ kind: 'array', element: { kind: 'unknown', text: 'unknown' } });
      case 'guard':
      case 'default':
      default:
        return type;
    }
  }, typeDescriptorContract.parse(isTail ? { kind: 'array', element: { kind: 'string' } } : { kind: 'string' }));

  return !isTail && steps.length > 0 && isEnvStepsNullableGuard({ steps })
    ? typeDescriptorContract.parse({ kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, built] })
    : built;
};
