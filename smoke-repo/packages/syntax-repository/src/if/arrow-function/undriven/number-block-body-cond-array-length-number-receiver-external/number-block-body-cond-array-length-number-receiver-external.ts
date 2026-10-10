/**
 * Specimen: if-number-arrow-function-block-body-cond-array-length-number-receiver-external
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
export const numberBlockBodyCondArrayLengthNumberReceiverExternal = (): string => {
    if (process.argv.slice(2).map(Number).length) {
        return 'then';
    }
    return 'else';
};
