/**
 * Specimen: ternary-string-class-static-field-cond-nullish-string-value-const
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
const value: string | undefined = 'abc';

export class StringStaticFieldCondNullishStringValueConst {
    public static label = value ?? '' ? 'then' : 'else';
}
