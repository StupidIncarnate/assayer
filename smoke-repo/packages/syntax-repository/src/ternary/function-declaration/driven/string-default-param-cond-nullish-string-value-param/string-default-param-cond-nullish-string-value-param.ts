/**
 * Specimen: ternary-string-function-declaration-default-param-cond-nullish-string-value-param
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
export function stringDefaultParamCondNullishStringValueParam(value: string | undefined, label: string = value ?? '' ? 'then' : 'else'): string {
    return label;
}
