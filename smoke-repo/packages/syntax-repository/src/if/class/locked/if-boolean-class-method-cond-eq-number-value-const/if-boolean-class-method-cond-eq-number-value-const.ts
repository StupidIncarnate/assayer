const value: number = 3;

export class IfBooleanClassMethodCondEqNumberValueConst {
    public run(): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    }
}
