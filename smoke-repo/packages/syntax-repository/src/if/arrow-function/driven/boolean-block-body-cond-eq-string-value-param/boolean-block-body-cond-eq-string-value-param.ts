/**
 * Specimen: if-boolean-arrow-function-block-body-cond-eq-string-value-param
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
export const booleanBlockBodyCondEqStringValueParam = (value: string): string => {
    if (value === 'xyz') {
        return 'then';
    }
    return 'else';
};
