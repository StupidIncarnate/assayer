/**
 * Specimen: if-boolean-arrow-function-block-body-cond-not-boolean-value-param
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
export const booleanBlockBodyCondNotBooleanValueParam = (value: boolean): string => {
    if (!value) {
        return 'then';
    }
    return 'else';
};
