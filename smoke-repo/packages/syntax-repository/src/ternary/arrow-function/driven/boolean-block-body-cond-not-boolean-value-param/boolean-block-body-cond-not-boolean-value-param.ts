/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-not-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 22: both-ways
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
    return !value ? 'then' : 'else';
};
