import { shim } from '../kit';

export const arrayLengthShim = shim({
  description: 'the number of elements in an array',
  builtin: 'Array.prototype.length',
  form: { kind: 'getter', name: 'length' },
  // An array's length is internal state. This shim is the floor every other array shim reads it through.
  code: <T>(receiver: readonly T[]): number => receiver.length,
});
