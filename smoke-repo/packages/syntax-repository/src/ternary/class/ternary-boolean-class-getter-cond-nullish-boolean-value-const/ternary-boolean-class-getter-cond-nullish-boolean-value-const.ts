const value: boolean | undefined = true;

export class TernaryBooleanClassGetterCondNullishBooleanValueConst {
    public get result(): string {
        return value ?? false ? 'then' : 'else';
    }
}
