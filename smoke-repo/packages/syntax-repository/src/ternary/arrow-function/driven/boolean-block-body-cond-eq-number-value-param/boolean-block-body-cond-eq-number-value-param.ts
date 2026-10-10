/**
 * Specimen: ternary-boolean-arrow-function-block-body-cond-eq-number-value-param
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
export const booleanBlockBodyCondEqNumberValueParam = (value: number): string => {
    return value === 7 ? 'then' : 'else';
};
