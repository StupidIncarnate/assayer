/**
 * Specimen: ternary-string-default-export-cond-param
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
const stringCondParam = (cond: string): string => {
    return cond ? 'then' : 'else';
};

export default stringCondParam;
