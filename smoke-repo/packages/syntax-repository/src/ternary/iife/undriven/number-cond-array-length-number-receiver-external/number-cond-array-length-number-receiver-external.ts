/**
 * Specimen: ternary-number-iife-cond-array-length-number-receiver-external
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
export const numberCondArrayLengthNumberReceiverExternal = ((): string => {
    return process.argv.slice(2).map(Number).length ? 'then' : 'else';
})();
