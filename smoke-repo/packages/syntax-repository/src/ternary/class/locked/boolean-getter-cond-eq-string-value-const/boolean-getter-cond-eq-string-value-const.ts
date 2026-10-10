/**
 * Specimen: ternary-boolean-class-getter-cond-eq-string-value-const
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
const value: string = 'abc';

export class BooleanGetterCondEqStringValueConst {
    public get result(): string {
        return value === 'xyz' ? 'then' : 'else';
    }
}
