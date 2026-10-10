/**
 * Specimen: ternary-number-object-literal-method-cond-array-length-number-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: never
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
export const numberMethodCondArrayLengthNumberReceiverExternal = {
    run(): string {
        return process.argv.slice(2).map(Number).length ? 'then' : 'else';
    },
};
