/**
 * Specimen: if-string-class-static-method-cond-nullish-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 28
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

export class StringStaticMethodCondNullishStringValueConst {
    public static run(): string {
        if (value ?? '') {
            return 'then';
        }
        return 'else';
    }
}
