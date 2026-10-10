/**
 * Specimen: if-boolean-arrow-function-block-body-cond-nullish-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const booleanBlockBodyCondNullishBooleanValueParam = (value: boolean | undefined): string => {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
