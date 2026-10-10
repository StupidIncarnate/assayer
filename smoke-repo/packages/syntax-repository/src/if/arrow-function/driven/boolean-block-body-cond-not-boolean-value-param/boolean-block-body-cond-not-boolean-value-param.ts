/**
 * Specimen: if-boolean-arrow-function-block-body-cond-not-boolean-value-param
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
export const booleanBlockBodyCondNotBooleanValueParam = (value: boolean): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
