const value: string = 'abc';

export class IfBooleanClassGetterCondNotStringValueConst {
    public get result(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
