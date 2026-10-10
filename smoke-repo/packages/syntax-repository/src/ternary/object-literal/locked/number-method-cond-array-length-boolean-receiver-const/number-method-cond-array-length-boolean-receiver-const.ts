/**
 * Specimen: ternary-number-object-literal-method-cond-array-length-boolean-receiver-const
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
const receiver: readonly boolean[] = [true, false, true];

export const numberMethodCondArrayLengthBooleanReceiverConst = {
    run(): string {
        return receiver.length ? 'then' : 'else';
    },
};
