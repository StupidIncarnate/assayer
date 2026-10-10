/**
 * Specimen: if-string-object-literal-method-cond-param
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
export const stringMethodCondParam = {
    run(cond: string): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    },
};
