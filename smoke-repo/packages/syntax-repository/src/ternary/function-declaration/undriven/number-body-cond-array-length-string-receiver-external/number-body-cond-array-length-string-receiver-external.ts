/**
 * Specimen: ternary-number-function-declaration-body-cond-array-length-string-receiver-external
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
export function numberBodyCondArrayLengthStringReceiverExternal(): string {
    return process.argv.slice(2).length ? 'then' : 'else';
}
