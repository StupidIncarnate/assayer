/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-not-number-value-param
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
export function booleanDefaultParamCondNotNumberValueParam(value: number, label: string = !value ? 'then' : 'else'): string {
    return label;
}
