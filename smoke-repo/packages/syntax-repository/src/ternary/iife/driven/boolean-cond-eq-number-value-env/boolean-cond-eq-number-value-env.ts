/**
 * Specimen: ternary-boolean-iife-cond-eq-number-value-env
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
const value = Number(process.env.VALUE);

export const booleanCondEqNumberValueEnv = ((): string => {
    return value === 7 ? 'then' : 'else';
})();
