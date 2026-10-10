/**
 * Specimen: if-boolean-async-function-cond-gt-number-value-param
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
export async function booleanCondGtNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    if (value > 5) {
        return 'then';
    }
    return 'else';
}
