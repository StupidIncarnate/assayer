/**
 * Specimen: if-number-function-expression-cond-array-length-boolean-receiver-param
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
export const numberCondArrayLengthBooleanReceiverParam = function (receiver: readonly boolean[]): string {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};
