/**
 * Specimen: if-boolean-iife-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
 * - ternary on line 23: never
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
export const booleanCondNullishBooleanValueExternal = ((): string => {
    if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
        return 'then';
    }
    return 'else';
})();
