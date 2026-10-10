/**
 * Specimen: ternary-number-object-literal-method-cond-nullish-number-value-param
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
export const numberMethodCondNullishNumberValueParam = {
    run(value: number | undefined): string {
        return value ?? 0 ? 'then' : 'else';
    },
};
