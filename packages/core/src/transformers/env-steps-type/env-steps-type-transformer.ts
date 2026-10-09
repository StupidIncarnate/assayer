/**
 * PURPOSE: The type an environment-read operand holds after its steps run, read off the steps alone.
 *   The analyzer's own parse loads no Node types, so the checker types `process.env.X` as `any`, and
 *   every step built on it as `any` too. This transformer supplies the type Node itself declares
 *   instead: the raw read is a `string`, `Number(x)` is a `number`, a comparison is a `boolean`,
 *   `split` is a `string[]`, and `map` keeps an array whose elements the steps do not describe.
 *
 *   The raw read is a `string` rather than `string | undefined`, because a case can only ever SET a
 *   variable to a string. An unset variable is the absence of a binding, not a value a domain can
 *   name.
 *
 * USAGE:
 * envStepsTypeTransformer({ steps: [{ kind: 'default', value: '' }, { kind: 'split', separator: ',' }] });
 * // Returns { kind: 'array', element: { kind: 'string' } }
 */
import { typeDescriptorContract } from '@assayer/shared/contracts';
import type { EnvStep, TypeDescriptor } from '@assayer/shared/contracts';

export const envStepsTypeTransformer = ({ steps }: { steps: readonly EnvStep[] }): TypeDescriptor =>
  steps.reduce<TypeDescriptor>((type, step) => {
    switch (step.kind) {
      case 'number':
        return typeDescriptorContract.parse({ kind: 'number' });
      case 'equals':
        return typeDescriptorContract.parse({ kind: 'boolean' });
      case 'split':
        return typeDescriptorContract.parse({ kind: 'array', element: { kind: 'string' } });
      case 'map':
        return typeDescriptorContract.parse({ kind: 'array', element: { kind: 'unknown', text: 'unknown' } });
      case 'default':
      default:
        return type;
    }
  }, typeDescriptorContract.parse({ kind: 'string' }));
