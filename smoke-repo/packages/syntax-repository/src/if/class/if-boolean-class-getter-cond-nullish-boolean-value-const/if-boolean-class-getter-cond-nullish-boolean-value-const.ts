const value: boolean | undefined = true;

export class IfBooleanClassGetterCondNullishBooleanValueConst {
    public get result(): string {
        if (value ?? false) {
            return 'then';
        }
        return 'else';
    }
}
