/**
 * Specimen: if-boolean-arrow-function-block-body-cond-not-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: driven
 * - if else on line 23: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 23
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export const booleanBlockBodyCondNotNumberValueExternal = (): string => {
    if (!Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
};
