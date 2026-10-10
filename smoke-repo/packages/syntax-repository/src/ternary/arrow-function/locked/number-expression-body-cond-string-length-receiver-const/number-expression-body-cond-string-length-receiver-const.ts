/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-string-length-receiver-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 24
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const receiver: string = 'abc';

export const numberExpressionBodyCondStringLengthReceiverConst = (): string => receiver.length ? 'then' : 'else';
