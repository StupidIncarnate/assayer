/**
 * Specimen: if-number-iife-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 25: never
 * - if else on line 25: never
 * - ternary then on line 25: never
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
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        return 'then';
    }
    return 'else';
})();
