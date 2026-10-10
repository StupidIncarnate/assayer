/**
 * Specimen: ternary-string-function-declaration-default-param-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export function stringDefaultParamCondNullishStringValueConst(label: string = value ?? '' ? 'then' : 'else'): string {
    return label;
}
