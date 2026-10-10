/**
 * Specimen: if-boolean-iife-cond-eq-boolean-value-external
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
export const booleanCondEqBooleanValueExternal = ((): string => {
    if (process.argv[2] === 'yes' === false) {
        return 'then';
    }
    return 'else';
})();
