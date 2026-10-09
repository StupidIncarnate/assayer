const value: number = 3;

export class TernaryBooleanClassGetterCondEqNumberValueConst {
    public get result(): string {
        return value === 7 ? 'then' : 'else';
    }
}
