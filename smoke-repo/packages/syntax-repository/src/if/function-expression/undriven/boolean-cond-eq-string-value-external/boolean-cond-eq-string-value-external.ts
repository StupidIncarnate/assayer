/**
 * Specimen: if-boolean-function-expression-cond-eq-string-value-external
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
export const booleanCondEqStringValueExternal = function (): string {
    if ((process.argv[2] ?? '') === 'xyz') {
        return 'then';
    }
    return 'else';
};
