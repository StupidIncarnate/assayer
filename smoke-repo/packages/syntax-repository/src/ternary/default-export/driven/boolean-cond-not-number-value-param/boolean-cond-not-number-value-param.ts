/**
 * Specimen: ternary-boolean-default-export-cond-not-number-value-param
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
const booleanCondNotNumberValueParam = (value: number): string => {
    return !value ? 'then' : 'else';
};

export default booleanCondNotNumberValueParam;
