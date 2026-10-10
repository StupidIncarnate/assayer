/**
 * Specimen: if-string-default-export-cond-nullish-string-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 24: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 27
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

const stringCondNullishStringValueConst = (): string => {
    if (value ?? '') {
        return 'then';
    }
    return 'else';
};

export default stringCondNullishStringValueConst;
