/**
 * Specimen: if-number-function-expression-cond-array-length-string-receiver-external
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
export const numberCondArrayLengthStringReceiverExternal = function (): string {
    if (process.argv.slice(2).length) {
        return 'then';
    }
    return 'else';
};
