/**
 * Specimen: ternary-boolean-async-function-cond-eq-number-value-param
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
export async function booleanCondEqNumberValueParam(value: number): Promise<string> {
    await Promise.resolve();
    return value === 7 ? 'then' : 'else';
}
