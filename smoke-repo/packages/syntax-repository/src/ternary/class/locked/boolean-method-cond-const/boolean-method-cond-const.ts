/**
 * Specimen: ternary-boolean-class-method-cond-const
 *
 * Verdict: locked
 *
 * Expected branches:
 * - ternary on line 25: one-way
 *
 * Expected lints:
 * - unreachable-exit on line 25
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

export class BooleanMethodCondConst {
    public run(): string {
        return cond ? 'then' : 'else';
    }
}
