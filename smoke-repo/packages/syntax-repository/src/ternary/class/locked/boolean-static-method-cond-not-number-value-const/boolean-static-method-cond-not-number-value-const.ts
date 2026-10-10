/**
 * Specimen: ternary-boolean-class-static-method-cond-not-number-value-const
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
const value: number = 3;

export class BooleanStaticMethodCondNotNumberValueConst {
    public static run(): string {
        return !value ? 'then' : 'else';
    }
}
