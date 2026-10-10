/**
 * Specimen: if-number-iife-cond-nullish-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 28
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
const value: number | undefined = 3;

export const numberCondNullishNumberValueConst = ((): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
})();
