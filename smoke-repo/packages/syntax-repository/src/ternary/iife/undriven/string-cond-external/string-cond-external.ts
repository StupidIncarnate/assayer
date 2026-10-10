/**
 * Specimen: ternary-string-iife-cond-external
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
export const stringCondExternal = ((): string => {
    return process.argv[2] ?? '' ? 'then' : 'else';
})();
