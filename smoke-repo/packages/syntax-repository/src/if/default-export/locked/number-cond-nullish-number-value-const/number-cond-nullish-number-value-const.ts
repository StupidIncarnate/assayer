/**
 * Specimen: if-number-default-export-cond-nullish-number-value-const
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
const value: number | undefined = 3;

const numberCondNullishNumberValueConst = (): string => {
    if (value ?? 0) {
        return 'then';
    }
    return 'else';
};

export default numberCondNullishNumberValueConst;
