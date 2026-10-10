/**
 * Specimen: if-boolean-arrow-function-block-body-cond-gt-string-value-param
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
export const booleanBlockBodyCondGtStringValueParam = (value: string): string => {
    if (value > 'm') {
        return 'then';
    }
    return 'else';
};
