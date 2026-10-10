/**
 * Specimen: ternary-number-object-literal-property-cond-string-length-receiver-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: driven
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
const receiver = process.env.RECEIVER ?? '';

export const numberPropertyCondStringLengthReceiverEnv = {
    label: receiver.length ? 'then' : 'else',
};
