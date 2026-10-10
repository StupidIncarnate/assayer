/**
 * Specimen: ternary-boolean-function-declaration-default-param-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: one-way
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function booleanDefaultParamCondNullishBooleanValueExternal(label: string = (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else'): string {
    return label;
}
