/**
 * Specimen: ternary-number-object-literal-method-cond-param
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
export const numberMethodCondParam = {
    run(cond: number): string {
        return cond ? 'then' : 'else';
    },
};
