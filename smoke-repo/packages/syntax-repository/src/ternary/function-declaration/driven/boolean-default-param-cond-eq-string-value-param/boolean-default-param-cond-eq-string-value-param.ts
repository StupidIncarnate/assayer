/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-string-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 21: both-ways
 *
 * Expected lints:
 * - none
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
export function booleanDefaultParamCondEqStringValueParam(value: string, label: string = value === 'xyz' ? 'then' : 'else'): string {
    return label;
}
