/**
 * Specimen: if-number-function-expression-cond-nullish-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 22: both-ways
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
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
};
