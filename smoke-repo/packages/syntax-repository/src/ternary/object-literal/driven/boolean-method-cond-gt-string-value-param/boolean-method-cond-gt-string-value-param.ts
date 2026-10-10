/**
 * Specimen: ternary-boolean-object-literal-method-cond-gt-string-value-param
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
export const booleanMethodCondGtStringValueParam = {
    run(value: string): string {
        return value > 'm' ? 'then' : 'else';
    },
};
