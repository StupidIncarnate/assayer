const value: boolean = true;

export class TernaryBooleanClassGetterCondNotBooleanValueConst {
    public get result(): string {
        return !value ? 'then' : 'else';
    }
}
