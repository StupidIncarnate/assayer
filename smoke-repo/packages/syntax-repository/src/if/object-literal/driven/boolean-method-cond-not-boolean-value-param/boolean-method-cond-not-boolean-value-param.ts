/**
 * Specimen: if-boolean-object-literal-method-cond-not-boolean-value-param
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
export const booleanMethodCondNotBooleanValueParam = {
    run(value: boolean): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    },
};
