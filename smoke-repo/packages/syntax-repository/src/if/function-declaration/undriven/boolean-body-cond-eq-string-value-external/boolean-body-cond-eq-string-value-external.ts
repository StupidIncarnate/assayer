/**
 * Specimen: if-boolean-function-declaration-body-cond-eq-string-value-external
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
export function booleanBodyCondEqStringValueExternal(): string {
    if ((process.argv[2] ?? '') === 'xyz') {
        return 'then';
    }
    return 'else';
}
