/**
 * Specimen: ternary-boolean-iife-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 23: never
 * - ternary else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 22
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanCondEqNumberValueExternal = ((): string => {
    return Number(process.argv[2]) === 7 ? 'then' : 'else';
})();
