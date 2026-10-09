import { shim } from '../kit';

export const stringLengthShim = shim({
  description: 'the number of UTF-16 code units in a string',
  builtin: 'String.prototype.length',
  form: { kind: 'getter', name: 'length' },
  // A string's length is internal state, read directly.
  code: (receiver: string): number => receiver.length,
});
