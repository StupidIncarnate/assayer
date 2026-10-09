import { shim } from '../kit';

export const arrayAtShim = shim({
  description: 'reads one element of an array, counting back from the end for a negative index',
  builtin: 'Array.prototype.at',
  form: { kind: 'method', name: 'at' },
  // Spec steps: take the length; cut the index down to a whole number toward zero, with NaN as 0; a
  // negative index counts back from the length; outside the array is undefined.
  code: <T>(receiver: readonly T[], index: number): T | undefined => {
    const whole = index !== index ? 0 : index - (index % 1);
    const k = whole >= 0 ? whole : receiver.length + whole;
    if (k < 0 || k >= receiver.length) {
      return undefined;
    }
    return receiver[k];
  },
});
