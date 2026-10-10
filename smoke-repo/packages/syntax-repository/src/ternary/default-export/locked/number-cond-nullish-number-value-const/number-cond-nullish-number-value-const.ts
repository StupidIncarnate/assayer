/**
 * Specimen: ternary-number-default-export-cond-nullish-number-value-const
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
const value: number | undefined = 3;

const numberCondNullishNumberValueConst = (): string => {
    return value ?? 0 ? 'then' : 'else';
};

export default numberCondNullishNumberValueConst;
