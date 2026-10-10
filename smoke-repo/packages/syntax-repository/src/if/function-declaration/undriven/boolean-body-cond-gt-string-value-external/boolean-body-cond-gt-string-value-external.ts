/**
 * Specimen: if-boolean-function-declaration-body-cond-gt-string-value-external
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
export function booleanBodyCondGtStringValueExternal(): string {
    if ((process.argv[2] ?? '') > 'm') {
        return 'then';
    }
    return 'else';
}
