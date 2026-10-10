/**
 * Specimen: ternary-boolean-object-literal-method-cond-gt-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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

export const booleanMethodCondGtStringValueConst = {
    run(): string {
        return value > 'm' ? 'then' : 'else';
    },
};
