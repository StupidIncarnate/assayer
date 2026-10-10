/**
 * Specimen: ternary-string-arrow-function-block-body-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 23: driven
 * - ternary else on line 23: driven
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
export const stringBlockBodyCondParam = (cond: string): string => {
    return cond ? 'then' : 'else';
};
