/**
 * Specimen: ternary-number-function-declaration-default-param-cond-array-length-boolean-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 23
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

export function numberDefaultParamCondArrayLengthBooleanReceiverConst(label: string = receiver.length ? 'then' : 'else'): string {
    return label;
}
