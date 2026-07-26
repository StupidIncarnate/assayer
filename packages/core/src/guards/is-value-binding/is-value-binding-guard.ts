/**
 * PURPOSE: Answers whether an arrange binding carries a plain VALUE keyed by its param — true for
 *   `param`, `array`, and `object`, false for `env` (keyed by an environment variable NAME, never a
 *   param) and `harness` (keyed by a harness KEY PATH, carrying no value at all — the run resolves it
 *   later by loading the same harness file). It is the ONE answer to "can this binding's `.value` be
 *   read and embedded elsewhere", asked wherever a caller pulls one binding's value out of a case and
 *   uses it directly — a callback's element binding folded into the single-element array the host
 *   receives, or the general type-check every value-carrying binding is validated against its param's
 *   declared type by.
 *
 *   `env` and `harness` are excluded for different, real reasons: an `env` binding sets a process
 *   variable, not an argument, so it names no param a reader could pull a value from BY that param; a
 *   `harness` binding names a key path into a live registration the run resolves, so there is no value
 *   here yet to read. A caller that hand-rolls `kind === 'param'` (missing the composite `array`/
 *   `object` arms) or `kind === 'array'` alone repeats this recognition by hand and drifts from it the
 *   moment a new arm is added — this guard is the one place it lives.
 *
 * USAGE:
 * isValueBindingGuard({ binding: { kind: 'array', param: 'items', value: [7] } });
 * // Returns true
 * isValueBindingGuard({ binding: { kind: 'harness', param: 'sink', key: 'inputs.run.sink' } });
 * // Returns false
 */
import type { ArrangeBinding } from '@assayer/shared/contracts';

export const isValueBindingGuard = ({ binding }: { binding?: ArrangeBinding }): boolean =>
  binding !== undefined && (binding.kind === 'param' || binding.kind === 'array' || binding.kind === 'object');
