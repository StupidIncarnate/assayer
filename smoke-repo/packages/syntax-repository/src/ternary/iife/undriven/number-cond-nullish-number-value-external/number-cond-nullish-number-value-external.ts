/**
 * Specimen: ternary-number-iife-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary then on line 25: never
 * - ternary else on line 25: never
 * - ternary else on line 25: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberCondNullishNumberValueExternal = ((): string => {
    return (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
})();
