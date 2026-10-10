/**
 * Specimen: if-boolean-object-literal-method-cond-not-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: driven
 * - if else on line 24: never
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
export const booleanMethodCondNotStringValueExternal = {
    run(): string {
        if (!(process.argv[2] ?? '')) {
            return 'then';
        }
        return 'else';
    },
};
