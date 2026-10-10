/**
 * Specimen: if-string-arrow-function-block-body-cond-nullish-string-value-param
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
export const stringBlockBodyCondNullishStringValueParam = (value: string | undefined): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};
