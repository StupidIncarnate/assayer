/**
 * Specimen: if-boolean-iife-cond-eq-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
const value = process.env.VALUE === 'true';

export const booleanCondEqBooleanValueEnv = ((): string => {
    if (value === false) {
        return 'then';
    }
    return 'else';
})();
