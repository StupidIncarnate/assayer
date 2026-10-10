/**
 * Specimen: ternary-boolean-object-literal-arrow-property-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanArrowPropertyCondEqNumberValueExternal = {
    runArrow: (): string => {
        return Number(process.argv[2]) === 7 ? 'then' : 'else';
    },
};
