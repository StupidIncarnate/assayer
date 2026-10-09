const value: number = 3;

export class IfBooleanClassGetterCondNotNumberValueConst {
    public get result(): string {
        if (!value) {
            return 'then';
        }
        return 'else';
    }
}
