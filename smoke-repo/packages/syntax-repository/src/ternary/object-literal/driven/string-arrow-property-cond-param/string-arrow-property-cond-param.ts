/**
 * Specimen: ternary-string-object-literal-arrow-property-cond-param
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
export const stringArrowPropertyCondParam = {
    runArrow: (cond: string): string => {
        return cond ? 'then' : 'else';
    },
};
