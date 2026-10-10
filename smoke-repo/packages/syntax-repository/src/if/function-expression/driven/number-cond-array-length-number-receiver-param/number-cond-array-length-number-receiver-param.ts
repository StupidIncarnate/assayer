/**
 * Specimen: if-number-function-expression-cond-array-length-number-receiver-param
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
export const numberCondArrayLengthNumberReceiverParam = function (receiver: readonly number[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
