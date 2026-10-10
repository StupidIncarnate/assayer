/**
 * Specimen: if-number-arrow-function-block-body-cond-array-length-string-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
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
export const numberBlockBodyCondArrayLengthStringReceiverParam = (receiver: readonly string[]): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
