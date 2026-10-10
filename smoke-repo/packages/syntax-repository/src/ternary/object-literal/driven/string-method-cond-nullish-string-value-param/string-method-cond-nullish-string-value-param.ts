/**
 * Specimen: ternary-string-object-literal-method-cond-nullish-string-value-param
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
export const stringMethodCondNullishStringValueParam = {
    run(value: string | undefined): string {
        return value ?? '' ? 'then' : 'else';
    },
};
