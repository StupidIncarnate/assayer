/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export function booleanDefaultParamCondNullishBooleanValueConst(label: string = value ?? false ? 'then' : 'else'): string {
    return label;
}
