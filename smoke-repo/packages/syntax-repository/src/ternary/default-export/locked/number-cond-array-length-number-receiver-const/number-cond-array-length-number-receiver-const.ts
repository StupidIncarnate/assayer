/**
 * Specimen: ternary-number-default-export-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

const numberCondArrayLengthNumberReceiverConst = (): string => {
    return receiver.length ? 'then' : 'else';
};

export default numberCondArrayLengthNumberReceiverConst;
