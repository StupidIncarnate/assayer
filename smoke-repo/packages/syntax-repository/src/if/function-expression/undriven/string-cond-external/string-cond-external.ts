/**
 * Specimen: if-string-function-expression-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
 * - if else on line 23: driven
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
export const stringCondExternal = function (): string {
    if (process.argv[2] ?? '') {
        return 'then';
    }
    return 'else';
};
