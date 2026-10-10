/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-boolean-receiver-const
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
const receiver: readonly boolean[] = [true, false, true];

export function numberBodyCondArrayLengthBooleanReceiverConst(): string {
    return receiver.length ? 'then' : 'else';
}
