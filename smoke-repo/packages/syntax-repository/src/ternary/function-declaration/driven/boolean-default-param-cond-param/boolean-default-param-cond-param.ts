/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-param
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
export function booleanDefaultParamCondParam(cond: boolean, label: string = cond ? 'then' : 'else'): string {
    return label;
}
