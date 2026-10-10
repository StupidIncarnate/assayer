/**
 * Specimen: if-number-iife-cond-nullish-number-value-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
 * - ternary on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 22
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export const numberCondNullishNumberValueExternal = ((): string => {
    if ((process.argv[2] === undefined ? undefined : Number(process.argv[2])) ?? 0) {
        return 'then';
    }
    return 'else';
})();
