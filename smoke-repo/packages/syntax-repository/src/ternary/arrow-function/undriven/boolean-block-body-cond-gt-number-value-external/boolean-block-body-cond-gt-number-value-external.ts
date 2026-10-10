/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-gt-number-value-external
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
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanBlockBodyCondGtNumberValueExternal = (): string => {
    return Number(process.argv[2]) > 5 ? 'then' : 'else';
};
