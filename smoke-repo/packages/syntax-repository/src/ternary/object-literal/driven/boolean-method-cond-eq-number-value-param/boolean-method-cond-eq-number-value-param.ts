/**
 * Specimen: ternary-boolean-object-literal-method-cond-eq-number-value-param
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
export const booleanMethodCondEqNumberValueParam = {
    run(value: number): string {
        return value === 7 ? 'then' : 'else';
    },
};
