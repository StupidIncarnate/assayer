/**
 * Specimen: ternary-number-arrow-function-block-body-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 26: never
 * - ternary then on line 26: never
 * - ternary else on line 26: never
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 26
 * - line 26
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const numberBlockBodyCondNullishNumberValueExternal = (): string => {
    return (process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else';
};
