/**
 * Specimen: if-number-function-declaration-body-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 22: never
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
export function numberBodyCondExternal(): string {
    if (Number(process.argv[2])) {
        return 'then';
    }
    return 'else';
}
