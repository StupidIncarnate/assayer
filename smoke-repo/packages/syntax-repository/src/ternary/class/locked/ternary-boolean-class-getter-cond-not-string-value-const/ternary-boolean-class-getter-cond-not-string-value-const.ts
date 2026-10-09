const value: string = 'abc';

export class TernaryBooleanClassGetterCondNotStringValueConst {
    public get result(): string {
        return !value ? 'then' : 'else';
    }
}
