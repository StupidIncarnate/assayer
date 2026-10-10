/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-string-value-const
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
const value: string = 'abc';

export function booleanDefaultParamCondEqStringValueConst(label: string = value === 'xyz' ? 'then' : 'else'): string {
    return label;
}
