/**
 * Specimen: ternary-number-function-expression-cond-nullish-number-value-param
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
export const numberCondNullishNumberValueParam = function (value: number | undefined): string {
    return value ?? 0 ? 'then' : 'else';
};
