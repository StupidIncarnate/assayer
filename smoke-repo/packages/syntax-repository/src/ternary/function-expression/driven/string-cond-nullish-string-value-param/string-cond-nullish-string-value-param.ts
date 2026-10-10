/**
 * Specimen: ternary-string-function-expression-cond-nullish-string-value-param
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
export const stringCondNullishStringValueParam = function (value: string | undefined): string {
    return value ?? '' ? 'then' : 'else';
};
