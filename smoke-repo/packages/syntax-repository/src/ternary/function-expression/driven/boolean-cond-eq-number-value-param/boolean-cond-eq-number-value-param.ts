/**
 * Specimen: ternary-boolean-function-expression-cond-eq-number-value-param
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
export const booleanCondEqNumberValueParam = function (value: number): string {
    return value === 7 ? 'then' : 'else';
};
