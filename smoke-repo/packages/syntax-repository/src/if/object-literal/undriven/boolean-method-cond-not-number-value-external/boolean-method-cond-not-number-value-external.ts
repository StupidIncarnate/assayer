/**
 * Specimen: if-boolean-object-literal-method-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 24: never
 * - if else on line 24: driven
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
export const booleanMethodCondNotNumberValueExternal = {
    run(): string {
        if (!Number(process.argv[2])) {
            return 'then';
        }
        return 'else';
    },
};
