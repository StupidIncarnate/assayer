/**
 * Specimen: ternary-number-class-static-method-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export class NumberStaticMethodCondNullishNumberValueConst {
    public static run(): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
