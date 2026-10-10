/**
 * Specimen: ternary-boolean-default-export-cond-not-boolean-value-const
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

const booleanCondNotBooleanValueConst = (): string => {
    return !value ? 'then' : 'else';
};

export default booleanCondNotBooleanValueConst;
