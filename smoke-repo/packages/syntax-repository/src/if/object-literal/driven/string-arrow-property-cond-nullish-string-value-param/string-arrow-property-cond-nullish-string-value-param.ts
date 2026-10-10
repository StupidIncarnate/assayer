/**
 * Specimen: if-string-object-literal-arrow-property-cond-nullish-string-value-param
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
export const stringArrowPropertyCondNullishStringValueParam = {
    runArrow: (value: string | undefined): string => {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    },
};
