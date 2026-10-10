/**
 * Specimen: ternary-string-async-function-cond-nullish-string-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary on line 23: both-ways
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
export async function stringCondNullishStringValueParam(value: string | undefined): Promise<string> {
    await Promise.resolve();
    return value ?? '' ? 'then' : 'else';
}
