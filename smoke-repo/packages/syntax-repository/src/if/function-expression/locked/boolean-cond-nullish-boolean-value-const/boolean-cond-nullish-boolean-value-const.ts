/**
 * Specimen: if-boolean-function-expression-cond-nullish-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if then on line 25: driven
 * - if else on line 25: never
 *
 * Expected lint errors:
 * - unreachable-exit on line 28
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
const value: boolean | undefined = true;

export const booleanCondNullishBooleanValueConst = function (): string {
    if (value ?? false) {
        return 'then';
    }
    return 'else';
};
