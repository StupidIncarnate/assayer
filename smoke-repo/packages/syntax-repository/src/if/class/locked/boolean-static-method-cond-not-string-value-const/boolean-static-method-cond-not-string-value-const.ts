/**
 * Specimen: if-boolean-class-static-method-cond-not-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 26
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

export class BooleanStaticMethodCondNotStringValueConst {
    public static run(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
