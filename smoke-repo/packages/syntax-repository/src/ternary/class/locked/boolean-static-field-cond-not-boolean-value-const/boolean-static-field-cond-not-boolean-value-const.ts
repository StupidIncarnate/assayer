/**
 * Specimen: ternary-boolean-class-static-field-cond-not-boolean-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 24
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

export class BooleanStaticFieldCondNotBooleanValueConst {
    public static label = !value ? 'then' : 'else';
}
