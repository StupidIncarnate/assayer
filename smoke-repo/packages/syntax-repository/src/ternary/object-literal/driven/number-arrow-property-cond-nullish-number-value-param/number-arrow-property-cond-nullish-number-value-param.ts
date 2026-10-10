/**
 * Specimen: ternary-number-object-literal-arrow-property-cond-nullish-number-value-param
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
export const numberArrowPropertyCondNullishNumberValueParam = {
    runArrow: (value: number | undefined): string => {
        return value ?? 0 ? 'then' : 'else';
    },
};
