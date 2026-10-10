/**
 * Specimen: ternary-number-async-function-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary then on line 26: driven
 * - ternary else on line 26: never
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
const cond: number = 3;

export async function numberCondConst(): Promise<string> {
    await Promise.resolve();
    return cond ? 'then' : 'else';
}
