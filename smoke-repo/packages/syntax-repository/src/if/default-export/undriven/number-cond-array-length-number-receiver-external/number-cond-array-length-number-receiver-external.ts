/**
 * Specimen: if-number-default-export-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
 * - if else on line 23: driven
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
    if (process.argv.slice(2).map(Number).length) {
        return 'then';
    }
    return 'else';
};

export default numberCondArrayLengthNumberReceiverExternal;
