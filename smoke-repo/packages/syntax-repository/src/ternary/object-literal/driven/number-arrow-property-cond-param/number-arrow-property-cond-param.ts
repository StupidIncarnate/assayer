/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
export const numberArrowPropertyCondParam = {
    runArrow: (cond: number): string => {
        return cond ? 'then' : 'else';
    },
};
