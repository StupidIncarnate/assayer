const value: number = 3;

export class TernaryBooleanClassGetterCondNotNumberValueConst {
    public get result(): string {
        return !value ? 'then' : 'else';
    }
}
