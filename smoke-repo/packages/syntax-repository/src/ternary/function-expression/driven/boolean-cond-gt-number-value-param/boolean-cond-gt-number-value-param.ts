/**
 * Specimen: ternary-boolean-function-expression-cond-gt-number-value-param
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
export const booleanCondGtNumberValueParam = function (value: number): string {
    return value > 5 ? 'then' : 'else';
};
