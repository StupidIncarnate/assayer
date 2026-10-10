/**
 * Specimen: ternary-boolean-iife-cond-eq-boolean-value-external
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
export const booleanCondEqBooleanValueExternal = ((): string => {
    return process.argv[2] === 'yes' === false ? 'then' : 'else';
})();
