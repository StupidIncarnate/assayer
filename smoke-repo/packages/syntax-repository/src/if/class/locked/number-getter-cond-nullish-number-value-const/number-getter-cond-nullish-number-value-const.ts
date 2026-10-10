/**
 * Specimen: if-number-class-getter-cond-nullish-number-value-const
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
const value: number | undefined = 3;

export class NumberGetterCondNullishNumberValueConst {
    public get result(): string {
        if (value ?? 0) {
            return 'then';
        }
        return 'else';
    }
}
