/**
 * Specimen: if-boolean-object-literal-arrow-property-cond-eq-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanArrowPropertyCondEqNumberValueParam = {
    runArrow: (value: number): string => {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    },
};
