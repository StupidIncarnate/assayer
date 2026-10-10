/**
 * Specimen: ternary-number-class-constructor-body-cond-const
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
const cond: number = 3;

export class NumberConstructorBodyCondConst {
    public constructor() {
        console.log(cond ? 'then' : 'else');
    }
}
