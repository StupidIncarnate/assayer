const value: number = 3;

export class IfBooleanClassGetterCondEqNumberValueConst {
    public get result(): string {
        if (value === 7) {
            return 'then';
        }
        return 'else';
    }
}
