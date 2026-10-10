/**
 * Specimen: if-boolean-iife-cond-nullish-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 * - if then on line 27: driven
 * - if else on line 27: driven
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
const value = process.env.VALUE === undefined ? undefined : process.env.VALUE === 'true';

export const booleanCondNullishBooleanValueEnv = ((): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
})();
