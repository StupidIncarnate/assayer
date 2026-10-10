/**
 * Specimen: ternary-boolean-generator-function-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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
const value: string = 'abc';

export function* booleanCondGtStringValueConst(): Generator<string> {
    yield value > 'm' ? 'then' : 'else';
}
