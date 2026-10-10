/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-gt-string-value-param
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
export function booleanDefaultParamCondGtStringValueParam(value: string, label: string = value > 'm' ? 'then' : 'else'): string {
    return label;
}
