/**
 * Specimen: ternary-number-default-export-cond-array-length-string-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const receiver: readonly string[] = ['a', 'b', 'c'];

const numberCondArrayLengthStringReceiverConst = (): string => {
    return receiver.length ? 'then' : 'else';
};

export default numberCondArrayLengthStringReceiverConst;
