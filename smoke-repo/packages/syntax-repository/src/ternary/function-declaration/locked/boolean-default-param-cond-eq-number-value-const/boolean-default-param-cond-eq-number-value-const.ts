/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 23
 *
 * Expected undriven lines:
 * - none
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
const value: number = 3;

export function booleanDefaultParamCondEqNumberValueConst(label: string = value === 7 ? 'then' : 'else'): string {
    return label;
}
