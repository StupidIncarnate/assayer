/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: never
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 24
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
const value: number = 3;

export function booleanDefaultParamCondEqNumberValueConst(label: string = value === 7 ? 'then' : 'else'): string {
    return label;
}
