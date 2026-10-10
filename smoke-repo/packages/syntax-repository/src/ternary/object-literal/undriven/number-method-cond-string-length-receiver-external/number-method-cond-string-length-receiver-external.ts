/**
 * Specimen: ternary-number-object-literal-method-cond-string-length-receiver-external
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
export const numberMethodCondStringLengthReceiverExternal = {
    run(): string {
        return (process.argv[2] ?? '').length ? 'then' : 'else';
    },
};
