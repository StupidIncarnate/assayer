/**
 * Specimen: ternary-boolean-class-getter-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export class BooleanGetterCondNullishBooleanValueConst {
    public get result(): string {
        return value ?? false ? 'then' : 'else';
    }
}
