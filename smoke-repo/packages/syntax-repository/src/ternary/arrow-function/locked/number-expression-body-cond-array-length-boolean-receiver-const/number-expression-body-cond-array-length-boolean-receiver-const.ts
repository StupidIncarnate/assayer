/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-array-length-boolean-receiver-const
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

export const numberExpressionBodyCondArrayLengthBooleanReceiverConst = (): string => receiver.length ? 'then' : 'else';
