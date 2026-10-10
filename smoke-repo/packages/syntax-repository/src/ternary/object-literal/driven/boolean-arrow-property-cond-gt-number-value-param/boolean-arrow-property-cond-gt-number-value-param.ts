/**
 * Specimen: ternary-boolean-object-literal-arrow-property-cond-gt-number-value-param
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
export const booleanArrowPropertyCondGtNumberValueParam = {
    runArrow: (value: number): string => {
        return value > 5 ? 'then' : 'else';
    },
};
