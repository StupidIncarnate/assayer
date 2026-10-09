const value: boolean = true;

export class IfBooleanClassGetterCondNotBooleanValueConst {
    public get result(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
