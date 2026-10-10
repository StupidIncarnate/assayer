/**
 * Specimen: ternary-number-default-export-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: driven
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
const numberCondArrayLengthNumberReceiverExternal = (): string => {
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
};

export default numberCondArrayLengthNumberReceiverExternal;
