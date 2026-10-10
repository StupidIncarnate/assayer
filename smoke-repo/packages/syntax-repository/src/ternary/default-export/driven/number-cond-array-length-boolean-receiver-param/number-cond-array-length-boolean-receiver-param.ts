/**
 * Specimen: ternary-number-default-export-cond-array-length-boolean-receiver-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: driven
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
    return receiver.length ? 'then' : 'else';
};

export default numberCondArrayLengthBooleanReceiverParam;
