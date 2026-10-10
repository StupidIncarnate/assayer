/**
 * Specimen: ternary-number-iife-cond-array-length-boolean-receiver-external
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
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberCondArrayLengthBooleanReceiverExternal = ((): string => {
    return process.argv.slice(2).map(arg => arg === 'yes').length ? 'then' : 'else';
})();
