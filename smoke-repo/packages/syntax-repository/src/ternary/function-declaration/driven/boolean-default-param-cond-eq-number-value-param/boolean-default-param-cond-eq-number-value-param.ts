/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-eq-number-value-param
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
export function booleanDefaultParamCondEqNumberValueParam(value: number, label: string = value === 7 ? 'then' : 'else'): string {
    return label;
}
