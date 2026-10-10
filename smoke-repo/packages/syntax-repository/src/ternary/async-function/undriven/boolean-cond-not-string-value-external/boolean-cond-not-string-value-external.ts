/**
 * Specimen: ternary-boolean-async-function-cond-not-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary then on line 24: driven
 * - ternary else on line 24: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 24
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export async function booleanCondNotStringValueExternal(): Promise<string> {
    await Promise.resolve();
    return !(process.argv[2] ?? '') ? 'then' : 'else';
}
