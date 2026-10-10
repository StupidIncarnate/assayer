/**
 * Specimen: ternary-boolean-object-literal-method-cond-not-boolean-value-param
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
export const booleanMethodCondNotBooleanValueParam = {
    run(value: boolean): string {
        return !value ? 'then' : 'else';
    },
};
