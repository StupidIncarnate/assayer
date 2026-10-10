/**
 * Specimen: ternary-string-class-getter-cond-nullish-string-value-const
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

export class StringGetterCondNullishStringValueConst {
    public get result(): string {
        return value ?? '' ? 'then' : 'else';
    }
}
