/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-const
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
const cond: boolean = true;

export function booleanDefaultParamCondConst(label: string = cond ? 'then' : 'else'): string {
    return label;
}
