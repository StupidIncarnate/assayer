/**
 * Specimen: if-boolean-class-static-method-cond-eq-boolean-value-const
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
const value: boolean = true;

export class BooleanStaticMethodCondEqBooleanValueConst {
    public static run(): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    }
}
