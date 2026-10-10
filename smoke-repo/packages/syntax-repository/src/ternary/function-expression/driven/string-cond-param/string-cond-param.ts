/**
 * Specimen: ternary-string-function-expression-cond-param
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
export const stringCondParam = function (cond: string): string {
    return cond ? 'then' : 'else';
};
