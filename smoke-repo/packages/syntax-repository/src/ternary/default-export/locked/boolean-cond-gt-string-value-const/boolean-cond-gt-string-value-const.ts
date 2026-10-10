/**
 * Specimen: ternary-boolean-default-export-cond-gt-string-value-const
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

const booleanCondGtStringValueConst = (): string => {
    return value > 'm' ? 'then' : 'else';
};

export default booleanCondGtStringValueConst;
