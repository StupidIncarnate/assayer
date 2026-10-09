const value: boolean = true;

export class TernaryBooleanClassGetterCondEqBooleanValueConst {
    public get result(): string {
        return value === false ? 'then' : 'else';
    }
}
