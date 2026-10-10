/**
 * Specimen: ternary-string-generator-function-cond-nullish-string-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 24: one-way
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 24
 * - line 24
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export function* stringCondNullishStringValueExternal(): Generator<string> {
    yield (process.argv[2] === undefined ? undefined : process.argv[2] ?? '') ?? '' ? 'then' : 'else';
}
