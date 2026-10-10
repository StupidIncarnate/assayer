/**
 * Specimen: ternary-string-object-literal-method-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export const stringMethodCondNullishStringValueConst = {
    run(): string {
        return value ?? '' ? 'then' : 'else';
    },
};
