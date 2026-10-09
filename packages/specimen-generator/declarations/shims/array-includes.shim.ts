import { shim } from '../kit';

export const arrayIncludesShim = shim({
  description: 'says whether an array holds a value',
  builtin: 'Array.prototype.includes',
  form: { kind: 'method', name: 'includes' },
  // The spec compares with SameValueZero, which treats NaN as equal to NaN. `===` does not. The two only
  // differ for NaN, which is not in the types yet.
  code: <T>(receiver: readonly T[], searchElement: T): boolean => {
    for (const element of receiver) {
      if (element === searchElement) {
        return true;
      }
    }
    return false;
  },
});
