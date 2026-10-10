/**
 * Specimen: if-number-default-export-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 22: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const numberCondArrayLengthStringReceiverExternal = (): string => {
    if (process.argv.slice(2).length) {
        return 'then';
    }
    return 'else';
};

export default numberCondArrayLengthStringReceiverExternal;
