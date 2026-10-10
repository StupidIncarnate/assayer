/**
 * Specimen: if-number-class-method-cond-external
 *
 * Verdict: undriven
 *
 * Expected branches:
 * - if on line 23: never
 *
 * Expected lints:
 * - none
 *
 * Expected undriven lines:
 * - line 23
 *
 * Expected dark spots:
 * - none
 *
 * Expected gaps:
 * - none
 */
export class NumberMethodCondExternal {
    public run(): string {
        if (Number(process.argv[2])) {
            return 'then';
        }
        return 'else';
    }
}
