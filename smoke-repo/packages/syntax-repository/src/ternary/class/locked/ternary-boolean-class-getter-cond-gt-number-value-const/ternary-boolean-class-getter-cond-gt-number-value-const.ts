const value: number = 3;

export class TernaryBooleanClassGetterCondGtNumberValueConst {
    public get result(): string {
        return value > 5 ? 'then' : 'else';
    }
}
