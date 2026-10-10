/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-array-length-boolean-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
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
export const numberArrowPropertyCondArrayLengthBooleanReceiverParam = {
    runArrow: (receiver: readonly boolean[]): string => {
        return receiver.length ? 'then' : 'else';
    },
};
