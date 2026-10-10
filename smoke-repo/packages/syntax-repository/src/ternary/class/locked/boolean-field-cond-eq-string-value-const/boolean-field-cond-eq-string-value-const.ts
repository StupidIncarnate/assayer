/**
 * Specimen: ternary-boolean-class-field-cond-eq-string-value-const
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
const value: string = 'abc';

export class BooleanFieldCondEqStringValueConst {
    public label = value === 'xyz' ? 'then' : 'else';
}
