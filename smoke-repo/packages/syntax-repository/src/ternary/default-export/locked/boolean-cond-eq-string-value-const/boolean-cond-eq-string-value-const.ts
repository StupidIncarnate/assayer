/**
 * Specimen: ternary-boolean-default-export-cond-eq-string-value-const
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

const booleanCondEqStringValueConst = (): string => {
    return value === 'xyz' ? 'then' : 'else';
};

export default booleanCondEqStringValueConst;
