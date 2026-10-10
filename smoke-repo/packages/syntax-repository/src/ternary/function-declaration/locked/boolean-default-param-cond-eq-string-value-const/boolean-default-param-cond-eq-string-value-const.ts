/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-string-value-const
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
const value: string = 'abc';

export function booleanDefaultParamCondEqStringValueConst(label: string = value === 'xyz' ? 'then' : 'else'): string {
    return label;
}
