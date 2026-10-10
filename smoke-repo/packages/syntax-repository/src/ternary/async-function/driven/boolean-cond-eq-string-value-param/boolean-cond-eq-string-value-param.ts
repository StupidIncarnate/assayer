/**
 * Specimen: ternary-boolean-async-function-cond-eq-string-value-param
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
export async function booleanCondEqStringValueParam(value: string): Promise<string> {
    await Promise.resolve();
    return value === 'xyz' ? 'then' : 'else';
}
