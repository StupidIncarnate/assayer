/**
 * Specimen: ternary-boolean-function-expression-cond-not-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 25: never
 * - ternary else on line 25: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 25
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
const value: boolean = true;

export const booleanCondNotBooleanValueConst = function (): string {
    return !value ? 'then' : 'else';
};
