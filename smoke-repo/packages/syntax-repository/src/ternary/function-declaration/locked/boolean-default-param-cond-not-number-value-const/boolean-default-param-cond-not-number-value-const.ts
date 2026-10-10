/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-not-number-value-const
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

export function booleanDefaultParamCondNotNumberValueConst(label: string = !value ? 'then' : 'else'): string {
    return label;
}
