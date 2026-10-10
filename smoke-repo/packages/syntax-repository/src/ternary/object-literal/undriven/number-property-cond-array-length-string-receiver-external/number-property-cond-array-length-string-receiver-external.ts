/**
 * Specimen: ternary-number-object-literal-property-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberPropertyCondArrayLengthStringReceiverExternal = {
    label: process.argv.slice(2).length ? 'then' : 'else',
};
