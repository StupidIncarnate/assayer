/**
 * Specimen: ternary-boolean-async-function-cond-gt-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: never
 * - ternary else on line 26: driven
 *
 * Expected lint errors:
 * - unreachable-exit on line 26
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
const value: number = 3;

export async function booleanCondGtNumberValueConst(): Promise<string> {
    await Promise.resolve();
    return value > 5 ? 'then' : 'else';
}
