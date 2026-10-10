/**
 * Specimen: if-boolean-object-literal-method-cond-not-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
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
export const booleanMethodCondNotNumberValueParam = {
    run(value: number): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
