const value: string = 'abc';

export class TernaryBooleanClassGetterCondGtStringValueConst {
    public get result(): string {
        return value > 'm' ? 'then' : 'else';
    }
}
