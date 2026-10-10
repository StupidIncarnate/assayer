/**
 * Specimen: if-number-arrow-function-block-body-cond-array-length-string-receiver-external
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
export const numberBlockBodyCondArrayLengthStringReceiverExternal = (): string => {
    if (process.argv.slice(2).length) {
        return 'then';
    }
    return 'else';
};
