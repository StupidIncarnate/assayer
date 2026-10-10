/**
 * Specimen: if-boolean-object-literal-method-cond-eq-boolean-value-param
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
export const booleanMethodCondEqBooleanValueParam = {
    run(value: boolean): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    },
};
