/**
 * Specimen: if-boolean-async-function-cond-eq-number-value-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - if on line 23: both-ways
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
export async function booleanCondEqNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (value === 7) {
        return 'then';
    }
    return 'else';
}
