/**
 * Specimen: ternary-boolean-function-expression-cond-eq-boolean-value-param
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
export const booleanCondEqBooleanValueParam = function (value: boolean): string {
    return value === false ? 'then' : 'else';
};
