/**
 * Specimen: ternary-number-arrow-function-expression-body-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 22: never
 * - ternary else on line 22: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberExpressionBodyCondArrayLengthNumberReceiverExternal = (): string => process.argv.slice(2).map(Number).length ? 'then' : 'else';
