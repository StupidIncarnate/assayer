/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-not-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 21: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 21
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function booleanDefaultParamCondNotStringValueExternal(label: string = !(process.argv[2] ?? '') ? 'then' : 'else'): string {
    return label;
}
