/**
 * Specimen: ternary-boolean-object-literal-arrow-property-cond-not-string-value-param
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
export const booleanArrowPropertyCondNotStringValueParam = {
    runArrow: (value: string): string => {
        return !value ? 'then' : 'else';
    },
};
