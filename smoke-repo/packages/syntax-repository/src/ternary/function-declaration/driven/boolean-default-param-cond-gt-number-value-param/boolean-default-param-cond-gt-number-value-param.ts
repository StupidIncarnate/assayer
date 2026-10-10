/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-gt-number-value-param
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
export function booleanDefaultParamCondGtNumberValueParam(value: number, label: string = value > 5 ? 'then' : 'else'): string {
    return label;
}
