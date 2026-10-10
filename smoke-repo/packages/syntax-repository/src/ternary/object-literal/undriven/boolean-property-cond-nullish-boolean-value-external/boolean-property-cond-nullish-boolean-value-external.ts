/**
 * Specimen: ternary-boolean-object-literal-property-cond-nullish-boolean-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - ternary on line 24: one-way
 * - ternary on line 24: one-way
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 24
 * - line 24
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const booleanPropertyCondNullishBooleanValueExternal = {
    label: (process.argv[2] === undefined ? undefined : process.argv[2] === 'yes') ?? false ? 'then' : 'else',
};
