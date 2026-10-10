/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-boolean-value-param
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
export function booleanDefaultParamCondEqBooleanValueParam(value: boolean, label: string = value === false ? 'then' : 'else'): string {
    return label;
}
