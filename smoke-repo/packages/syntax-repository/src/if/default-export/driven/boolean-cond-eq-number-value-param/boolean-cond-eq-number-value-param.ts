/**
 * Specimen: if-boolean-default-export-cond-eq-number-value-param
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
const booleanCondEqNumberValueParam = (value: number): string => {
    if (value === 7) {
        return 'then';
    }
    return 'else';
};

export default booleanCondEqNumberValueParam;
