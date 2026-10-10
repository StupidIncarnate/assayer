/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-const
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
const cond: boolean = true;

export function booleanDefaultParamCondConst(label: string = cond ? 'then' : 'else'): string {
    return label;
}
