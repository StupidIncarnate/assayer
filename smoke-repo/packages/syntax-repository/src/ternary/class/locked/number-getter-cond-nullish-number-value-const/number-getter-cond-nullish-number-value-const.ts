/**
 * Specimen: ternary-number-class-getter-cond-nullish-number-value-const
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

export class NumberGetterCondNullishNumberValueConst {
    public get result(): string {
        return value ?? 0 ? 'then' : 'else';
    }
}
