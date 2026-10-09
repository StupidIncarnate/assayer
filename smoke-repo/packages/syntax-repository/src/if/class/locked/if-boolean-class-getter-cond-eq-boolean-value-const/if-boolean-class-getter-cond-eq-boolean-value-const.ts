const value: boolean = true;

export class IfBooleanClassGetterCondEqBooleanValueConst {
    public get result(): string {
        if (value === false) {
            return 'then';
        }
        return 'else';
    }
}
