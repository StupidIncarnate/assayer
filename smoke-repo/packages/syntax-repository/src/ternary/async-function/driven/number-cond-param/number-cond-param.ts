/**
 * Specimen: ternary-number-async-function-cond-param
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
export async function numberCondParam(cond: number): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
