/**
 * Specimen: if-boolean-iife-cond-eq-number-value-env
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
const value = Number(process.env.VALUE);

export const booleanCondEqNumberValueEnv = ((): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
})();
