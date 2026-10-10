/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberArrowPropertyCondArrayLengthNumberReceiverExternal = {
    runArrow: (): string => {
        return process.argv.slice(2).map(Number).length ? 'then' : 'else';
    },
};
