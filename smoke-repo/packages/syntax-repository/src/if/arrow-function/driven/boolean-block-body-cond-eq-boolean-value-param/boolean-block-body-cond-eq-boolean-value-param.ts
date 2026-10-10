/**
 * Specimen: if-boolean-arrow-function-block-body-cond-eq-boolean-value-param
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
export const booleanBlockBodyCondEqBooleanValueParam = (value: boolean): string => {
    if (value === false) {
        return 'then';
    }
    return 'else';
};
