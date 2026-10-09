const value: boolean = true;

export class IfBooleanClassMethodCondEqBooleanValueConst {
    public run(): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    }
}
