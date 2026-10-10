/**
 * Specimen: if-number-generator-function-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if then on line 26: never
 * - if else on line 26: never
 * - ternary then on line 26: never
 * - ternary else on line 26: never
 *
 * Expected lint errors:
 * - none
 *
 * Expected undriven errors:
 * - line 26
 * - line 26
 *
 * Expected dark spot errors:
 * - none
 *
 * Expected gap errors:
 * - none
 */
export function* numberCondNullishNumberValueExternal(): Generator<string> {
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        yield 'then';
    }
    yield 'else';
}
