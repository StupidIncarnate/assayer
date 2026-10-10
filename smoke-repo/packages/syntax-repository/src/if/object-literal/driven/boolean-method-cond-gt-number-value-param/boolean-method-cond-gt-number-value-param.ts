/**
 * Specimen: if-boolean-object-literal-method-cond-gt-number-value-param
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
export const booleanMethodCondGtNumberValueParam = {
    run(value: number): string {
        if (value > 5) {
            return 'then';
        }
        return 'else';
    },
};
