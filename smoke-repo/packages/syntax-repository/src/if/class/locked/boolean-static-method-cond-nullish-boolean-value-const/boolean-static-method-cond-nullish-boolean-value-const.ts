/**
 * Specimen: if-boolean-class-static-method-cond-nullish-boolean-value-const
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
const value: boolean | undefined = true;

export class BooleanStaticMethodCondNullishBooleanValueConst {
    public static run(): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
