/**
 * Specimen: ternary-boolean-object-literal-method-cond-not-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
export const booleanMethodCondNotBooleanValueParam = {
    run(value: boolean): string {
        return !value ? 'then' : 'else';
    },
};
