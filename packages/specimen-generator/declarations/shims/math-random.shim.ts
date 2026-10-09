import { shim } from '../kit';

export const mathRandomShim = shim({
  description: 'a pseudo-random number, at least 0 and below 1',
  builtin: 'Math.random',
  form: { kind: 'call', name: 'Math.random' },
  // No input decides the result, so the shim declares its range instead of computing it.
  range: { min: 0, max: 1, maxExclusive: true, whole: false },
  // A test pins the result: Assayer picks one value in each region the code's checks cut the range into.
  pin: 'range',
  code: (): number => Math.random(),
});
