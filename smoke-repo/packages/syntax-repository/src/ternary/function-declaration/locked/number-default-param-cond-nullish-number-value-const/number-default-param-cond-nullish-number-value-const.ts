/**
 * Specimen: ternary-number-function-declaration-default-param-cond-nullish-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: never
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
const value: number | undefined = 3;

export function numberDefaultParamCondNullishNumberValueConst(label: string = value ?? 0 ? 'then' : 'else'): string {
    return label;
}
