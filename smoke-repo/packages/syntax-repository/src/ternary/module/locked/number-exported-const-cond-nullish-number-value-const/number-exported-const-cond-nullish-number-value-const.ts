/**
 * Specimen: ternary-number-module-exported-const-cond-nullish-number-value-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 23
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

export const numberExportedConstCondNullishNumberValueConst = value ?? 0 ? 'then' : 'else';
