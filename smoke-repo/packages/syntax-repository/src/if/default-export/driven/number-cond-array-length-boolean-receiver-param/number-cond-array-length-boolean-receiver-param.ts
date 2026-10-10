/**
 * Specimen: if-number-default-export-cond-array-length-boolean-receiver-param
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
const numberCondArrayLengthBooleanReceiverParam = (receiver: readonly boolean[]): string => {
    if (receiver.length) {
        return 'then';
    }
    return 'else';
};

export default numberCondArrayLengthBooleanReceiverParam;
