/**
 * Specimen: ternary-boolean-object-literal-method-cond-eq-boolean-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
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
export const booleanMethodCondEqBooleanValueParam = {
    run(value: boolean): string {
        return value === false ? 'then' : 'else';
    },
};
