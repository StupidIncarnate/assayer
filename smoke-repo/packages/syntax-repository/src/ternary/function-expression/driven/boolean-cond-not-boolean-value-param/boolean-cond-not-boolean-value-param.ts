/**
 * Specimen: ternary-boolean-function-expression-cond-not-boolean-value-param
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
export const booleanCondNotBooleanValueParam = function (value: boolean): string {
    return !value ? 'then' : 'else';
};
