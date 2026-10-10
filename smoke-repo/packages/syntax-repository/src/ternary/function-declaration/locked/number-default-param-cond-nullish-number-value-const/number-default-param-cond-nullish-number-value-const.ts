/**
 * Specimen: ternary-number-function-declaration-default-param-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export function numberDefaultParamCondNullishNumberValueConst(label: string = value ?? 0 ? 'then' : 'else'): string {
    return label;
}
