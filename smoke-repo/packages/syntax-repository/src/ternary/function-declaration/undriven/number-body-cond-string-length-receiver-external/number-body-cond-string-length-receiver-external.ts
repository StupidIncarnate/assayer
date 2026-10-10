/**
 * Specimen: ternary-number-function-declaration-body-cond-string-length-receiver-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 22: never
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
export function numberBodyCondStringLengthReceiverExternal(): string {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
}
