/**
 * Specimen: ternary-boolean-iife-cond-env
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
const cond = process.env.COND === 'true';

export const booleanCondEnv = ((): string => {
    return cond ? 'then' : 'else';
})();
