/**
 * Specimen: ternary-boolean-function-expression-cond-nullish-boolean-value-param
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
export const booleanCondNullishBooleanValueParam = function (value: boolean | undefined): string {
    return value ?? false ? 'then' : 'else';
};
