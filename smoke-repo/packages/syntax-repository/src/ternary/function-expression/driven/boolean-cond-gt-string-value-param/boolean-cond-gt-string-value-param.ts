/**
 * Specimen: ternary-boolean-function-expression-cond-gt-string-value-param
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
export const booleanCondGtStringValueParam = function (value: string): string {
    return value > 'm' ? 'then' : 'else';
};
