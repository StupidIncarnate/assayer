/**
 * Specimen: if-boolean-default-export-cond-gt-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: driven
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
const booleanCondGtNumberValueParam = (value: number): string => {
    if (value > 5) {
        return 'then';
    }
    return 'else';
};

export default booleanCondGtNumberValueParam;
