/**
 * Specimen: ternary-number-iife-cond-string-length-receiver-external
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
export const numberCondStringLengthReceiverExternal = ((): string => {
    return (process.argv[2] ?? '').length ? 'then' : 'else';
})();
