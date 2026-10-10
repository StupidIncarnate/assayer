/**
 * Specimen: if-boolean-class-static-method-cond-gt-string-value-const
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

export class BooleanStaticMethodCondGtStringValueConst {
    public static run(): string {
        if (value > 'm') {
            return 'then';
        }
        return 'else';
    }
}
