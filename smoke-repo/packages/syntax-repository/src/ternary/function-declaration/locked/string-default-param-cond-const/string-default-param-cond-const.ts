/**
 * Specimen: ternary-string-function-declaration-default-param-cond-const
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
const cond: string = 'abc';

export function stringDefaultParamCondConst(label: string = cond ? 'then' : 'else'): string {
    return label;
}
