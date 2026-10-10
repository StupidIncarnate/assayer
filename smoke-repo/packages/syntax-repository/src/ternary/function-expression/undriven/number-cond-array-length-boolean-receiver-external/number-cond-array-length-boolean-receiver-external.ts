/**
 * Specimen: ternary-number-function-expression-cond-array-length-boolean-receiver-external
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
export const numberCondArrayLengthBooleanReceiverExternal = function (): string {
    return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
};
