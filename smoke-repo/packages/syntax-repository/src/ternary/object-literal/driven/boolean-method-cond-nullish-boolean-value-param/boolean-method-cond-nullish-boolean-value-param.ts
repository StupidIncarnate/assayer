/**
 * Specimen: ternary-boolean-object-literal-method-cond-nullish-boolean-value-param
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
export const booleanMethodCondNullishBooleanValueParam = {
    run(value: boolean | undefined): string {
        return value ?? false ? 'then' : 'else';
    },
};
