/**
 * Specimen: ternary-boolean-async-function-cond-not-number-value-external
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
export async function booleanCondNotNumberValueExternal(): Promise<string> {
    await Promise.resolve();
    return !Number(process.argv[2]) ? 'then' : 'else';
}
