/**
 * Specimen: if-boolean-function-expression-cond-eq-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 23: never
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
export const booleanCondEqNumberValueExternal = function (): string {
    if (Number(process.argv[2]) === 7) {
        return 'then';
    }
    return 'else';
};
