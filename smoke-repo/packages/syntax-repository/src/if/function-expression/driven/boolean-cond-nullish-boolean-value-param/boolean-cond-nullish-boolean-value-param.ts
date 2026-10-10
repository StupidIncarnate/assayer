/**
 * Specimen: if-boolean-function-expression-cond-nullish-boolean-value-param
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
export const booleanCondNullishBooleanValueParam = function (value: boolean | undefined): string {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
