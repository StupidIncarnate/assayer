/**
 * Specimen: ternary-boolean-async-function-cond-eq-boolean-value-const
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
const value: boolean = true;

export async function booleanCondEqBooleanValueConst(): Promise<string> {
    await Promise.resolve();
    return value === false ? 'then' : 'else';
}
