/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-boolean-value-external
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
export function booleanDefaultParamCondEqBooleanValueExternal(label: string = process.argv[2] === 'yes' === false ? 'then' : 'else'): string {
    return label;
}
