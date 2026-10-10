/**
 * Specimen: if-boolean-iife-cond-gt-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 22: never
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
export const booleanCondGtStringValueExternal = ((): string => {
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
})();
