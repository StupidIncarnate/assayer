/**
 * Specimen: ternary-boolean-async-function-cond-gt-string-value-param
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
export async function booleanCondGtStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    return value > 'm' ? 'then' : 'else';
}
