/**
 * Specimen: ternary-boolean-function-expression-cond-eq-string-value-param
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
export const booleanCondEqStringValueParam = function (value: string): string {
    return value === 'xyz' ? 'then' : 'else';
};
