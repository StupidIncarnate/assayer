/**
 * Specimen: if-boolean-object-literal-arrow-property-cond-param
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
export const booleanArrowPropertyCondParam = {
    runArrow: (cond: boolean): string => {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
