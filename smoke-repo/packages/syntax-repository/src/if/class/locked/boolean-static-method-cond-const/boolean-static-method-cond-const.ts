/**
 * Specimen: if-boolean-class-static-method-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - if on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 28
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
const cond: boolean = true;

export class BooleanStaticMethodCondConst {
    public static run(): string {
        if (cond) {
            return 'then';
        }
        return 'else';
    }
}
