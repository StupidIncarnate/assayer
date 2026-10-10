/**
 * Specimen: ternary-number-module-statement-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 23: one-way
 * - ternary on line 23: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
console.log((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0 ? 'then' : 'else');

export {};
