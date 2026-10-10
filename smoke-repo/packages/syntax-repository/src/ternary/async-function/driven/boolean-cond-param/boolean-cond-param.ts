/**
 * Specimen: ternary-boolean-async-function-cond-param
 *
 * Verdict: driven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: driven
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - none
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export async function booleanCondParam(cond: boolean): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
