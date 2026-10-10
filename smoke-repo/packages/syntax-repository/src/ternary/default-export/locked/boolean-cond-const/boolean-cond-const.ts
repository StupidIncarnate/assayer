/**
 * Specimen: ternary-boolean-default-export-cond-const
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
const cond: boolean = true;

const booleanCondConst = (): string => {
    return cond ? 'then' : 'else';
};

export default booleanCondConst;
