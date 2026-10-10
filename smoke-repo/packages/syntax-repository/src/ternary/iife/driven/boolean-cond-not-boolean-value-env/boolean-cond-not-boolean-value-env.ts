/**
 * Specimen: ternary-boolean-iife-cond-not-boolean-value-env
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 25: driven
 * - ternary else on line 25: driven
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

export const booleanCondNotBooleanValueEnv = ((): string => {
    return !value ? 'then' : 'else';
})();
