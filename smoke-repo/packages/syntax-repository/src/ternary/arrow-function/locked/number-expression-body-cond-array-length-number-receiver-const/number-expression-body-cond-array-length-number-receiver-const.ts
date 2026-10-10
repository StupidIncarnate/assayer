/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-array-length-number-receiver-const
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
const receiver: readonly number[] = [10, 20, 30];

export const numberExpressionBodyCondArrayLengthNumberReceiverConst = (): string => receiver.length ? 'then' : 'else';
