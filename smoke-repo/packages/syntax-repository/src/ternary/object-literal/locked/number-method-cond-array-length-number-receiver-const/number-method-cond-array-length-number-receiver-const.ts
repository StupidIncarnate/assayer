/**
 * Specimen: ternary-number-object-literal-method-cond-array-length-number-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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

export const numberMethodCondArrayLengthNumberReceiverConst = {
    run(): string {
        return receiver.length ? 'then' : 'else';
    },
};
