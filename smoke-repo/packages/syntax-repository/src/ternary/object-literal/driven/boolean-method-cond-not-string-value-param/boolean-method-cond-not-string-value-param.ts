/**
 * Specimen: ternary-boolean-object-literal-method-cond-not-string-value-param
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
export const booleanMethodCondNotStringValueParam = {
    run(value: string): string {
        return !value ? 'then' : 'else';
    },
};
