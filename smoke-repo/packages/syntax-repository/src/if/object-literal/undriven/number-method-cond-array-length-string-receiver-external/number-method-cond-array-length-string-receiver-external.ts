/**
 * Specimen: if-number-object-literal-method-cond-array-length-string-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberMethodCondArrayLengthStringReceiverExternal = {
    run(): string {
        if (process.argv.slice(2).length) {
            return 'then';
        }
        return 'else';
    },
};
