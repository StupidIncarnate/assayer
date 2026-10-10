/**
 * Specimen: if-boolean-object-literal-method-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 27: never
 * - if else on line 27: driven
 * - ternary then on line 27: never
 * - ternary else on line 27: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 27
 * - line 27
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanMethodCondNullishBooleanValueExternal = {
    run(): string {
        if ((process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false) {
            return 'then';
        }
        return 'else';
    },
};
